from bs4 import BeautifulSoup

def extract_attributes_fixed(soup):
    attrs = {}
    # New structure: div.attr with span.labl and span.valu
    for div in soup.select(".attrgroup div.attr"):
        labl = div.select_one(".labl")
        valu = div.select_one(".valu")
        if labl and valu:
            key = labl.get_text(strip=True).replace(":", "").strip().lower()
            val = valu.get_text(strip=True).strip().lower()
            attrs[key] = val
    
    # Fallback for old structure or mixed tags
    for span in soup.select(".attrgroup span"):
        text = span.get_text(strip=True)
        if ":" in text:
            parts = text.split(":", 1)
            key = parts[0].strip().lower()
            val = parts[1].strip().lower() if len(parts) > 1 else ""
            if key not in attrs:
                attrs[key] = val
        elif text and not any(text.lower().startswith(k) for k in attrs):
            # Only add if it doesn't match an existing key and isn't empty
            attrs[text.strip().lower()] = True
    return attrs

def test():
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
    attrs = extract_attributes_fixed(soup)
    
    print("Extracted Attributes:", attrs)
    
    expected_mileage = "120,998"
    if attrs.get("odometer") == expected_mileage:
        print("✅ Odometer extraction successful!")
    else:
        print(f"❌ Odometer extraction failed. Expected {expected_mileage}, got {attrs.get('odometer')}")

if __name__ == "__main__":
    test()
