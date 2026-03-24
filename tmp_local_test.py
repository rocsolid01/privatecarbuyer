import json
import os
import asyncio
import sys

# Delete proxy before any imports
if "PROXY_URL" in os.environ:
    del os.environ["PROXY_URL"]

from dotenv import load_dotenv
load_dotenv()
if "PROXY_URL" in os.environ:
    del os.environ["PROXY_URL"]

# Add lambda-scraper dir to path
sys.path.append(os.path.join(os.getcwd(), 'lambda-scraper'))

from scraper import handler

def main():
    # Payload for local test (Removing makes filter for 10+ results)
    payload = {
        "run_id": "manual-local-test-no-proxy-v2",
        "cities": ["losangeles"],
        "makes": [],
        "year_min": 2010,
        "dealer_id": "00000000-0000-0000-0000-000000000000",
        "max_items": 15
    }
    
    print("Starting local scraper test session (NO PROXY V2)...")
    result = handler(payload, None)
    print(f"Result: {result}")

if __name__ == "__main__":
    main()
