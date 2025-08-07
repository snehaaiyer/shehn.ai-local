#!/usr/bin/env python3
"""
Test script to debug name extraction
"""

import re

def extract_vendor_name(title: str) -> str:
    """Clean and extract vendor name from title"""
    original_title = title
    print(f"Original: '{original_title}'")
    
    # Remove common suffixes and prefixes
    title = re.sub(r'\s*-\s*(Best|Top|Leading|Professional).*', '', title, flags=re.IGNORECASE)
    print(f"After prefix removal: '{title}'")
    
    title = re.sub(r'\s*\|\s*.*', '', title)
    print(f"After pipe removal: '{title}'")
    
    title = re.sub(r'\s*contact.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*phone.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*booking.*', '', title, flags=re.IGNORECASE)
    print(f"After contact removal: '{title}'")
    
    # Be more selective about removing location names - only if at the end
    title = re.sub(r',?\s+(in\s+)?delhi\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r',?\s+(in\s+)?mumbai\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r',?\s+(in\s+)?bangalore\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r',?\s+(in\s+)?ghaziabad\s*$', '', title, flags=re.IGNORECASE)
    print(f"After location removal: '{title}'")
    
    # Only remove "services" if it's at the end and preceded by something substantial
    if len(title.split()) > 2:
        title = re.sub(r'\s+services\s*$', '', title, flags=re.IGNORECASE)
    print(f"After services removal: '{title}'")
    
    # Clean up extra spaces and punctuation
    title = re.sub(r'\s+', ' ', title)
    title = title.strip(' -.,')
    print(f"After cleanup: '{title}'")
    
    # If we ended up with an empty or very short name, try to extract from original
    if len(title.strip()) < 3:
        print(f"Name too short ({len(title.strip())}), trying extraction from original")
        # Try to extract the first meaningful part before colon or dash
        if ':' in original_title:
            title = original_title.split(':')[0].strip()
            print(f"Extracted before colon: '{title}'")
        elif ' - ' in original_title:
            title = original_title.split(' - ')[0].strip()
            print(f"Extracted before dash: '{title}'")
        else:
            # Take first few words if they seem like a business name
            words = original_title.split()
            if len(words) >= 2:
                title = ' '.join(words[:3])  # Take first 3 words
                print(f"Extracted first 3 words: '{title}'")
            else:
                title = original_title
                print(f"Using original: '{title}'")
    
    result = title.strip()[:60]
    print(f"Final result: '{result}'")
    return result

# Test with some sample titles
test_titles = [
    "Delhi Photography Services: Ecommerce Photographer",
    "Top Portraits Photographers in Delhi - Best Professional",
    "Wedding Photographer Delhi in Rohini,Delhi - Justdial",
    "Contact a Top Delhi Wedding Photographer - Picfiniti Studios",
    "Best Wedding Photography Services in Delhi",
    "Sharma Photography Studio - Wedding Photography"
]

print("🔍 Testing Name Extraction")
print("=" * 60)

for i, title in enumerate(test_titles, 1):
    print(f"\n📝 TEST {i}:")
    print("-" * 40)
    result = extract_vendor_name(title)
    print(f"✅ FINAL: '{result}' (length: {len(result)})")
    print() 