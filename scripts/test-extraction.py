import sys
import os
from bs4 import BeautifulSoup

# Add the lambda-scraper directory to the path so we can import scraper
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lambda-scraper')))

from scraper import Scraper

def test_extract_attributes():
    scraper = Scraper()
    
    # The new Craigslist markup found by the browser subagent
    html = """
    <div class="attrgroup">
        <div class="attr auto_miles">
            <span class="labl">odometer:</span>
            <span class="valu">120,998</span>
        </div>
        <div class="attr">
            <span class="labl">condition:</span>
            <span class="valu">excellent</span>
        </div>
        <div class="attr">
            <span class="labl">paint color:</span>
            <span class="valu">white</span>
        </div>
        <div class="attr">
            <span class="labl">title status:</span>
            <span class="valu">clean</span>
        </div>
        <span>random old style: value</span>
    </div>
    """
    
    soup = BeautifulSoup(html, 'html.parser')
    attrs = scraper._extract_attributes(soup)
    
    print("Extracted Attributes:", attrs)
    
    expected_mileage = "120,998"
    if attrs.get("odometer") == expected_mileage:
        print("✅ Odometer extraction successful!")
    else:
        print(f"❌ Odometer extraction failed. Expected {expected_mileage}, got {attrs.get('odometer')}")

    if attrs.get("condition") == "excellent":
        print("✅ Condition extraction successful!")
    else:
        print(f"❌ Condition extraction failed. Got {attrs.get('condition')}")

    if attrs.get("random old style") == "value":
        print("✅ Old style extraction successful (fallback works)!")
    else:
        print(f"❌ Old style extraction failed.")

if __name__ == "__main__":
    test_extract_attributes()
