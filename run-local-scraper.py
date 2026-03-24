import sys
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Set env vars that scraper.py expects
# Using the verified PROXY_URL from .env
os.environ["PROXY_URL"] = os.getenv("PROXY_URL") or ""
os.environ["SUPABASE_URL"] = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
os.environ["SUPABASE_KEY"] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"DEBUG: Proxy: {os.environ['PROXY_URL'][:30]}...")

# Add parent dir to path to import scraper
sys.path.append(os.path.join(os.getcwd(), 'lambda-scraper'))
import scraper

async def main():
    print(f"START: Starting local scraper test at {datetime.now().isoformat()}...")
    
    # Mock Pulse Event
    event = {
        "mode": "pulse",
        "dealer_id": "00000000-0000-0000-0000-000000000000",
        "cities": ["losangeles"],
        "year_min": 2010,
        "price_max": 50000,
        "post_age_max": 24, # Only show fresh ones
        "posted_today": True,
        "max_items": 20
    }
    
    try:
        print(f"LOG: Scanning city: {event['cities']}...")
        # Note: scraper.run_scraper is an async function
        result = await scraper.run_scraper(event)
        
        print(f"SUCCESS: Finished! Status: {result.get('success')}")
        print(f"INFO: Found {result.get('count', 0)} leads.")
        
        if result.get("leads_preview"):
            for i, l in enumerate(result["leads_preview"]):
                print(f"   [{i+1}] {l['title']} - {l['price']}")
                
    except Exception as e:
        print(f"ERROR: Error during local run: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
