import sys
import os
import asyncio
import json
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '../.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()

# Map them to the keys scraper.py expects globally BEFORE import
proxy_url = os.environ.get("PROXY_URL", "")
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

os.environ["PROXY_URL"] = proxy_url
os.environ["SUPABASE_URL"] = supabase_url
os.environ["SUPABASE_KEY"] = supabase_key

# Add lambda-scraper dir to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../lambda-scraper'))
import scraper

async def main():
    try:
        with open('scripts/temp_payload.json', 'r') as f:
            payload = json.load(f)
    except:
        payload = {
            "cities": ["losangeles"],
            "year_min": 2018,
            "year_max": 2026,
            "price_min": 5000,
            "price_max": 30000,
            "mileage_max": 130000,
            "makes": ["Toyota", "Honda"],
            "posted_today": False,
            "max_items": 10,
            "dealer_id": "00000000-0000-0000-0000-000000000000",
            "mode": "pulse"
        }
    
    
    print(f"Triggering local scraper test with DataImpulse proxy...")
    print(f"PROXY_URL loaded: {'Yes' if proxy_url else 'No'}")
    
    try:
        result = await scraper.run_scraper(payload)
        print("Scraper finished:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print("Error running scraper:", e)

if __name__ == "__main__":
    asyncio.run(main())
