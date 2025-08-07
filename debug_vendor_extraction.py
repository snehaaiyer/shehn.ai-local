#!/usr/bin/env python3
"""
Debug script to check vendor name extraction from filtered results
"""

import requests
import re
from config.api_config import SERPER_API_KEY

def test_vendor_name_extraction_from_filtered():
    """Test vendor name extraction from actual filtered results"""
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Test a query that we know returns filtered results
    query = 'site:sulekha.com "Mumbai marriage hall" contact'
    
    print("🔍 Testing Vendor Name Extraction from Filtered Results")
    print("=" * 60)
    print(f"Query: {query}")
    print("-" * 50)
    
    try:
        payload = {
            'q': query,
            'num': 10,
            'gl': 'in',
            'hl': 'en',
            'safe': 'active'
        }
        
        response = requests.post(
            'https://google.serper.dev/search',
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            organic_results = data.get('organic', [])
            
            print(f"✅ Raw results found: {len(organic_results)}")
            
            for i, result in enumerate(organic_results[:5], 1):
                title = result.get('title', '')
                link = result.get('link', '')
                snippet = result.get('snippet', '')
                
                print(f"\n   {i}. Original Title: '{title}'")
                print(f"      Link: {link}")
                
                # Test the name extraction
                extracted_name = extract_vendor_name(title)
                print(f"      Extracted Name: '{extracted_name}'")
                print(f"      Name Length: {len(extracted_name)}")
                print(f"      Is Generic: {is_generic_name(extracted_name)}")
                
                # Test filtering logic
                is_filtered = test_filtering_logic(title, snippet, link)
                print(f"      Would be filtered: {is_filtered}")
                
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def extract_vendor_name(title: str) -> str:
    """Extract vendor name from title (same logic as in enhanced_serper_api.py)"""
    # Remove common suffixes and prefixes
    title = re.sub(r'\s*-\s*(Best|Top|Leading|Professional).*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*\|\s*.*', '', title)
    title = re.sub(r'\s*in\s+\w+.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*contact.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*phone.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*booking.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*studio.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*services.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*ghaziabad.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*mumbai.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*delhi.*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*bangalore.*', '', title, flags=re.IGNORECASE)
    
    # Clean up extra spaces and punctuation
    title = re.sub(r'\s+', ' ', title)
    title = title.strip(' -.,')
    
    return title.strip()[:60]

def is_generic_name(name: str) -> bool:
    """Check if name is too generic"""
    return len(name) < 2 or name.lower() in ['', 'contact', 'phone', 'booking']

def test_filtering_logic(title: str, snippet: str, link: str) -> bool:
    """Test if result would be filtered out"""
    title_lower = title.lower()
    snippet_lower = snippet.lower()
    link_lower = link.lower()
    
    # Check for category indicators
    category_indicators = ['top', 'best', 'list', 'vendors', 'agents', 'decorators', 'rentals']
    if any(indicator in title_lower for indicator in category_indicators):
        return True
    
    # Check for blog indicators
    blog_indicators = ['blog', 'article', 'post', 'guide', 'tips', 'how to', 'review']
    if any(indicator in title_lower or indicator in snippet_lower for indicator in blog_indicators):
        return True
    
    return False

if __name__ == "__main__":
    test_vendor_name_extraction_from_filtered() 