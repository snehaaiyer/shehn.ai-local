#!/usr/bin/env python3
"""
Simple test to bypass filtering and get raw vendor results
"""

from enhanced_serper_api import EnhancedSerperAPI

def test_simple_search():
    """Test simple search without heavy filtering"""
    
    print("🔍 Testing Simple Search (Bypass Filtering)")
    print("=" * 60)
    
    # Initialize the API
    serper_api = EnhancedSerperAPI()
    
    # Test a simple search query
    test_query = '"Delhi photography" contact phone'
    category = "photography"
    location = "Delhi"
    
    try:
        # Execute a raw search
        raw_vendors = serper_api._execute_vendor_search(test_query, category, location, 10)
        print(f"📊 Raw vendors found: {len(raw_vendors)}")
        
        if raw_vendors:
            # Extract vendor data for each result
            extracted_vendors = []
            for i, raw_vendor in enumerate(raw_vendors[:5]):  # Test first 5
                try:
                    vendor_data = serper_api._extract_vendor_data(raw_vendor, category, location)
                    extracted_vendors.append(vendor_data)
                    
                    print(f"\n📋 Vendor {i+1}:")
                    print(f"   Name: '{vendor_data.get('name', '')}'")
                    print(f"   Phone: {vendor_data.get('phone', 'N/A')}")
                    print(f"   Email: {vendor_data.get('email', 'N/A')}")
                    print(f"   Website: {vendor_data.get('website', 'N/A')}")
                    print(f"   Rating: {vendor_data.get('rating', 'N/A')}")
                    
                except Exception as e:
                    print(f"   ❌ Error extracting vendor {i+1}: {e}")
            
            # Create a simple response format
            simple_response = {
                'success': True,
                'total_found': len(extracted_vendors),
                'vendors': extracted_vendors,
                'location': location,
                'category': category,
                'search_metadata': {
                    'raw_results': len(raw_vendors),
                    'extracted_results': len(extracted_vendors),
                    'timestamp': '2025-07-22T11:20:00Z'
                }
            }
            
            print(f"\n🎉 SUCCESS!")
            print(f"Found {len(extracted_vendors)} vendors")
            
            # Show first vendor in detail
            if extracted_vendors:
                vendor = extracted_vendors[0]
                print(f"\n📋 Featured Vendor:")
                print(f"   🏷️ Name: {vendor.get('name', 'N/A')}")
                print(f"   📍 Location: {vendor.get('location', 'N/A')}")
                print(f"   📞 Phone: {vendor.get('phone', 'N/A')}")
                print(f"   📧 Email: {vendor.get('email', 'N/A')}")
                print(f"   🌐 Website: {vendor.get('website', 'N/A')}")
                print(f"   ⭐ Rating: {vendor.get('rating', 'N/A')}")
                print(f"   💰 Price Range: {vendor.get('price_range', 'N/A')}")
                print(f"   ✅ Verified: {vendor.get('verified', 'N/A')}")
                
                if 'rating_details' in vendor:
                    rating_details = vendor['rating_details']
                    print(f"   📊 Rating Details:")
                    print(f"      Raw Rating: {rating_details.get('rating', 'N/A')}")
                    print(f"      User Count: {rating_details.get('user_count', 'N/A')}")
                    print(f"      Confidence: {rating_details.get('confidence_score', 'N/A')}")
                    print(f"      Weighted Rating: {rating_details.get('weighted_rating', 'N/A')}")
                
                if 'score_breakdown' in vendor:
                    breakdown = vendor['score_breakdown']
                    print(f"   🎯 Score Breakdown:")
                    print(f"      Total Score: {breakdown.get('total_score', 'N/A')}")
                    print(f"      Contact Score: {breakdown.get('contact_score', 'N/A')}")
                    print(f"      Domain Score: {breakdown.get('domain_score', 'N/A')}")
                    print(f"      Contact Types: {breakdown.get('contact_types', [])}")
            
            return simple_response
                
    except Exception as e:
        print(f"❌ Error in simple search: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = test_simple_search()
    if result:
        print(f"\n✅ Search completed successfully with {result['total_found']} vendors")
    else:
        print(f"\n❌ Search failed") 