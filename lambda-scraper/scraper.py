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
    
    # 1. Broadening Regex: Support raw numbers, k suffix, and comma separators
    # Use boundaries correctly and prioritize longer matches
    pattern = r'\b(\d{1,3}(?:[,\s]\d{3})+k?|\d{1,6}k?|\d+(?:\.\d+)?k)\b\s*(mi|miles?|odometer)?'
    
    best_match = None
    best_score = -1 # Score based on presence of units
    
    for match in re.finditer(pattern, text, re.IGNORECASE):
        start, _ = match.span()
        # Explicitly skip if preceded by $ (handles both $12,000 and $ 12,000)
        if start > 0 and (text[start-1] == '$' or (start > 1 and text[start-1] == ' ' and text[start-2] == '$')):
            continue

        val_str = match.group(1).lower().replace(',', '').replace(' ', '')
        unit_str = match.group(2).lower() if match.group(2) else ""
        
        try:
            # Handle 'k' multiplier
            if val_str.endswith('k'):
                mileage = int(float(val_str[:-1]) * 1000)
            else:
                mileage = int(float(val_str))
            
            # Guard: Skip obvious car years (2010-2026) if no mileage indicators
            if 2010 <= mileage <= 2026 and not unit_str:
                continue

            # Guard: Distance protection (usually < 500)
            if mileage < 500 and not unit_str:
                continue
                
            # Scoring: unit exists > no unit
            score = 2 if unit_str else 0
            if val_str.endswith('k'): score += 1
            
            if score > best_score:
                best_score = score
                best_match = mileage
                
        except (ValueError, OverflowError):
            continue
            
    return best_match


