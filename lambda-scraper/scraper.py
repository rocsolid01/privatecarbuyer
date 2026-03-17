"""
Private Car Buyer — AWS Lambda Scraper
======================================
Playwright-based Craigslist CTO (cars-by-owner) scraper.
Optimized for maximum stealth, minimum bandwidth, and direct Supabase upsert.

Invoked via: POST /scrape (AWS API Gateway)
Payload fields (all from Vercel settings):
  cities         : list[str]   — Craigslist subdomains, e.g. ["losangeles", "sfbay"]
  year_min       : int
  year_max       : int
  price_min      : int
  price_max      : int
  mileage_max    : int
  makes          : list[str]   — e.g. ["Toyota", "Honda"]
  models         : list[str]
  posted_today   : bool        — If true, add postedToday param
  max_items      : int         — Max listings to collect (default 200)
  dealer_id      : str         — UUID of the dealer (for DB linkage)
  mode           : str         — "pulse" | "deep" | "far_sweep"
  deep_url       : str         — Required only when mode == "deep"
"""

import json
import os
import random
import re
import time
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from playwright.async_api import async_playwright, Page, BrowserContext
# from playwright_stealth import stealth_async  # Removed due to pkg_resources 3.12 issue
from fake_useragent import UserAgent
from supabase import create_client

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger("pcb-scraper")

# ─────────────────────────────────────────────────────────────────────────────
# Environment
# ─────────────────────────────────────────────────────────────────────────────
PROXY_URL = os.environ.get("PROXY_URL", "")          # DataImpulse residential proxy
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")    # Service-role key (bypasses RLS)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
# Domains and resource types to block for bandwidth savings
BLOCKED_RESOURCE_TYPES = {"image", "stylesheet", "font", "media"}
BLOCKED_DOMAINS = [
    "google-analytics.com", "analytics.google.com", "googletagmanager.com",
    "doubleclick.net", "facebook.com", "facebook.net", "mixpanel.com",
    "segment.com", "hotjar.com", "optimizely.com", "craigtrack.com",
]

# Craigslist CTO search URL format
CL_SEARCH_URL = (
    "https://{city}.craigslist.org/search/cto"
    "?purveyor=owner&sort=date"
    "&min_auto_year={year_min}&max_auto_year={year_max}"
    "&min_price={price_min}&max_price={price_max}"
    "&max_auto_miles={mileage_max}"
    "{posted_today_param}"
    "{title_status_param}"
)

# Jitter range between page requests (seconds)
JITTER_MIN = 2.0
JITTER_MAX = 5.0

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_proxy(proxy_url: str) -> Optional[dict]:
    """Parse a DataImpulse-style proxy URL into Playwright proxy dict."""
    if not proxy_url:
        return None
    # Format: http://user:password@host:port
    match = re.match(r"https?://([^:]+):([^@]+)@([^:]+):(\d+)", proxy_url)
    if not match:
        log.warning("Could not parse PROXY_URL — scraping without proxy.")
        return None
    user, password, host, port = match.groups()
    return {
        "server": f"http://{host}:{port}",
        "username": user,
        "password": password,
    }


def _get_user_agent() -> str:
    """Pick one random realistic User-Agent per Lambda invocation."""
    try:
        ua = UserAgent(browsers=["chrome", "firefox"], os=["windows", "macos", "linux"])
        return ua.random
    except Exception:
        # Fallback if fake-useragent fails to fetch its DB
        return (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )


def _jitter():
    """Random sleep between requests to avoid traffic pattern detection."""
    delay = random.uniform(JITTER_MIN, JITTER_MAX)
    log.info(f"Jitter: sleeping {delay:.2f}s")
    time.sleep(delay)


def _extract_price(text: str) -> Optional[int]:
    """Extract integer price from strings like '$12,500' or '12500'."""
    if not text:
        return None
    cleaned = re.sub(r"[^0-9]", "", text)
    return int(cleaned) if cleaned else None


