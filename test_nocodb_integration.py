#!/usr/bin/env python3
"""
Test script to verify NocoDB vendor database integration
"""

import requests
import json
import time

def test_nocodb_integration():
    """Test the NocoDB vendor database integration"""
    
    print("🔍 TESTING NOCODB VENDOR DATABASE INTEGRATION")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Check database stats
    print("\n📊 Test 1: Database Statistics")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/api/database-stats")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                stats = data.get('stats', {})
                print(f"✅ Database stats retrieved successfully")
                print(f"   Total vendors: {stats.get('total_vendors', 0)}")
                print(f"   Categories: {stats.get('category_counts', {})}")
                print(f"   Locations: {stats.get('location_counts', {})}")
                print(f"   Recent searches: {stats.get('recent_searches', 0)}")
            else:
                print(f"❌ Database stats failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Database stats request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing database stats: {e}")
    
    # Test 2: Search for vendors (should use NocoDB if available)
    print("\n🔍 Test 2: Vendor Search (NocoDB Priority)")
    print("-" * 40)
    
    test_categories = ['venues', 'decoration', 'catering']
    location = 'mumbai'
    
    for category in test_categories:
        print(f"\n📋 Testing {category} vendors...")
        
        payload = {
            "category": category,
            "city": location,
            "weddingDate": "2026-10-22",
            "weddingDays": "3",
            "guestCount": "200",
            "budget": "₹30-50 Lakhs",
            "theme": "traditional"
        }
        
        try:
            response = requests.post(
                f"{base_url}/api/vendor-data/{category}",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    vendors = data.get('vendors', [])
                    source = data.get('source', 'unknown')
                    print(f"   ✅ Found {len(vendors)} vendors (source: {source})")
                    
                    # Show vendor names
                    for i, vendor in enumerate(vendors[:3]):  # Show first 3
                        name = vendor.get('name', 'Unknown')
                        rating = vendor.get('rating', 0)
                        print(f"      {i+1}. {name} (Rating: {rating})")
                    
                    # Check for duplicates
                    names = [v.get('name', '').lower().strip() for v in vendors]
                    unique_names = set(names)
                    if len(names) != len(unique_names):
                        print(f"   ⚠️  Duplicates detected: {len(names) - len(unique_names)} duplicates")
                    else:
                        print(f"   ✅ No duplicates found")
                        
                else:
                    print(f"   ❌ Vendor search failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing {category}: {e}")
    
    # Test 3: Check database stats again to see if new vendors were stored
    print("\n📊 Test 3: Database Stats After Search")
    print("-" * 40)
    
    try:
        response = requests.get(f"{base_url}/api/database-stats")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                stats = data.get('stats', {})
                print(f"✅ Updated database stats:")
                print(f"   Total vendors: {stats.get('total_vendors', 0)}")
                print(f"   Categories: {stats.get('category_counts', {})}")
                print(f"   Recent searches: {stats.get('recent_searches', 0)}")
            else:
                print(f"❌ Database stats failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Database stats request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing database stats: {e}")
    
    # Test 4: Test different location to see if NocoDB handles multiple locations
    print("\n🌍 Test 4: Different Location Search")
    print("-" * 35)
    
    payload = {
        "category": "venues",
        "city": "bangalore",
        "weddingDate": "2026-10-22",
        "weddingDays": "1",
        "guestCount": "150",
        "budget": "₹20-30 Lakhs",
        "theme": "modern"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/vendor-data/venues",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                vendors = data.get('vendors', [])
                source = data.get('source', 'unknown')
                location = data.get('location', 'unknown')
                print(f"✅ Found {len(vendors)} vendors for {location} (source: {source})")
                
                # Show vendor names
                for i, vendor in enumerate(vendors[:3]):
                    name = vendor.get('name', 'Unknown')
                    rating = vendor.get('rating', 0)
                    print(f"   {i+1}. {name} (Rating: {rating})")
            else:
                print(f"❌ Vendor search failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing different location: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 NOCODB INTEGRATION TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_nocodb_integration() 