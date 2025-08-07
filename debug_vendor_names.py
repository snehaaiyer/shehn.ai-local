#!/usr/bin/env python3
"""
Debug script to check vendor name extraction
"""

import requests
import re
from config.api_config import SERPER_API_KEY

def test_vendor_name_extraction():
    """Test vendor name extraction from actual search results"""
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Test a few queries that we know return results
    test_queries = [
        'site:justdial.com "Mumbai banquet hall" contact phone',
        'site:sulekha.com "Mumbai marriage hall" contact',
        '"Delhi wedding photographer" contact phone number'
    ]
    
    print("🔍 Testing Vendor Name Extraction")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 TEST {i}: {query}")
        print("-" * 50)
        
        try:
            payload = {
                'q': query,
                'num': 5,
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
                
                print(f"✅ Results found: {len(organic_results)}")
                
                for j, result in enumerate(organic_results[:3], 1):
                    title = result.get('title', '')
                    link = result.get('link', '')
                    snippet = result.get('snippet', '')
                    
                    print(f"\n   {j}. Original Title: {title}")
                    print(f"      Link: {link}")
                    
                    # Test the name extraction
                    extracted_name = extract_vendor_name(title)
                    print(f"      Extracted Name: '{extracted_name}'")
                    print(f"      Name Length: {len(extracted_name)}")
                    print(f"      Is Generic: {is_generic_name(extracted_name)}")
                    
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
    return len(name) < 3 or name.lower() in ['', 'contact', 'phone', 'booking']

if __name__ == "__main__":
    test_vendor_name_extraction() 