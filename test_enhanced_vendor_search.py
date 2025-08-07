#!/usr/bin/env python3
"""
Test Enhanced Vendor Search
Verifies that the API returns individual vendor contact details rather than generic page listings
"""

import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_vendor_search():
    """Test the enhanced vendor search functionality"""
    
    # Test URL
    base_url = "http://localhost:8000"
    
    # Test categories
    categories = ['venues', 'photography', 'catering', 'decoration']
    location = 'bangalore'
    
    print("🧪 Testing Enhanced Vendor Search")
    print("=" * 50)
    
    for category in categories:
        print(f"\n📋 Testing {category} vendors in {location}")
        print("-" * 40)
        
        try:
            # Test the vendor data endpoint
            url = f"{base_url}/api/vendor-data/{category}"
            payload = {
                'city': location,
                'use_serper': 'true'
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    vendors = data.get('vendors', [])
                    print(f"✅ Found {len(vendors)} vendors")
                    print(f"📊 Source: {data.get('source', 'unknown')}")
                    print(f"🔍 Individual contacts verified: {data.get('individual_contacts_verified', False)}")
                    
                    # Analyze each vendor
                    for i, vendor in enumerate(vendors[:3], 1):  # Show first 3 vendors
                        print(f"\n  {i}. {vendor.get('name', 'Unknown')}")
                        print(f"     📞 Phone: {vendor.get('phone', 'N/A')}")
                        print(f"     📧 Email: {vendor.get('email', 'N/A')}")
                        print(f"     🌐 Website: {vendor.get('website', 'N/A')}")
                        print(f"     📱 WhatsApp: {vendor.get('whatsapp', 'N/A')}")
                        print(f"     📸 Instagram: {vendor.get('instagram', 'N/A')}")
                        print(f"     ⭐ Rating: {vendor.get('rating', 'N/A')}")
                        print(f"     💰 Price: {vendor.get('price', 'N/A')}")
                        
                        # Check contact validation
                        contact_score = vendor.get('contact_score', 0)
                        print(f"     📊 Contact Score: {contact_score}/100")
                        
                        # Check if it's an individual vendor
                        is_individual = not any(indicator in vendor.get('name', '').lower() for indicator in [
                            'top', 'best', 'list of', 'directory', 'agents', 'services in'
                        ])
                        print(f"     ✅ Individual Vendor: {is_individual}")
                        
                else:
                    print(f"❌ API returned error: {data.get('error', 'Unknown error')}")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing {category}: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Enhanced Vendor Search Test Complete")

def test_serper_direct():
    """Test Serper search directly"""
    print("\n🔍 Testing Serper Search Directly")
    print("=" * 50)
    
    try:
        from serper_images import search_vendors
        
        category = 'venues'
        location = 'bangalore'
        
        print(f"Searching for {category} vendors in {location}...")
        
        result = search_vendors(category, location, 5)
        
        if result.get('success'):
            vendors = result.get('vendors', [])
            print(f"✅ Found {len(vendors)} vendors via Serper")
            print(f"📊 Filtered: {result.get('filtered_count', 0)} from {result.get('original_count', 0)}")
            
            for i, vendor in enumerate(vendors[:3], 1):
                print(f"\n  {i}. {vendor.get('name', 'Unknown')}")
                print(f"     📞 Phone: {vendor.get('phone', 'N/A')}")
                print(f"     📧 Email: {vendor.get('email', 'N/A')}")
                print(f"     🌐 Website: {vendor.get('website', 'N/A')}")
                print(f"     📱 WhatsApp: {vendor.get('whatsapp', 'N/A')}")
                
                # Check if it's individual
                name = vendor.get('name', '').lower()
                is_individual = not any(indicator in name for indicator in [
                    'top', 'best', 'list of', 'directory', 'agents'
                ])
                print(f"     ✅ Individual: {is_individual}")
        else:
            print(f"❌ Serper search failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Error testing Serper directly: {e}")

if __name__ == "__main__":
    # Test both API endpoint and direct Serper search
    test_vendor_search()
    test_serper_direct() 