def _extract_pid(url: str) -> Optional[str]:
    """Extract Craigslist post ID (PID) from a listing URL."""
    # URL pattern: https://city.craigslist.org/cto/d/title/7654321234.html
    match = re.search(r"/(\d{10,13})\.html", url)
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
    existing_pids: Optional[set[str]] = None,
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
            await page.wait_for_selector(".cl-search-result, .result-row, .gallery-card, .cl-static-search-result, .result-node", timeout=10000, state="attached")
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

        log_info(f"[{city}] Page loaded successfully. Title: {await page.title()}. Waiting for results...")
        try:
            # Wait for either new or old Craigslist UI listing container
            await page.wait_for_selector(".cl-search-result, .result-node, .gallery-card, .result-row", timeout=15000)
        except Exception:
            log_warn(f"[{city}] Timeout waiting for listing selectors. Proceeding anyway.")
            # DIAGNOSTIC: Log more HTML to see what we DID get
            try:
                content = await page.content()
                log_info(f"[{city}] HTML Snippet (first 2000): {content[:2000].replace('\\n', ' ')}")
                # Check for common "blocked" or "empty" markers
                if "blocked" in content.lower(): log_error(f"[{city}] DETECTED: Page contains 'blocked'.")
                if "human" in content.lower(): log_error(f"[{city}] DETECTED: Page contains 'human' (CAPTCHA).")
                
                div_count = await page.evaluate("document.querySelectorAll('div').length")
                log_info(f"[{city}] Page has {div_count} DIV elements.")
            except: pass

        # ── Extract listings from current page ──────────────────────────────
        # Use a very broad selector to catch any listing-like element
        SEARCH_SELECTORS = [
            ".cl-search-result",
            ".result-node",
            ".result-row",
            ".gallery-card",
            "li.cl-static-search-result",
            ".cl-search-result-container",
            "div[data-pid]"
        ]
        items = await page.query_selector_all(", ".join(SEARCH_SELECTORS))
        log_info(f"[{city}] Found {len(items)} raw DOM items on page {page_num}.")

        # ── HYBRID FALLBACK: JSON-LD Parsing ──────────────────────────────
        json_leads = []
        if not items:
            log_info(f"[{city}] No DOM items found. Attempting JSON-LD fallback...")
            try:
                # Use evaluate to get the JSON content directly from the script tag
                json_text = await page.evaluate("document.getElementById('ld_searchpage_results')?.textContent")
                if json_text:
                    data = json.loads(json_text)
                    elements = data.get("itemListElement", []) if isinstance(data, dict) else []
                    log_info(f"[{city}] Found {len(elements)} items in JSON-LD.")
                    for el in elements:
                        item_data = el.get("item", {})
                        url = item_data.get("url")
                        
                        # Hardened URL/PID extraction
                        import re
                        pid = None
                        if url:
                            pid_match = re.search(r'/(\d+)\.html', url)
                            if pid_match: pid = pid_match.group(1)
                        
                        if not pid:
                            # Try to find PID in other fields if URL is missing
                            # Sometimes PID is in the image URL or a specific ID field
                            image_url = item_data.get("image", [""])[0] if isinstance(item_data.get("image"), list) else item_data.get("image", "")
                            if image_url:
                                pid_match = re.search(r'/([A-Za-z0-9_]{10,})_', image_url) # Craigslist image IDs
                                # Note: image IDs are not PIDs, but they are unique
                        
                        if url:
                            json_leads.append({
                                "external_id": pid or url,
                                "url": url,
                                "title": item_data.get("name", "No Title"),
                                "price": str(item_data.get("offers", {}).get("price", "0")),
                                "image": image_url if 'image_url' in locals() else item_data.get("image", ""),
                                "city": city
                            })
            except Exception as je:
                log_warn(f"[{city}] JSON-LD fallback failed: {je}")

        if not items and not json_leads:
            log_info(f"[{city}] No items found at all via DOM or JSON-LD on page {page_num}. Done.")
            break

        # ── Process items ────────────────────────────────────────────────────
        deep_scrape_count = 0
        MAX_DEEP_SCRAPES_PER_CITY = 15 # Guard against Lambda timeout
        
        for i, item in enumerate(items):
            if len(leads) >= max_items:
                break
            try:
                lead = await _parse_listing_element(item, city)
                if lead:
                    pid = lead.get("external_id")
                    
                    # 1. Skip if already in DB
                    if existing_pids and pid in existing_pids:
                        # log_info(f"[{city}] Skipping duplicate PID: {pid}")
                        continue
                    
                    # 2. Conditional Deep Scrape if mileage is missing
                    # Only if we haven't hit our safety budget for this city
                    if not lead.get("mileage") and deep_scrape_count < MAX_DEEP_SCRAPES_PER_CITY:
                        log_info(f"[{city}] Missing mileage for {pid}. Performing conditional deep scrape...")
                        _jitter() # Be nice
                        details = await scrape_deep(context, lead["url"])
                        deep_scrape_count += 1
                        
                        if details:
                            if details.get("mileage"):
                                lead["mileage"] = details["mileage"]
                                log_info(f"[{city}] Successfully recovered mileage: {lead['mileage']}")
                            
                            # Map additional details to DB columns
                            if details.get("description"):
                                # Use ai_notes as the destination for the raw description if it's short, or truncated
                                lead["ai_notes"] = details["description"][:2000] # Cap to reasonable length
                            if details.get("photos"):
                                lead["photos"] = details["photos"]
                            if details.get("vin"):
                                lead["vin"] = details["vin"]
                            if details.get("license_plate"):
                                lead["license_plate"] = details["license_plate"]

                    leads.append(lead)
            except Exception as e:
                log_warn(f"[{city}] Error parsing listing {i}: {e}")

        # 2. Add JSON-LD leads if DOM failed (or just to fill gaps)
        for jl in json_leads:
            if len(leads) >= max_items:
                break
            
            pid = jl.get("external_id")
            if existing_pids and pid in existing_pids:
                # log_info(f"[{city}] Skipping duplicate JSON PID: {pid}")
                continue

            if not any(l["url"] == jl["url"] for l in leads):
                leads.append(jl)

        # ── Pagination ───────────────────────────────────────────────────────
        if len(leads) >= max_items:
            break

        # Cap at 3 pages per city per pulse (budget + time control)
        if page_num >= 3:
            log_info(f"[{city}] Reached 3-page cap. Moving on.")
            break

        next_btn = await page.query_selector("a.cl-next-page, button.cl-next-page, .cl-next-result, a.bd-button.cl-next-page:not([aria-disabled='true'])")
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
            debug_path = f"/tmp/debug-{city}.html"
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html)
            log_warn(f"[{city}] No leads found. Saved HTML to {debug_path}")
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
        title_el = await item.query_selector(".posting-title, .cl-app-anchor, .cl-search-anchor, a.result-title, .title")
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

        # 6. Mileage — try multiple selectors to cover old+new Craigslist UI
        mileage = None
        meta_text = ""
        # Strategy 1: The old and new '.meta' container
        for meta_selector in [".meta", ".result-meta-text", ".cl-search-result-info", ".meta-text"]:
            meta_el = await item.query_selector(meta_selector)
            if meta_el:
                meta_text = (await meta_el.inner_text()).strip()
                mileage = _extract_mileage_from_meta(meta_text)
                if mileage:
                    break
        # Strategy 2: Scan ALL inner text of the card for mileage patterns
        if not mileage:
            try:
                full_card_text = (await item.inner_text()).strip()
                mileage = _extract_mileage_from_meta(full_card_text)
                if mileage:
                    meta_text = full_card_text
            except Exception:
                pass
        
        # Strategy 3: Target title directly with a specialized pattern if still missing
        if not mileage:
            # Look for "2019 Ford Fiesta 117k" or "2019 Ford Fiesta 117000"
            # We look for a number (optionally with k) at the END of the title
            title_match = re.search(r'\s(\d{1,3}k|\d{4,6}k|\d{4,6})\s*$', title, re.IGNORECASE)
            if title_match:
                val = title_match.group(1).lower()
                try:
                    if val.endswith('k'):
                        mileage = int(float(val[:-1]) * 1000)
                    else:
                        mileage = int(val)
                except:
                    pass
        
        if not mileage:
            mileage = _extract_mileage_from_meta(title)

        # 7. Year & Title Status
        year = _extract_year(title)
        title_status = 'Clean'
        title_lower = title.lower()
        if 'salvage' in title_lower or 'rebuilt' in title_lower or 'restored' in title_lower:
            title_status = 'Salvage'

        # 8. VIN — try to extract from title or meta text (some sellers include it)
        # Standard VIN: 17 chars, no I, O, Q
        vin = None
        search_text = f"{title} {meta_text}"
        vin_match = re.search(r'\b[A-HJ-NPR-Z0-9]{17}\b', search_text)
        if vin_match:
            vin = vin_match.group(0)
            log_info(f"[{city}] VIN found in listing card: {vin}")

        # 9. AI Margin Estimate
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
            "vin": vin,
            "title_status": title_status,
            "is_clean_title": title_status == 'Clean',
            "status": "New",
            "ai_margin": ai_margin,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "meta_text": meta_text if 'meta_text' in locals() else None
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
        # Use a generous timeout but wait for networkidle
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # Wait specifically for the listing containers to appear
        try:
            # .attrgroup contains the structured car data
            await page.wait_for_selector(".attrgroup, #postingbody", timeout=10000)
        except:
            log_warn(f"[Deep] Timeout waiting for key elements on {url}. Proceeding with partial data.")
            
    except Exception as e:
        log_error(f"[Deep] Failed to load page: {url} — {e}")
        await page.close()
        return None

    try:
        # 1. Description
        desc_el = await page.query_selector("#postingbody")
        description = ""
        if desc_el:
            # Remove the "QR Code Link to This Post" text if present
            full_text = await desc_el.inner_text()
            description = full_text.replace("QR Code Link to This Post", "").strip()

        # 2. Attributes (mileage, odometer, VIN, condition)
        attrs: dict = {}
        odometer = None
        
        # Strategy A: Direct Selector for Odometer (New Craigslist UI)
        try:
            # This is the most reliable selector found in browser inspection
            odo_elem = await page.query_selector(".attr.auto_miles .valu, .attr.odometer .valu")
            if odo_elem:
                odometer_text = (await odo_elem.inner_text()).strip()
                odometer = _extract_mileage(odometer_text)
                log_info(f"[Deep] Found odometer via specific selector: {odometer}")
        except Exception as e:
            log_warn(f"[Deep] Error with specific odometer selector: {e}")

        # Strategy B: Attribute Group Parsing (Broad Fallback)
        attr_spans = await page.query_selector_all(".attrgroup span")
        for span in attr_spans:
            text = (await span.inner_text()).strip()
            if ":" in text:
                key, _, val = text.partition(":")
                k = key.strip().lower()
                v = val.strip().lower()
                attrs[k] = v
                if "odometer" in k and not odometer:
                    odometer = _extract_mileage(v)
                    log_info(f"[Deep] Found odometer via attrgroup text: {odometer}")
            else:
                # Boolean attributes or labels
                attrs[text.lower()] = True
        
        # Strategy C: Odometer from description (Final Fallback)
        if not odometer and description:
            odometer = _extract_mileage_from_meta(description)
            if odometer:
                log_info(f"[Deep] Found odometer in description text: {odometer}")

        # 3. VIN — from attributes, then description
        vin = attrs.get("vin") or None
        if not vin and description:
            vin_match = re.search(r'\b[A-HJ-NPR-Z0-9]{17}\b', description)
            if vin_match:
                vin = vin_match.group(0)

        # 4. License Plate — sellers sometimes include in description
        # Matches patterns like "plate: 7ABC123", "license: ABC1234", or standalone plate refs
        license_plate = None
        if description:
            plate_match = re.search(
                r'(?:plate|license\s*plate|lic\.?|reg\.?)\s*[:#]?\s*([A-Z0-9]{2,8})',
                description, re.IGNORECASE
            )
            if plate_match:
                license_plate = plate_match.group(1).upper()
                log_info(f"[Deep] License plate found: {license_plate}")

        # 4. Photo URLs (from .slide img or meta)
        photos = []
        try:
            photo_els = await page.query_selector_all(".slide img, .gallery img")
            for img in photo_els[:12]:  # Cap at 12 photos
                src = await img.get_attribute("src")
                if src:
                    # Convert thumbnail URLs to full size if possible
                    # Craigslist thumbs: 50x50c or 300x225
                    full_src = src.replace("50x50c", "600x450").replace("300x225", "600x450")
                    photos.append(full_src)
        except: pass

        return {
            "description": description,
            "mileage": odometer,
            "vin": vin,
            "license_plate": license_plate,
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

    # Define valid columns for Supabase 'leads' table (preventing insertion errors if extra keys like 'description' exist)
    VALID_COLUMNS = {
        "external_id", "title", "price", "mileage", "vin", "license_plate", "location", "url", "photos",
        "post_time", "ai_margin", "ai_notes", "status", "dealer_id", "created_at",
        "city", "year", "title_status", "is_clean_title", "scraped_at", "meta_text", "raw_title"
    }

    leads_to_save = []
    for lead in leads:
        clean_lead = {k: v for k, v in lead.items() if k in VALID_COLUMNS}
        clean_lead["dealer_id"] = dealer_id
        leads_to_save.append(clean_lead)

    try:
        # 1. Extract all external_ids
        external_ids = [l["external_id"] for l in leads_to_save if "external_id" in l]
        
        # 2. Query Supabase for existing leads to check mileage status
        existing_res = db.table("leads").select("external_id, mileage").in_("external_id", external_ids).execute()
        existing_data = {row["external_id"]: row.get("mileage") for row in existing_res.data}
        
        # 3. Filter only completely new leads
        new_leads = [l for l in leads_to_save if l["external_id"] not in existing_data]
        
        # 4. Identify existing leads that need a mileage update
        update_leads = []
        for l in leads_to_save:
            ext_id = l["external_id"]
            if ext_id in existing_data and existing_data[ext_id] is None and l.get("mileage") is not None:
                update_leads.append(l)

        processed_count = 0
        
        # 5. Insert new leads
        if new_leads:
            db.table("leads").insert(new_leads).execute()
            log_info(f"[DB] Inserted {len(new_leads)} new leads.")
            processed_count += len(new_leads)

        # 6. Update mileage for existing leads if found
        if update_leads:
            log_info(f"[DB] Found {len(update_leads)} existing leads needing mileage updates.")
            for ul in update_leads:
                try:
                    db.table("leads").update({"mileage": ul["mileage"]}).eq("external_id", ul["external_id"]).execute()
                    log_info(f"[DB] Updated mileage for {ul['external_id']} to {ul['mileage']}")
                    processed_count += 1
                except Exception as ue:
                    log_error(f"[DB] Failed to update mileage for {ul['external_id']}: {ue}")

        return processed_count
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
        # Define a specific User-Agent string
        USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

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
            user_agent=USER_AGENT,
            viewport={"width": 1280, "height": 800},
            locale="en-US",
            timezone_id="America/Los_Angeles",
            ignore_https_errors=True,
            permissions=[],
        )

        # Advanced stealth patches to hide Playwright/Chromium bot signals
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            window.chrome = { runtime: {} };
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
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
                    # 1. Fetch existing PIDs for this dealer to avoid counting them
                    existing_pids = set()
                    try:
                        db = create_client(SUPABASE_URL, SUPABASE_KEY)
                        # We only care about PIDs from this city to keep the set small
                        # and only from the last 30 days to keep performance high
                        res = (db.table("leads")
                            .select("external_id")
                            .eq("dealer_id", dealer_id)
                            .eq("city", city)
                            .execute())
                        existing_pids = {row["external_id"] for row in res.data}
                        log_info(f"[{city}] Initialized with {len(existing_pids)} existing PIDs.")
                    except Exception as pe:
                        log_warn(f"[{city}] Could not fetch existing PIDs: {pe}")

                    # Calculate dynamic target to ensure we hit the total max_items
                    remaining_cities = len(cities) - i
                    target = (max_items - len(all_leads) + remaining_cities - 1) // remaining_cities
                    if target <= 0: break

                    city_leads = await scrape_city(
                        context=context,
                        city=city,
                        params=event,
                        max_items=target,
                        existing_pids=existing_pids,
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
            {
                "title": l["title"], 
                "price": l["price"], 
                "mileage": l.get("mileage"), 
                "url": l["url"],
                "meta_text": l.get("meta_text"),
                "raw_title": l.get("title")
            }
            for l in all_leads[:10]   # Return more for logging/debug
        ],
    }


