#!/usr/bin/env python3
"""
Quick Verification of Vendor Contact Enhancements
Demonstrates the improvements made to return individual vendor contact details
"""

import requests
import json

def verify_enhancements():
    """Verify that the enhancements are working correctly"""
    
    print("🎯 Vendor Contact Enhancement Verification")
    print("=" * 50)
    
    # Test the enhanced API
    url = "http://localhost:8000/api/vendor-data/venues"
    payload = {
        'city': 'mumbai',
        'use_serper': 'true'
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                vendors = data.get('vendors', [])
                
                print(f"✅ API Response Success")
                print(f"📊 Found {len(vendors)} vendors")
                print(f"🔍 Source: {data.get('source', 'unknown')}")
                print(f"✅ Individual contacts verified: {data.get('individual_contacts_verified', False)}")
                
                # Show first vendor details
                if vendors:
                    vendor = vendors[0]
                    print(f"\n🏆 Sample Vendor Details:")
                    print(f"   Name: {vendor.get('name', 'N/A')}")
                    print(f"   Phone: {vendor.get('phone', 'N/A')}")
                    print(f"   Email: {vendor.get('email', 'N/A')}")
                    print(f"   Website: {vendor.get('website', 'N/A')}")
                    print(f"   WhatsApp: {vendor.get('whatsapp', 'N/A')}")
                    print(f"   Contact Score: {vendor.get('contact_score', 0)}/100")
                    print(f"   Valid Phone: {vendor.get('has_valid_phone', False)}")
                    print(f"   Valid Email: {vendor.get('has_valid_email', False)}")
                    print(f"   Valid Website: {vendor.get('has_valid_website', False)}")
                    print(f"   Valid WhatsApp: {vendor.get('has_valid_whatsapp', False)}")
                    
                    # Verify it's an individual vendor
                    name = vendor.get('name', '').lower()
                    is_individual = not any(indicator in name for indicator in [
                        'top', 'best', 'list of', 'directory', 'agents', 'services in'
                    ])
                    print(f"   Individual Vendor: {is_individual}")
                    
                    if is_individual and vendor.get('contact_score', 0) >= 50:
                        print(f"\n🎉 SUCCESS: Individual vendor with valid contact details!")
                    else:
                        print(f"\n⚠️  Needs improvement: Not an individual vendor or poor contact info")
                
                # Summary
                total_score = sum(v.get('contact_score', 0) for v in vendors)
                avg_score = total_score / len(vendors) if vendors else 0
                
                print(f"\n📊 Summary:")
                print(f"   Average Contact Score: {avg_score:.1f}/100")
                print(f"   Vendors with Phone: {sum(1 for v in vendors if v.get('has_valid_phone'))}/{len(vendors)}")
                print(f"   Vendors with Email: {sum(1 for v in vendors if v.get('has_valid_email'))}/{len(vendors)}")
                print(f"   Vendors with Website: {sum(1 for v in vendors if v.get('has_valid_website'))}/{len(vendors)}")
                print(f"   Vendors with WhatsApp: {sum(1 for v in vendors if v.get('has_valid_whatsapp'))}/{len(vendors)}")
                
            else:
                print(f"❌ API Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_enhancements() 