import asyncio
import os
import json
from dotenv import load_dotenv

# Load environment variables from the root .env file BEFORE importing scraper
load_dotenv(dotenv_path="../.env")

# Map environment variables if necessary
os.environ["SUPABASE_URL"] = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
os.environ["SUPABASE_KEY"] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Now import the scraper which depends on these env vars at module level
from scraper import run_scraper

async def main():
    event = {
        "cities": ["losangeles"],
        "year_min": 2010,
        "year_max": 2026,
        "price_min": 1000,
        "price_max": 100000,
        "mileage_max": 250000,
        "max_items": 15,
        "dealer_id": "00000000-0000-0000-0000-000000000000",
        "mode": "pulse"
    }
    
    print(f"Starting local scraper test for cities: {event['cities']}...")
    try:
        result = await run_scraper(event)
        print("Scraper result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error during scraper run: {e}")

if __name__ == "__main__":
    asyncio.run(main())
