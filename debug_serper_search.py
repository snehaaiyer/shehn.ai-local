#!/usr/bin/env python3
"""
Debug script to analyze raw Serper API responses
"""

import requests
import json
from config.api_config import SERPER_API_KEY

def test_raw_serper_queries():
    """Test different search queries to see raw responses"""
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Test different query strategies
    test_queries = [
        # Strategy 1: Direct vendor search
        '"Mumbai wedding venue" contact phone number',
        
        # Strategy 2: Business directory search
        'site:justdial.com "Mumbai wedding venue" contact',
        
        # Strategy 3: Specific venue type
        '"Mumbai banquet hall" booking contact details',
        
        # Strategy 4: Photography search
        '"Delhi wedding photographer" contact phone',
        
        # Strategy 5: Business directory for photography
        'site:urbanpro.com "Delhi wedding photographer" contact',
        
        # Strategy 6: Catering search
        '"Bangalore wedding catering" contact phone',
        
        # Strategy 7: Business directory for catering
        'site:sulekha.com "Bangalore catering" contact'
    ]
    
    print("🔍 Testing Raw Serper API Queries")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 TEST {i}: {query}")
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
                
                print(f"✅ API call successful")
                print(f"📊 Total results: {len(organic_results)}")
                
                # Analyze first 3 results
                for j, result in enumerate(organic_results[:3], 1):
                    title = result.get('title', '')
                    link = result.get('link', '')
                    snippet = result.get('snippet', '')
                    
                    print(f"\n   {j}. {title}")
                    print(f"      Link: {link}")
                    print(f"      Snippet: {snippet[:150]}...")
                    
                    # Check for contact info
                    snippet_lower = snippet.lower()
                    contact_indicators = ['contact', 'phone', 'call', 'booking', 'enquiry']
                    has_contact = any(indicator in snippet_lower for indicator in contact_indicators)
                    
                    # Check for business directory
                    business_domains = ['justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in']
                    is_business = any(domain in link for domain in business_domains)
                    
                    # Check for blog indicators
                    blog_indicators = ['blog', 'article', 'post', 'guide', 'tips', 'how to']
                    is_blog = any(indicator in title.lower() or indicator in snippet_lower for indicator in blog_indicators)
                    
                    print(f"      Has contact info: {has_contact}")
                    print(f"      From business directory: {is_business}")
                    print(f"      Is blog post: {is_blog}")
                    
                    # Extract phone if present
                    import re
                    phone_pattern = r'(\+91\s*)?(\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{4})'
                    phone_match = re.search(phone_pattern, snippet)
                    if phone_match:
                        print(f"      Phone found: {phone_match.group(0)}")
                    
            else:
                print(f"❌ API call failed: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("\n" + "="*60)

def test_business_directory_search():
    """Test specific business directory searches"""
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    print("\n🏢 Testing Business Directory Specific Searches")
    print("=" * 60)
    
    directory_queries = [
        'site:justdial.com "Mumbai wedding venue" contact phone',
        'site:sulekha.com "Mumbai banquet hall" booking',
        'site:urbanpro.com "Delhi wedding photographer" contact',
        'site:weddingz.in "Mumbai wedding venue" booking',
        'site:indiamart.com "Mumbai catering" contact'
    ]
    
    for i, query in enumerate(directory_queries, 1):
        print(f"\n📝 Directory Test {i}: {query}")
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
                
                for j, result in enumerate(organic_results[:2], 1):
                    title = result.get('title', '')
                    link = result.get('link', '')
                    snippet = result.get('snippet', '')
                    
                    print(f"\n   {j}. {title}")
                    print(f"      Link: {link}")
                    print(f"      Snippet: {snippet[:100]}...")
                    
                    # Check for phone numbers
                    import re
                    phone_pattern = r'(\+91\s*)?(\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{4})'
                    phone_matches = re.findall(phone_pattern, snippet)
                    if phone_matches:
                        print(f"      Phones found: {len(phone_matches)}")
                        for phone in phone_matches[:2]:  # Show first 2
                            print(f"         {phone[0]}{phone[1]}")
                    
            else:
                print(f"❌ Failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_raw_serper_queries()
    test_business_directory_search() 