def _extract_mileage(text: str) -> Optional[int]:
    """Extract integer mileage from strings like '45,000mi' or '45000'."""
    if not text:
        return None
    cleaned = re.sub(r"[^0-9]", "", text)
    return int(cleaned) if cleaned else None


def _extract_mileage_from_meta(text: str) -> Optional[int]:
    """Helper to extract mileage from search result meta text like '110k mi' or '91,000 miles'."""
    if not text:
        return None
    
    # regex matches: numbers followed by 'k' (optional) and 'mi' or 'miles'
    # Support commas in the number
    pattern = r'([\d\.,]+k?)\s*(?:mi|miles?)'
    
    for match in re.finditer(pattern, text, re.IGNORECASE):
        val_str = match.group(1).lower()
        full_match = match.group(0).lower()
        
        # Check surrounding for 'away' or 'from' to skip distance (e.g. '1 mi away')
        # Also check if it's a very low number being used for distance (usually < 100)
        start, end = match.span()
        context = text[end:end+15].lower()
        
        # If it says 'away' or 'from' immediately after, it's definitely distance
        if 'away' in context or 'from' in context:
            continue
            
        try:
            temp = val_str.replace(',', '')
            if temp.endswith('k'):
                mileage = int(float(temp[:-1]) * 1000)
            else:
                mileage = int(float(temp))
            
            # Distance protection: if it's less than 500 and matched 'mi' 
            # without 'miles', it's highly likely to be distance (e.g. '1 mi')
            # Real car mileage is almost always > 500.
            if mileage < 500 and ('miles' not in full_match):
                continue
                
            return mileage
        except ValueError:
            continue
    return None


def _extract_pid(url: str) -> Optional[str]:
    """Extract Craigslist post ID (PID) from a listing URL."""
    # URL pattern: https://city.craigslist.org/cto/d/title/7654321234.html
    match = re.search(r"/(\d{10,13})\.html", url)
    return match.group(1) if match else url  # Fall back to full URL if no PID


# ─────────────────────────────────────────────────────────────────────────────
# Route-aborting: Drop images, CSS, fonts, analytics — saves ~90% bandwidth
# ─────────────────────────────────────────────────────────────────────────────
async def _abort_unnecessary_requests(route, request):
    """Intercept all requests and abort non-essential ones."""
    # Block by resource type
    if request.resource_type in BLOCKED_RESOURCE_TYPES:
        await route.abort()
        return
    # Block by domain
    url = request.url
    if any(blocked in url for blocked in BLOCKED_DOMAINS):
        await route.abort()
        return
    # Allow everything else (HTML, JS, XHR needed for page load)
    await route.continue_()