async def autonomous_pulse_loop():
    """
    Fetches all active settings from Supabase and runs the scraper for each.
    Bypasses Vercel Hobby cron limitations by keeping the schedule within AWS.
    """
    if not (SUPABASE_URL and SUPABASE_KEY):
        log_error("[PULSE] Supabase credentials missing. Cannot run autonomous pulse.")
        return {"success": False, "error": "Missing credentials"}
    
    try:
        db = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Fetch only users who have auto-scan enabled
        res = db.table("settings").select("*").eq("auto_scan_enabled", True).execute()
        all_settings = res.data or []
        
        log_info(f"[PULSE] Found {len(all_settings)} active sniper configurations.")
        
        results = []
        for s in all_settings:
            log_info(f"[PULSE] Triggering autonomous run for dealer: {s['id']}")
            
            # Map DB settings (CamelCase/SnakeCase) to Scraper Event format
            # Note: DB uses snake_case, scraper generally expects these keys
            payload = {
                "mode": "pulse",
                "dealer_id": s["id"],
                "cities": s.get("locations", ["losangeles"]),
                "year_min": s.get("year_min", 2010),
                "year_max": s.get("year_max", 2024),
                "price_min": s.get("price_min", 0),
                "price_max": s.get("price_max", 100000),
                "mileage_max": s.get("mileage_max", 250000),
                "makes": s.get("makes", []),
                "models": s.get("models", []),
                "max_items": s.get("batch_size", 10)
            }
            
            try:
                run_res = await run_scraper(payload)
                # Normalize result: run_scraper may return { success: false, reason: 'cooldown' }
                success_flag = bool(run_res.get("success"))
                if success_flag:
                    results.append({"dealer_id": s["id"], "success": True, "count": run_res.get("count", 0)})
                else:
                    reason = run_res.get("reason") or run_res.get("error") or "unknown"
                    log_info(f"[PULSE] Run for {s['id']} returned non-success: {reason}")
                    results.append({"dealer_id": s["id"], "success": False, "reason": reason, "details": run_res})

                # Record last attempt / pulse timestamp in settings so UI and cooldowns reflect activity
                try:
                    now_ts = datetime.now(timezone.utc).isoformat()
                    db.table("settings").update({"last_pulse_at": now_ts}).eq("id", s["id"]).execute()
                    log_info(f"[PULSE] Updated last_pulse_at for {s['id']} -> {now_ts}")
                except Exception as upd_e:
                    log_error(f"[PULSE] Failed to update settings timestamps for {s['id']}: {upd_e}")
            except Exception as e:
                log_error(f"[PULSE] Run failed for {s['id']}: {e}")
                results.append({"dealer_id": s["id"], "success": False, "error": str(e)})
        
        return {"success": True, "pulse_results": results}
        
    except Exception as e:
        log_error(f"[PULSE] Autonomous loop failed: {e}")
        return {"success": False, "error": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
# Lambda Handler
# ─────────────────────────────────────────────────────────────────────────────
def handler(event, context):
    """
    AWS Lambda entry point. Supports both direct API calls and scheduled Events.
    """
    log_info("--- [VERSION] v14-autonomous-pulse ---")
    log_info("Lambda execution started.")
    sys.stdout.flush()
    
    # API Gateway wraps the body as a JSON string; EventBridge passes the dict directly
    if isinstance(event.get("body"), str):
        try:
            payload = json.loads(event["body"])
        except json.JSONDecodeError:
            log_error("Invalid JSON body received.")
            return {"statusCode": 400, "body": json.dumps({"success": False, "error": "Invalid JSON body"})}
    elif isinstance(event, dict) and "body" not in event:
        payload = event
    else:
        payload = event.get("body", {})

    log_info(f"Payload received: {json.dumps(payload, indent=2) if hasattr(payload, 'keys') else payload}")

    try:
        # Determine Execution Path
        if payload.get("mode") == "pulse" and "cities" not in payload:
            # Autonomous Path: Triggered by AWS Schedule, fetch all users
            log_info("[HANDLER] Entering Autonomous Pulse Loop...")
            result = asyncio.run(autonomous_pulse_loop())
        else:
            # Direct Path: Triggered by Vercel or Manual Force Scan
            log_info("[HANDLER] Entering Direct Scraper Mode...")
            result = asyncio.run(run_scraper(payload))
            
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            "body": json.dumps(result)
        }
    except Exception as e:
        log_error(f"Global handler error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "error": str(e)})
        }

