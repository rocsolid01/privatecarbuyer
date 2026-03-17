import re

def _extract_mileage_from_meta(text):
    """Refined helper to extract mileage from search result meta text."""
    if not text:
        return None
    
    print(f"Testing text: '{text}'")
    
    # regex matches: numbers followed by 'k' (optional) and 'mi' or 'miles'
    # must NOT have 'away' or 'from' nearby to avoid distance
    # Support commas in the number
    pattern = r'([\d\.,]+k?)\s*(?:mi|miles?)'
    
    for match in re.finditer(pattern, text, re.IGNORECASE):
        val_str = match.group(1).lower()
        full_match = match.group(0).lower()
        
        # Check surrounding for 'away' or 'from' to skip distance
        start, end = match.span()
        context = text[end:end+10].lower()
        if 'away' in context or 'from' in context:
            print(f"Skipping distance-like match: {full_match} (context: {context})")
            continue

        print(f"Matched value: {val_str}")
        try:
            # Clean commas
            temp = val_str.replace(',', '')
            if temp.endswith('k'):
                return int(float(temp[:-1]) * 1000)
            return int(float(temp))
        except ValueError:
            continue
    return None

# Test cases
tests = [
    "westside-southbay-310 · 15m ago · 110k mi · $12,500",
    "brea · < 1m ago · 91k miles · $15,000",
    "los angeles · 2h ago · 45000 mi · $8,000",
    "1.5 mi away · 150k mi",
    "91,000 mi",
    "91000 mi",
    "91k mi",
    "110k mi"
]

for t in tests:
    result = _extract_mileage_from_meta(t)
    print(f"Result: {result}")
    print("-" * 20)