# ─────────────────────────────────────────────────────────────────────────────
# Core Scraper
# ─────────────────────────────────────────────────────────────────────────────
async def scrape_city(
    context: BrowserContext,
    city: str,
    params: dict,
    max_items: int,
) -> list[dict]:
    """
    Scrape a single Craigslist city CTO search page (and paginate if needed).
    Returns a list of raw lead dicts.
    """
    leads = []
    page = await context.new_page()

    # Attach route-aborting to this page
    # await page.route("**/*", _abort_unnecessary_requests)

    posted_today_param = "&postedToday=1" if params.get("posted_today") else ""

    search_url = CL_SEARCH_URL.format(
        city=city,
        year_min=params.get("year_min", 2015),
        year_max=params.get("year_max", 2026),
        price_min=params.get("price_min", 1000),
        price_max=params.get("price_max", 50000),
        mileage_max=params.get("mileage_max", 200000),
        posted_today_param=posted_today_param,
        title_status_param="&auto_title_status=1" if params.get("exclude_salvage") else "",
    )

    log.info(f"[{city}] Scraping: {search_url}")

    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        # Wait for the first listing to ensure the page is actually populated
        try:
            await page.wait_for_selector(".cl-search-result, .result-row", timeout=10000)
        except Exception:
            log.warning(f"[{city}] Timeout waiting for listing elements.")
            await page.screenshot(path=f"debug_{city}.png")
    except Exception as e:
        log.error(f"[{city}] Failed to load search page: {e}")
        await page.close()
        return []

    page_num = 0
    while len(leads) < max_items:
        page_num += 1
        log.info(f"[{city}] Parsing page {page_num} ({len(leads)} leads so far)")

        # ── Extract listings from current page ──────────────────────────────
        # Craigslist uses .cl-search-result / .result-row depending on version
        items = await page.query_selector_all(".cl-search-result, .result-row")

        if not items:
            log.info(f"[{city}] No items found on page {page_num}. Done.")
            break

        for item in items:
            if len(leads) >= max_items:
                break
            try:
                lead = await _parse_listing_element(item, city)
                if lead:
                    # ── Post Age Filter ──────────────────────────────────────
                    post_age_max = params.get("post_age_max", 24)
                    if not _is_within_age_limit(lead, post_age_max):
                        log.info(f"[{city}] Skipping old lead: {lead['title']} (over {post_age_max}h)")
                        continue

                    # Apply keyword filters (makes/models) if provided
                    if _matches_filters(lead, params):
                        leads.append(lead)
            except Exception as e:
                log.warning(f"[{city}] Error parsing listing: {e}")
                continue

        # ── Pagination ───────────────────────────────────────────────────────
        if len(leads) >= max_items:
            break

        # Cap at 3 pages per city per pulse (budget + time control)
        if page_num >= 3:
            log.info(f"[{city}] Reached 3-page cap. Moving on.")
            break

        next_btn = await page.query_selector("a.bd-button.cl-next-page:not([aria-disabled='true'])")
        if not next_btn:
            log.info(f"[{city}] No next page. Done.")
            break

        _jitter()
        try:
            await next_btn.click()
            await page.wait_for_load_state("domcontentloaded", timeout=20000)
        except Exception as e:
            log.warning(f"[{city}] Pagination failed: {e}")
            break

    await page.close()
    log.info(f"[{city}] Collected {len(leads)} leads.")
    return leads


async def _parse_listing_element(item, city: str) -> Optional[dict]:
    """Extract lead fields from a single Craigslist search result element."""
    # Title & URL
    # Updated selectors: .posting-title, .result-title, or the new .cl-search-anchor
    title_el = await item.query_selector("a.posting-title, a.result-title, a.cl-search-anchor")
    if not title_el:
        return None

    title = (await title_el.inner_text()).strip()
    url = await title_el.get_attribute("href")

    # Ensure absolute URL
    if url and not url.startswith("http"):
        url = f"https://{city}.craigslist.org{url}"

    # Price
    # Updated selectors to include .priceinfo
    price_el = await item.query_selector(".priceinfo, .result-price")
    price_text = (await price_el.inner_text()).strip() if price_el else ""
    price = _extract_price(price_text)

    # Location
    # Updated selectors to include .result-location (new Craigslist UI)
    loc_el = await item.query_selector(".result-location, .meta .location, .result-hood")
    location = (await loc_el.inner_text()).strip() if loc_el else city

    # Post time (Craigslist embeds datetime in <time> element)
    time_el = await item.query_selector("time")
    posted_at = None
    if time_el:
        dt_attr = await time_el.get_attribute("datetime")
        posted_at = dt_attr if dt_attr else None

    if not posted_at:
        posted_at = datetime.now(timezone.utc).isoformat()

    # Extract PID from URL for dedup key
    external_id = _extract_pid(url) if url else None
    if not external_id:
        return None

    # Mileage (If available in meta container)
    mileage = None
    meta_el = await item.query_selector(".meta")
    if meta_el:
        meta_text = (await meta_el.inner_text()).strip()
        mileage = _extract_mileage_from_meta(meta_text)
    
    # Fallback: Extract from title if meta mileage is missing or zero
    if not mileage:
        mileage = _extract_mileage_from_meta(title)

    # Title Status (Salvage Detection)
    # If the user excluded salvage, all results are 'Clean'. 
    # Otherwise, check the title for keywords.
    title_status = 'Clean'
    if 'salvage' in title.lower() or 'rebuilt' in title.lower():
        title_status = 'Salvage'

    return {
        "external_id": external_id,
        "title": title,
        "price": price,
        "location": location,
        "url": url,
        "post_time": posted_at,
        "mileage": mileage,
        "title_status": title_status,
        "vin": None,         # Only available on detail page
        "photos": [],        # Not scraped on list page (bandwidth saving)
        "status": "New",
    }


