#!/usr/bin/env python3
"""
Test script to simulate frontend API calls and check for duplicates
"""

import requests
import json
import time

def test_frontend_api_calls():
    """Simulate frontend API calls to check for duplicates"""
    
    print("🔍 TESTING FRONTEND API CALLS")
    print("=" * 50)
    
    # Base URL
    base_url = "http://localhost:8000"
    
    # Test payload (similar to what frontend sends)
    payload = {
        "category": "decoration",
        "city": "mumbai",
        "weddingDate": "2026-10-22",
        "weddingDays": "3",
        "guestCount": "",
        "budget": "",
        "weddingType": "",
        "yourName": "sneha",
        "partnerName": "snehaa",
        "theme": "boho",
        "decorStyle": "floral",
        "cuisineStyle": "multi-cuisine",
        "photographyStyle": "candid",
        "venueType": "outdoor",
        "floralStyle": "minimalist",
        "lightingStyle": "candles",
        "furnitureStyle": "modern",
        "musicPreferences": ["contemporary"],
        "entertainmentPreferences": [],
        "priorities": [],
        "specialRequirements": "",
        "dateFlexibility": "",
        "season": ""
    }
    
    # Test multiple calls to simulate frontend behavior
    all_vendors = []
    seen_names = set()
    duplicates = []
    
    print("📡 Making multiple API calls to simulate frontend behavior...")
    
    for i in range(5):  # Simulate 5 calls
        print(f"\n🔄 Call {i+1}:")
        
        try:
            response = requests.post(
                f"{base_url}/api/vendor-data/decoration",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('vendors'):
                    vendors = data['vendors']
                    print(f"   ✅ Received {len(vendors)} vendors")
                    
                    # Check for duplicates within this response
                    call_names = set()
                    call_duplicates = []
                    
                    for vendor in vendors:
                        name = vendor.get('name', '').lower().strip()
                        if name in call_names:
                            call_duplicates.append(name)
                        else:
                            call_names.add(name)
                    
                    if call_duplicates:
                        print(f"   ⚠️ Found duplicates within this call: {call_duplicates}")
                    
                    # Check for duplicates across all calls
                    for vendor in vendors:
                        name = vendor.get('name', '').lower().strip()
                        if name in seen_names:
                            duplicates.append(name)
                        else:
                            seen_names.add(name)
                            all_vendors.append(vendor)
                    
                    print(f"   📊 Total unique vendors so far: {len(all_vendors)}")
                    
                else:
                    print(f"   ❌ API call failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ HTTP error: {response.status_code}")
                
        except Exception as e:
            print(f"   💥 Exception: {e}")
        
        # Small delay between calls
        time.sleep(0.5)
    
    print(f"\n📊 FINAL RESULTS:")
    print(f"   Total unique vendors: {len(all_vendors)}")
    print(f"   Duplicate names found: {len(duplicates)}")
    
    if duplicates:
        print(f"   Duplicate names: {duplicates}")
    
    # Show all unique vendors
    print(f"\n📋 All unique vendors:")
    for i, vendor in enumerate(all_vendors):
        print(f"   {i+1}. {vendor.get('name', 'N/A')} | {vendor.get('phone', 'N/A')}")
    
    return len(duplicates) == 0

def test_cache_behavior():
    """Test if caching is causing issues"""
    
    print("\n🔍 TESTING CACHE BEHAVIOR")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    
    # Simple payload
    payload = {
        "category": "decoration",
        "city": "mumbai"
    }
    
    print("📡 Making two identical calls to test caching...")
    
    # First call
    print("\n🔄 First call:")
    response1 = requests.post(
        f"{base_url}/api/vendor-data/decoration",
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    if response1.status_code == 200:
        data1 = response1.json()
        vendors1 = data1.get('vendors', [])
        print(f"   ✅ Received {len(vendors1)} vendors")
        
        # Show vendor names
        for i, vendor in enumerate(vendors1):
            print(f"      {i+1}. {vendor.get('name', 'N/A')}")
    
    # Second call (should use cache)
    print("\n🔄 Second call (should use cache):")
    response2 = requests.post(
        f"{base_url}/api/vendor-data/decoration",
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    if response2.status_code == 200:
        data2 = response2.json()
        vendors2 = data2.get('vendors', [])
        print(f"   ✅ Received {len(vendors2)} vendors")
        
        # Show vendor names
        for i, vendor in enumerate(vendors2):
            print(f"      {i+1}. {vendor.get('name', 'N/A')}")
        
        # Compare results
        names1 = [v.get('name', '').lower().strip() for v in vendors1]
        names2 = [v.get('name', '').lower().strip() for v in vendors2]
        
        if names1 == names2:
            print("   ✅ Cache working correctly - same results")
        else:
            print("   ⚠️ Cache issue - different results")
            print(f"   First call names: {names1}")
            print(f"   Second call names: {names2}")

if __name__ == "__main__":
    # Test frontend API calls
    success = test_frontend_api_calls()
    
    # Test cache behavior
    test_cache_behavior()
    
    if success:
        print("\n✅ No duplicates found in API calls")
    else:
        print("\n❌ Duplicates found in API calls") 