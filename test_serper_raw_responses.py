
#!/usr/bin/env python3
"""
Test script to examine raw Serper API responses and filtering
"""

import requests
import json
from config.api_config import SERPER_API_KEY
from datetime import datetime

def test_serper_responses_for_bangalore():
    """Test Serper API responses for Sneha and Hellu in Bangalore"""
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    print("🔍 TESTING SERPER API RESPONSES FOR BANGALORE VENUES")
    print("=" * 60)
    print("User: Sneha and Hellu")
    print("Location: Bangalore")
    print("Category: Venues")
    print("-" * 60)
    
    # Test different query approaches
    test_queries = [
        # Current over-filtered approach
        '"Bangalore" banquet hall contact phone -"banquet halls in" -"venues in"',
        
        # Simpler approaches
        'Bangalore wedding venues contact',
        'Bangalore banquet halls phone number',
        'wedding venues Bangalore booking',
        'site:justdial.com Bangalore wedding venue',
        'site:weddingz.in Bangalore venues',
        
        # Direct business searches
        'Bangalore marriage hall contact details',
        'Bangalore wedding venue booking enquiry'
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 TEST {i}: {query}")
        print("-" * 40)
        
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
                
                print(f"✅ Raw results: {len(organic_results)}")
                
                if organic_results:
                    print("📋 Sample results:")
                    for j, result in enumerate(organic_results[:3], 1):
                        title = result.get('title', '')
                        link = result.get('link', '')
                        snippet = result.get('snippet', '')
                        
                        print(f"   {j}. {title}")
                        print(f"      URL: {link}")
                        print(f"      Snippet: {snippet[:100]}...")
                        
                        # Test filtering logic
                        would_pass_filter = test_vendor_filtering(title, snippet, link)
                        print(f"      Would pass current filter: {would_pass_filter}")
                        print()
                else:
                    print("❌ No results found")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

def test_vendor_filtering(title: str, snippet: str, link: str) -> bool:
    """Test current vendor filtering logic"""
    
    title_lower = title.lower()
    snippet_lower = snippet.lower()
    link_lower = link.lower()
    
    # Current filtering logic from enhanced_serper_api.py
    
    # 1. Check for blog indicators (excludes)
    blog_indicators = [
        'blog', 'article', 'post', 'guide', 'tips', 'how to', 'review',
        'comparison', 'best of', 'top 10', 'list', 'recommendation',
        'wedding planning', 'wedding ideas', 'wedding inspiration',
        'ultimate guide', 'complete guide', 'everything you need'
    ]
    
    if any(indicator in title_lower or indicator in snippet_lower for indicator in blog_indicators):
        return False
    
    # 2. Check for category indicators (excludes)
    category_indicators = ['top', 'best', 'list', 'vendors', 'agents', 'decorators', 'rentals']
    if any(indicator in title_lower for indicator in category_indicators):
        return False
    
    # 3. Check for business domains (includes)
    business_domains = [
        'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in',
        'shaadisaga.com', 'wedmegood.com', 'indiamart.com', 'yellowpages.in'
    ]
    
    for domain in business_domains:
        if domain in link_lower:
            return True
    
    # 4. Check for vendor indicators
    vendor_indicators = [
        'contact', 'phone', 'call', 'booking', 'enquiry', 'rate', 'price',
        'service', 'vendor', 'professional', 'company', 'studio', 'agency',
        'catering', 'photographer', 'venue', 'hall', 'caterer', 'makeup'
    ]
    
    has_vendor_indicator = any(indicator in snippet_lower or indicator in title_lower 
                              for indicator in vendor_indicators)
    
    return has_vendor_indicator

def show_sample_response_format():
    """Show what a filtered response would look like for Sneha and Hellu"""
    
    print("\n🎯 SAMPLE RESPONSE FORMAT FOR SNEHA & HELLU")
    print("=" * 60)
    
    sample_response = {
        'success': True,
        'category': 'venues',
        'location': 'bangalore',
        'user_preferences': {
            'couple_names': ['Sneha', 'Hellu'],
            'budget_range': (200000, 800000),
            'guest_count': 250,
            'wedding_theme': 'traditional',
            'preferred_venue_type': 'banquet'
        },
        'vendors': [
            {
                'id': 'venue_12345',
                'name': 'Royal Garden Banquet',
                'category': 'venues',
                'location': 'Bangalore',
                'description': 'Premium wedding venue with traditional architecture and modern amenities',
                'phone': '+91-9876543210',
                'email': 'booking@royalgarden.com',
                'website': 'https://royalgarden.com',
                'rating': 4.5,
                'price_range': '₹3,00,000 - ₹6,00,000',
                'capacity': '200-500 guests',
                'amenities': ['Parking', 'AC', 'Catering', 'Decoration'],
                'verified': True,
                'search_score': 85.0
            }
        ],
        'total_found': 1,
        'search_metadata': {
            'timestamp': datetime.now().isoformat(),
            'filters_applied': ['business_listings', 'contact_verification'],
            'search_queries_used': 8,
            'raw_results_found': 45,
            'filtered_results': 12,
            'final_results': 1
        }
    }
    
    print(json.dumps(sample_response, indent=2, default=str))

if __name__ == "__main__":
    test_serper_responses_for_bangalore()
    show_sample_response_format()