def _is_within_age_limit(lead: dict, max_hours: int) -> bool:
    """Check if the lead's post_time is within the allowed hours."""
    posted_at_str = lead.get("post_time")
    if not posted_at_str:
        return True  # If no time, assume new for safety
    try:
        # ISO format: 2024-03-16T12:00:00Z or similar
        posted_at = datetime.fromisoformat(posted_at_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff_hours = (now - posted_at).total_seconds() / 3600
        return diff_hours <= max_hours
    except Exception as e:
        log.warning(f"Error parsing post_time: {e}")
        return True


def _matches_filters(lead: dict, params: dict) -> bool:
    """
    Apply makes/models keyword filter to a lead's title.
    If no filters configured, all leads pass.
    """
    makes = [m.lower() for m in (params.get("makes") or [])]
    models = [m.lower() for m in (params.get("models") or [])]
    if not makes and not models:
        return True  # No filter = accept all

    title_lower = lead.get("title", "").lower()
    return any(kw in title_lower for kw in makes + models)


async def scrape_deep(context: BrowserContext, url: str) -> Optional[dict]:
    """
    Deep-scrape a single listing URL for mileage, VIN, photos, and description.
    Used for Unicorn detection and detail enrichment.
    """
    page = await context.new_page()
    # await page.route("**/*", _abort_unnecessary_requests)

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        log.error(f"[Deep] Failed to load: {url} — {e}")
        await page.close()
        return None

    try:
        # Description
        desc_el = await page.query_selector("#postingbody")
        description = (await desc_el.inner_text()).strip() if desc_el else ""

        # Attributes (mileage, odometer, VIN, condition)
        attrs: dict = {}
        attr_groups = await page.query_selector_all(".attrgroup span")
        for attr in attr_groups:
            text = (await attr.inner_text()).strip()
            if ":" in text:
                key, _, val = text.partition(":")
                attrs[key.strip().lower()] = val.strip()
            else:
                attrs[text.lower()] = True

        mileage_text = attrs.get("odometer") or attrs.get("mileage") or ""
        mileage = _extract_mileage(str(mileage_text)) if mileage_text else None
        vin = attrs.get("vin") or None

        # Photo URLs (from og:image meta tags or .slide img src)
        photo_els = await page.query_selector_all(".slide img")
        photos = []
        for img in photo_els[:10]:  # Cap at 10 photos
            src = await img.get_attribute("src")
            if src:
                photos.append(src)

        return {
            "description": description,
            "mileage": mileage,
            "vin": vin,
            "photos": photos,
            "attributes": attrs,
        }
    except Exception as e:
        log.error(f"[Deep] Parse error at {url}: {e}")
        return None
    finally:
        await page.close()


# ─────────────────────────────────────────────────────────────────────────────
# Supabase Upsert
# ─────────────────────────────────────────────────────────────────────────────
def upsert_leads(leads: list[dict], dealer_id: str) -> int:
    """
    Upsert leads into Supabase.
    - New leads: inserted with status='New'
    - Existing leads (same external_id): only last_seen_at is updated
      (this keeps status/notes intact and marks the listing as still active)
    Returns count of processed rows.
    """
    if not leads or not SUPABASE_URL or not SUPABASE_KEY:
        return 0

    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Attach dealer_id to every lead
    for lead in leads:
        lead["dealer_id"] = dealer_id

    try:
        # 1. Extract all external_ids
        external_ids = [lead["external_id"] for lead in leads if "external_id" in lead]
        
        # 2. Query Supabase for existing external_ids
        # PostgREST max URL length is high, but we can do it in one sweep for < 200 items
        existing_res = db.table("leads").select("external_id").in_("external_id", external_ids).execute()
        existing_ids = {row["external_id"] for row in existing_res.data}
        
        # 3. Filter only completely new leads
        new_leads = [lead for lead in leads if lead["external_id"] not in existing_ids]

        if not new_leads:
            log.info(f"[DB] All {len(leads)} leads already exist. Nothing new to insert.")
            return len(leads)

        # 4. Insert only the new leads
        result = db.table("leads").insert(new_leads).execute()
        log.info(f"[DB] Inserted {len(new_leads)} new leads out of {len(leads)} scraped.")
        return len(new_leads)
    except Exception as e:
        log.error(f"[DB] Upsert failed: {e}")
        raise


# ─────────────────────────────────────────────────────────────────────────────
# Main async scraper
# ─────────────────────────────────────────────────────────────────────────────
async def run_scraper(event: dict) -> dict:
    """
    Main entrypoint. Receives event dict from Lambda handler.
    """
    mode = event.get("mode", "pulse")
    dealer_id = event.get("dealer_id", "00000000-0000-0000-0000-000000000000")
    cities = event.get("cities", ["losangeles"])
    max_items = int(event.get("max_items", 200))

    proxy = _parse_proxy(PROXY_URL)
    user_agent = _get_user_agent()

    log.info(f"Mode: {mode} | Cities: {cities} | UA: {user_agent[:60]}...")
    if proxy:
        log.info(f"Proxy: {proxy['server']}")
    else:
        log.warning("No proxy configured — risk of IP ban.")

    all_leads = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            proxy=proxy if proxy else None,
        )

        context = await browser.new_context(
            user_agent=user_agent,
            viewport={"width": 1280, "height": 800},
            locale="en-US",
            timezone_id="America/Los_Angeles",
            # Disable WebRTC to prevent IP leak through browser APIs
            permissions=[],
        )

        # Apply stealth patches to hide Playwright/Chromium bot signals
        # await stealth_async(context)
        # Manual stealth: minimum injection to pass basic checks
        # await context.add_init_script("""
        #     Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        #     window.chrome = { runtime: {} };
        # """)

        if mode == "deep":
            # Single listing deep extraction
            deep_url = event.get("deep_url")
            if not deep_url:
                return {"success": False, "error": "deep_url required for deep mode"}
            result = await scrape_deep(context, deep_url)
            await browser.close()
            return {"success": True, "mode": "deep", "data": result}

        # Pulse / Far Sweep: scrape each city
        for i, city in enumerate(cities):
            if i > 0:
                _jitter()  # Jitter between city requests

            city_leads = await scrape_city(
                context=context,
                city=city,
                params=event,
                max_items=max_items // max(len(cities), 1),  # Distribute budget across cities
            )
            all_leads.extend(city_leads)

        await browser.close()

    # Upsert to Supabase
    count = upsert_leads(all_leads, dealer_id)

    return {
        "success": True,
        "mode": mode,
        "cities": cities,
        "count": count,
        "leads_preview": [
            {"title": l["title"], "price": l["price"], "url": l["url"]}
            for l in all_leads[:5]   # Return first 5 for logging/debug
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Lambda Handler
# ─────────────────────────────────────────────────────────────────────────────
def handler(event, context):
    """
    AWS Lambda entry point.
    Receives either:
      - Raw dict from API Gateway (application/json body auto-parsed by Lambda)
      - event["body"] string if called via API Gateway HTTP integration
    """
    # API Gateway wraps the body as a JSON string in event["body"]
    if isinstance(event.get("body"), str):
        try:
            payload = json.loads(event["body"])
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "body": json.dumps({"success": False, "error": "Invalid JSON body"}),
            }
    elif isinstance(event, dict) and "body" not in event:
        # Direct Lambda invocation (e.g., from Vercel server-to-server)
        payload = event
    else:
        payload = event.get("body", {})

    log.info(f"Lambda invoked. Payload keys: {list(payload.keys())}")

    try:
        result = asyncio.run(run_scraper(payload))
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(result),
        }
    except Exception as e:
        log.error(f"Handler error: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": str(e)}),
        }
