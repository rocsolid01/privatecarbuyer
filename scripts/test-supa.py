import os
from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
db = create_client(url, key)

try:
    res = db.table('leads').select('*').limit(1).execute()
    print("Select success:", len(res.data))
    
    mock_lead = {
        "external_id": "test_123",
        "title": "Test Car",
        "price": 5000,
        "location": "Los Angeles",
        "url": "https://losangeles.craigslist.org",
        "post_time": "2026-03-14T00:00:00Z",
        "last_seen_at": "2026-03-14T00:00:00Z",
        "mileage": None,
        "vin": None,
        "photos": [],
        "status": "New",
        "dealer_id": "00000000-0000-0000-0000-000000000000"
    }
    
    upsert_res = db.table('leads').upsert([mock_lead], on_conflict="external_id").execute()
    print("Upsert success!")
except Exception as e:
    print("Error:", e)
