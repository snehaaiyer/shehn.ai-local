#!/usr/bin/env python3
"""
Test script to verify enhanced Serper API results
Check if vendor search is returning actual business listings with contact info
"""

import os
import json
from enhanced_serper_api import EnhancedSerperAPI

def test_serper_api_results():
    """Test the enhanced Serper API with various search scenarios"""
    
    # Initialize the API
    serper_api = EnhancedSerperAPI()
    
    print("🔍 Testing Enhanced Serper API Results")
    print("=" * 60)
    
    # Test 1: Venue Search
    print("\n🏰 TEST 1: Venue Search in Mumbai")
    print("-" * 40)
    
    venue_results = serper_api.search_wedding_vendors(
        category="venues",
        location="Mumbai",
        budget_range=(200000, 800000),
        guest_count=300,
        wedding_theme="Royal Palace Wedding",
        max_results=5
    )
    
    print(f"✅ Search completed: {venue_results['success']}")
    print(f"📊 Total vendors found: {venue_results['total_found']}")
    
    if venue_results['vendors']:
        print("\n📋 Top Venue Results:")
        for i, venue in enumerate(venue_results['vendors'][:3], 1):
            print(f"\n{i}. {venue['name']}")
            print(f"   📍 Location: {venue['location']}")
            print(f"   💰 Price: {venue['price_range']}")
            print(f"   ⭐ Rating: {venue['rating']}/5")
            print(f"   📞 Phone: {venue['phone'] if venue['phone'] else 'Not found'}")
            print(f"   📧 Email: {venue['email'] if venue['email'] else 'Not found'}")
            print(f"   🌐 Website: {venue['website']}")
            print(f"   🏷️ Specialties: {', '.join(venue['specialties']) if venue['specialties'] else 'None'}")
            print(f"   ✅ Verified: {venue['verified']}")
            print(f"   🎯 Search Score: {venue['search_score']}")
    else:
        print("❌ No venue results found")
    
    # Test 2: Photography Search
    print("\n📸 TEST 2: Photography Search in Delhi")
    print("-" * 40)
    
    photo_results = serper_api.search_wedding_vendors(
        category="photography",
        location="Delhi",
        budget_range=(50000, 200000),
        guest_count=200,
        wedding_theme="Candid Photography",
        max_results=5
    )
    
    print(f"✅ Search completed: {photo_results['success']}")
    print(f"📊 Total vendors found: {photo_results['total_found']}")
    
    if photo_results['vendors']:
        print("\n📋 Top Photography Results:")
        for i, photographer in enumerate(photo_results['vendors'][:3], 1):
            print(f"\n{i}. {photographer['name']}")
            print(f"   📍 Location: {photographer['location']}")
            print(f"   💰 Price: {photographer['price_range']}")
            print(f"   ⭐ Rating: {photographer['rating']}/5")
            print(f"   📞 Phone: {photographer['phone'] if photographer['phone'] else 'Not found'}")
            print(f"   📧 Email: {photographer['email'] if photographer['email'] else 'Not found'}")
            print(f"   🌐 Website: {photographer['website']}")
            print(f"   🏷️ Specialties: {', '.join(photographer['specialties']) if photographer['specialties'] else 'None'}")
            print(f"   ✅ Verified: {photographer['verified']}")
            print(f"   🎯 Search Score: {photographer['search_score']}")
    else:
        print("❌ No photography results found")
    
    # Test 3: Raw API response analysis
    print("\n🔧 TEST 3: Raw API Response Analysis")
    print("-" * 40)
    
    # Test a single query to see raw response
    try:
        import requests
        
        if os.getenv('SERPER_API_KEY'):
            headers = {
                'X-API-KEY': os.getenv('SERPER_API_KEY'),
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': '"Mumbai wedding venue" contact phone number',
                'num': 5,
                'gl': 'in',
                'hl': 'en',
                'safe': 'active'
            }
            
            response = requests.post(
                'https://google.serper.dev/search',
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Raw API call successful")
                print(f"📊 Total organic results: {len(data.get('organic', []))}")
                
                if 'organic' in data and data['organic']:
                    print(f"\n📋 Sample raw result:")
                    sample = data['organic'][0]
                    print(f"   Title: {sample.get('title', 'N/A')}")
                    print(f"   Link: {sample.get('link', 'N/A')}")
                    print(f"   Snippet: {sample.get('snippet', 'N/A')[:100]}...")
                    
                    # Check if it has contact info
                    snippet = sample.get('snippet', '').lower()
                    has_contact = any(word in snippet for word in ['contact', 'phone', 'call', 'booking'])
                    print(f"   Has contact info: {has_contact}")
                    
                    # Check if it's from business directory
                    link = sample.get('link', '').lower()
                    is_business = any(domain in link for domain in ['justdial.com', 'sulekha.com', 'urbanpro.com'])
                    print(f"   From business directory: {is_business}")
            else:
                print(f"❌ Raw API call failed: {response.status_code}")
        else:
            print("⚠️ SERPER_API_KEY not found in environment")
    
    except Exception as e:
        print(f"❌ Error in raw API test: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("=" * 60)
    
    total_vendors = (venue_results['total_found'] + 
                    photo_results['total_found'])
    
    print(f"📊 Total vendors found: {total_vendors}")
    print(f"✅ Venue vendors: {venue_results['total_found']}")
    print(f"📸 Photography vendors: {photo_results['total_found']}")

if __name__ == "__main__":
    test_serper_api_results() 