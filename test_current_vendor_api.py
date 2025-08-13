
#!/usr/bin/env python3
"""
Test script to check what the current vendor search API is returning
"""

import requests
import json
from datetime import datetime

def test_vendor_search_api():
    """Test the current vendor search API"""
    
    print("🔍 TESTING CURRENT VENDOR SEARCH API")
    print("=" * 60)
    
    # Test different categories
    categories = ['venues', 'photography', 'catering', 'decoration']
    location = 'Mumbai'
    
    for category in categories:
        print(f"\n📋 Testing {category.upper()} in {location}")
        print("-" * 40)
        
        try:
            # Test the enhanced serper API directly
            from enhanced_serper_api import EnhancedSerperAPI
            
            serper_api = EnhancedSerperAPI()
            
            result = serper_api.search_wedding_vendors(
                category=category,
                location=location,
                budget_range=(100000, 500000),
                guest_count=200,
                wedding_theme="",
                max_results=10
            )
            
            if result.get('success'):
                vendors = result.get('vendors', [])
                print(f"✅ API returned {len(vendors)} vendors")
                
                if vendors:
                    for i, vendor in enumerate(vendors[:3], 1):
                        print(f"\n{i}. {vendor.get('name', 'No name')}")
                        print(f"   Phone: {vendor.get('phone', 'No phone')}")
                        print(f"   Email: {vendor.get('email', 'No email')}")
                        print(f"   Rating: {vendor.get('rating', 'No rating')}")
                        print(f"   Score: {vendor.get('search_score', 'No score')}")
                        
                        # Check if this vendor has useful contact info
                        has_phone = bool(vendor.get('phone'))
                        has_email = bool(vendor.get('email'))
                        has_contact = has_phone or has_email
                        print(f"   Has Contact Info: {has_contact}")
                else:
                    print("❌ No vendors returned")
            else:
                error = result.get('error', 'Unknown error')
                print(f"❌ API call failed: {error}")
                
        except Exception as e:
            print(f"❌ Error testing {category}: {e}")
    
    print(f"\n" + "=" * 60)
    print("TEST COMPLETE")

def test_frontend_api_call():
    """Test the API call that the frontend would make"""
    
    print("\n🌐 TESTING FRONTEND API CALL")
    print("=" * 60)
    
    # Test data similar to what frontend sends
    test_data = {
        'weddingData': {
            'yourName': 'Test User',
            'partnerName': 'Test Partner',
            'guestCount': 200,
            'budgetRange': 'Mid Range - 5-15 Lakhs',
            'city': 'Mumbai',
            'weddingDate': '2024-12-15',
            'weddingStyle': 'traditional',
            'venueType': 'banquet',
            'priorities': ['venue', 'catering', 'photography']
        },
        'searchParams': {
            'category': 'venues',
            'location': 'Mumbai'
        },
        'filterCategory': 'venues',
        'ragEnabled': True
    }
    
    try:
        # Try to call the backend API
        response = requests.post(
            'http://0.0.0.0:5002/api/intelligent-vendor-selection',
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                recommendations = data.get('final_recommendations', {})
                total_vendors = data.get('total_vendors', 0)
                
                print(f"✅ Backend API successful")
                print(f"📊 Total vendors: {total_vendors}")
                
                for category, vendors in recommendations.items():
                    print(f"\n📋 {category.upper()}: {len(vendors)} vendors")
                    
                    for i, vendor in enumerate(vendors[:3], 1):
                        print(f"   {i}. {vendor.get('name', 'No name')}")
                        print(f"      Contact Score: {vendor.get('context_match_score', 'No score')}")
            else:
                print(f"❌ Backend returned error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend API")
        print("   Make sure the backend server is running on port 5002")
    except Exception as e:
        print(f"❌ Error calling backend API: {e}")

if __name__ == "__main__":
    test_vendor_search_api()
    test_frontend_api_call()
