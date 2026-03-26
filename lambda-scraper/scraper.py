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
import sys
import time
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from playwright.async_api import async_playwright, Page, BrowserContext
from fake_useragent import UserAgent
from supabase import create_client

# ─────────────────────────────────────────────────────────────────────────────
# Logging (Explicit print for Lambda visibility)
# ─────────────────────────────────────────────────────────────────────────────
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_error(msg): print(f"[ERROR] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)

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

# Craigslist CTO search URL format with placeholders
CL_SEARCH_URL = (
    "https://{city}.craigslist.org/search/cto?purveyor=owner&sort=date"
    "&min_auto_year={year_min}&max_auto_year={year_max}"
    "&min_price={price_min}&max_price={price_max}"
    "&max_auto_miles={mileage_max}{posted_today_param}{title_status_param}"
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
    match = re.match(r"https?://([^:]+):([^@]*)@([^:]+):(\d+)", proxy_url)
    if not match:
        log_warn("Could not parse PROXY_URL — scraping without proxy.")
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
    log_info(f"Jitter: sleeping {delay:.2f}s")
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
    pattern = r'([\d.,]+k?)\s*(?:mi|miles?)'
    
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
    match = re.search(r"/(d{10,13}).html", url)
    return match.group(1) if match else url  # Fall back to full URL if no PID


def _extract_year(title: str) -> Optional[int]:
    """Extract 4-digit year from title (e.g. '2019 Toyota Camry')."""
    match = re.search(r"\b(19|20)\d{2}\b", title)
    return int(match.group(0)) if match else None


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

    log_info(f"[{city}] Scraping: {search_url}")

    try:
        # Decrease timeout to 20s so we don't blow Lambda's max 300s
        await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        # Wait for the first listing to ensure the page is actually populated
        try:
            # Check for BOTH old and new Craigslist selectors
            # Use state="attached" because static results might not be "visible" in the traditional sense immediately
            await page.wait_for_selector(".cl-search-result, .result-row, .gallery-card, .cl-static-search-result", timeout=10000, state="attached")
            log_info(f"[{city}] Page loaded successfully.")
        except Exception:
            log_warn(f"[{city}] Timeout waiting for listing elements. Page may be empty or blocked.")
            # await page.screenshot(path=f"/tmp/debug_{city}.png")
    except Exception as e:
        log_error(f"[{city}] Page load failed: {e}")
        log_error(f"[{city}] Failed to load search page: {e}")
        await page.close()
        return []

    page_num = 0
    while len(leads) < max_items:
        page_num += 1

        # ── Extract listings from current page ──────────────────────────────
        items = await page.query_selector_all(".cl-search-result, .result-row, li[data-pid], .cl-static-search-result")

        if not items:
            log_info(f"[{city}] No items found on page {page_num}. Done.")
            break

        for i, item in enumerate(items):
            if len(leads) >= max_items:
                break
            try:
                lead = await _parse_listing_element(item, city)
                if lead:
                    # log_info(f"[{city}] Item {i} parsed successfully: {lead.get('title')[:30]}...")
                    leads.append(lead)
            except Exception as e:
                log_warn(f"[{city}] Error parsing listing {i}: {e}")

        # ── Pagination ───────────────────────────────────────────────────────
        if len(leads) >= max_items:
            break

        # Cap at 3 pages per city per pulse (budget + time control)
        if page_num >= 3:
            log_info(f"[{city}] Reached 3-page cap. Moving on.")
            break

        next_btn = await page.query_selector("a.bd-button.cl-next-page:not([aria-disabled='true'])")
        if not next_btn:
            log_info(f"[{city}] No next page. Done.")
            break

        _jitter()
        try:
            await next_btn.click()
            await page.wait_for_load_state("domcontentloaded", timeout=20000)
        except Exception as e:
            log_warn(f"[{city}] Pagination failed: {e}")
            break

    if not leads:
        try:
            html = await page.content()
            with open(f"debug-{city}.html", "w", encoding="utf-8") as f:
                f.write(html)
            log_warn(f"[{city}] No leads found. Saved HTML to debug-{city}.html")
        except Exception as de:
            log_warn(f"[{city}] Failed to save debug HTML: {de}")

    await page.close()
    log_info(f"[{city}] Collected {len(leads)} leads.")
    return leads


async def _parse_listing_element(item, city: str) -> Optional[dict]:
    """Extract lead fields from a single Craigslist search result element."""
    try:
        # 1. External ID (PID) - Try data-pid attribute first (most reliable)
        external_id = await item.get_attribute("data-pid")
        
        # 2. Title & URL
        title_el = await item.query_selector(".posting-title, .cl-search-anchor, a.result-title, .title")
        if not title_el:
            log_warn(f"[{city}] Missing title element for item with HTML: {await item.inner_html()}")
            return None

        title = (await title_el.inner_text()).strip()
        
        # URL
        url = None
        # Either the title element itself is the <a> tag, or we must find a parent/child <a> tag inside the item
        if await title_el.get_attribute("href"):
            url = await title_el.get_attribute("href")
        else:
            a_tag = await item.query_selector("a")
            if a_tag:
                 url = await a_tag.get_attribute("href")
        if not url: 
            log_warn(f"[{city}] Missing URL for title: {title}")
            return None
        if not url.startswith("http"): url = f"https://{city}.craigslist.org{url}"

        if not external_id:
            external_id = _extract_pid(url)
        
        if not external_id:
            log_warn(f"[{city}] Could not extract PID from item or URL: {url}")
            return None

        # 3. Price
        price_el = await item.query_selector(".priceinfo, .result-price, .price")
        price_text = (await price_el.inner_text()).strip() if price_el else ""
        price = _extract_price(price_text)

        # 4. Location
        loc_el = await item.query_selector(".result-location, .result-hood, .cl-search-result-location, .location")
        location = (await loc_el.inner_text()).strip() if loc_el else city

        # 5. Post Time
        time_el = await item.query_selector("time, .meta span[title], .result-date")
        posted_at = None
        if time_el:
            dt_attr = await time_el.get_attribute("datetime")
            title_attr = await time_el.get_attribute("title")
            posted_at = dt_attr or title_attr
        
        if not posted_at:
            posted_at = datetime.now(timezone.utc).isoformat()

        # 6. Mileage
        mileage = None
        meta_el = await item.query_selector(".meta, .cl-search-result-meta")
        if meta_el:
            meta_text = (await meta_el.inner_text()).strip()
            mileage = _extract_mileage_from_meta(meta_text)
        if not mileage:
            mileage = _extract_mileage_from_meta(title)

        # 7. Year & Title Status
        year = _extract_year(title)
        title_status = 'Clean'
        title_lower = title.lower()
        if 'salvage' in title_lower or 'rebuilt' in title_lower or 'restored' in title_lower:
            title_status = 'Salvage'

        # 8. AI Margin Estimate
        ai_margin = None
        if price and price > 0:
            base_margin = price * 0.15
            if year and year < 2018:
                base_margin = price * 0.20
            ai_margin = int(base_margin)

        return {
            "external_id": external_id,
            "title": title,
            "url": url,
            "price": price,
            "location": location,
            "city": city,
            "post_time": posted_at,
            "year": year,
            "mileage": mileage,
            "title_status": title_status,
            "is_clean_title": title_status == 'Clean',
            "status": "New",
            "ai_margin": ai_margin,
            "scraped_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        log_warn(f"[{city}] Error parsing listing element: {e}")
        return None


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
        log_warn(f"Error parsing post_time: {e}")
        return True


def _matches_filters(lead: dict, params: dict) -> bool:
    """
    Apply all filters (year, price, mileage, makes/models) in Python.
    """
    try:
        # 1. Year Filter
        y_min = int(params.get("year_min") or 2010)
        y_max = int(params.get("year_max") or 2026)
        lead_year = lead.get("year")
        if lead_year:
            if not (y_min <= lead_year <= y_max):
                return False

        # 2. Price Filter
        p_min = int(params.get("price_min") or 500)
        p_max = int(params.get("price_max") or 100000)
        lead_price = lead.get("price")
        if lead_price:
            if not (p_min <= lead_price <= p_max):
                return False

        # 3. Mileage Filter
        m_max = int(params.get("mileage_max") or 250000)
        lead_mileage = lead.get("mileage")
        if lead_mileage:
            if lead_mileage > m_max:
                return False

        # 4. Keyword Filters (Makes/Models)
        makes = [m.lower() for m in (params.get("makes") or [])]
        models = [m.lower() for m in (params.get("models") or [])]
        
        if not makes and not models:
            return True
            
        title_lower = lead.get("title", "").lower()
        return any(kw in title_lower for kw in (makes + models))
        
    except Exception as e:
        log_warn(f"Filter error: {e}")
        return True


async def scrape_deep(context: BrowserContext, url: str) -> Optional[dict]:
    """
    Deep-scrape a single listing URL for mileage, VIN, photos, and description.
    Used for Unicorn detection and detail enrichment.
    """
    page = await context.new_page()
    # ── Initial Load ─────────────────────────────────────────────────────────
    try:
        log_info(f"[Deep] Navigating to: {url}")
        await page.goto(url, wait_until="networkidle", timeout=60000)
        # Wait specifically for the listing containers to appear
        try:
            await page.wait_for_selector("#postingbody", timeout=15000) # Wait for description body
        except:
            log_warn(f"[Deep] Timeout waiting for #postingbody. Proceeding anyway.")
            
    except Exception as e:
        log_error(f"[Deep] Failed to load page: {url} — {e}")
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
        log_error(f"[Deep] Parse error at {url}: {e}")
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
            log_info(f"[DB] All {len(leads)} leads already exist. Nothing new to insert.")
            return len(leads)

        # 4. Insert only the new leads
        result = db.table("leads").insert(new_leads).execute()
        log_info(f"[DB] Inserted {len(new_leads)} new leads out of {len(leads)} scraped.")
        return len(new_leads)
    except Exception as e:
        log_error(f"[DB] Upsert failed: {e}")
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

    log_info(f"Mode: {mode} | Cities: {cities} | UA: {user_agent[:60]}...")
    
    # 0. Update Scrape Run Record to 'Running'
    run_id = event.get("run_id")
    
    if run_id and SUPABASE_URL and SUPABASE_KEY:
        try:
            log_info(f"[DB] Flagging run {run_id} as Running...")
            db = create_client(SUPABASE_URL, SUPABASE_KEY)
            db.table("scrape_runs").update({
                "status": "Running",
                "started_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", run_id).execute()
        except Exception as se:
            log_error(f"[DB] Failed to flag run as Running: {se}")

    if proxy:
        log_info(f"Proxy: {proxy['server']}")
    else:
        log_warn("No proxy configured — risk of IP ban.")

    all_leads = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            proxy=proxy if proxy else None,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",   # Critical for Lambda: /dev/shm is only 64MB
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote",
                "--single-process",           # Reduces memory, avoids fork issues in Lambda
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--disable-translate",
                "--hide-scrollbars",
                "--metrics-recording-only",
                "--mute-audio",
                "--safebrowsing-disable-auto-update",
            ],
        )

        context = await browser.new_context(
            user_agent=user_agent,
            viewport={"width": 1280, "height": 800},
            locale="en-US",
            timezone_id="America/Los_Angeles",
            ignore_https_errors=True,
            permissions=[],
        )

        # Apply stealth patches to hide Playwright/Chromium bot signals
        # Manual stealth: minimum injection to pass basic checks
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
        """)

        # Inject X-Zyte-Options so Zyte API proxies through US Residential/Unblocked IPs
        await context.set_extra_http_headers({
            "X-Zyte-Options": "{\"geolocation\": \"US\"}"
        })

        if mode == "deep":
            # Single listing deep extraction
            deep_url = event.get("deep_url")
            if not deep_url:
                return {"success": False, "error": "deep_url required for deep mode"}
            result = await scrape_deep(context, deep_url)
            await browser.close()
            return {"success": True, "mode": "deep", "data": result}
        else:
            # Pulse / Far Sweep: scrape each city
            for i, city in enumerate(cities):
                if i > 0:
                    _jitter()  # Jitter between city requests

                try:
                    city_leads = await scrape_city(
                        context=context,
                        city=city,
                        params=event,
                        max_items=max_items // max(len(cities), 1),
                    )
                    if city_leads:
                        all_leads.extend(city_leads)
                except Exception as ce:
                    log_error(f"[{city}] City scrape failed: {ce}")
                    if "closed" in str(ce).lower():
                        break

        await browser.close()

    # Upsert to Supabase
    log_info(f"[SCRAPER] Done scanning all cities. Found {len(all_leads)} total leads.")
    if all_leads:
        log_info(f"[DB] First lead preview: {all_leads[0]['title']}")
        
    count = upsert_leads(all_leads, dealer_id)
    log_info(f"[DB] Upsert finished. Count returned: {count}")

    # 7. Update Scrape Run Record
    run_id = event.get("run_id")
    if run_id and SUPABASE_URL and SUPABASE_KEY:
        try:
            log_info(f"[DB] Updating run {run_id} to Success...")
            db = create_client(SUPABASE_URL, SUPABASE_KEY)
            db.table("scrape_runs").update({
                "status": "Success",
                "leads_found": count,
                "finished_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", run_id).execute()
            log_info(f"[DB] Updated run {run_id} to Success.")
        except Exception as re:
            log_error(f"[DB] Failed to update run record: {re}")

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
    """
    log_info("Lambda execution started.")
    sys.stdout.flush()  # Force CloudWatch to receive at least this line
    
    # API Gateway wraps the body as a JSON string in event["body"]
    if isinstance(event.get("body"), str):
        try:
            payload = json.loads(event["body"])
        except json.JSONDecodeError:
            log_error("Invalid JSON body received.")
            return {
                "statusCode": 400,
                "body": json.dumps({"success": False, "error": "Invalid JSON body"}),
            }
    elif isinstance(event, dict) and "body" not in event:
        payload = event
    else:
        payload = event.get("body", {})

    log_info(f"Payload received: {json.dumps(payload, indent=2) if hasattr(payload, 'keys') else payload}")

    try:
        # Check for async loop and run it
        result = asyncio.run(run_scraper(payload))
        log_info(f"Scraper execution finished. Success: {result.get('success')}")
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            "body": json.dumps(result),
        }
    except Exception as e:
        log_error(f"Global Handler Error: {str(e)}")
        # Print stack trace for better debugging in CloudWatch
        import traceback
        traceback.print_exc()
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": str(e)}),
        }
