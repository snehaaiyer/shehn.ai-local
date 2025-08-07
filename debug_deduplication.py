#!/usr/bin/env python3
"""
Debug script for deduplication process
"""

from enhanced_serper_api import EnhancedSerperAPI

def debug_deduplication():
    """Debug the deduplication process step by step"""
    
    print("🔍 Debugging Deduplication Process")
    print("=" * 60)
    
    # Initialize the API
    serper_api = EnhancedSerperAPI()
    
    # Test a simple search query to get some raw results
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
            for i, raw_vendor in enumerate(raw_vendors):
                try:
                    vendor_data = serper_api._extract_vendor_data(raw_vendor, category, location)
                    extracted_vendors.append(vendor_data)
                    
                    print(f"\n📋 Vendor {i+1}:")
                    print(f"   Raw Title: {raw_vendor.get('title', 'N/A')}")
                    print(f"   Extracted Name: '{vendor_data.get('name', '')}'")
                    print(f"   Website: {vendor_data.get('website', 'N/A')}")
                    print(f"   Phone: {vendor_data.get('phone', 'N/A')}")
                    print(f"   Email: {vendor_data.get('email', 'N/A')}")
                    print(f"   Score: {vendor_data.get('search_score', 'N/A')}")
                    
                except Exception as e:
                    print(f"   ❌ Error extracting vendor {i+1}: {e}")
            
            # Now test the deduplication process
            print(f"\n🔍 Testing Deduplication...")
            print(f"Input: {len(extracted_vendors)} vendors")
            
            # Test original deduplication
            unique_vendors = serper_api._deduplicate_vendors(extracted_vendors)
            print(f"After deduplication: {len(unique_vendors)} vendors")
            
            if len(unique_vendors) == 0:
                print(f"\n🔧 Manual Deduplication Debug:")
                seen = set()
                for i, vendor in enumerate(extracted_vendors):
                    name = vendor.get('name', '').lower().strip()
                    website = vendor.get('website', '').lower()
                    
                    print(f"\n   Vendor {i+1}:")
                    print(f"      Name: '{name}' (length: {len(name)})")
                    print(f"      Website: {website}")
                    
                    # Check if name is too generic
                    if len(name) < 2 or name in ['', 'contact', 'phone', 'booking']:
                        print(f"      ❌ Skipped: Name too short/generic")
                        continue
                    
                    # Create deduplication key
                    domain = website.split('/')[2] if '//' in website and len(website.split('/')) > 2 else website
                    key = f"{name}_{domain}"
                    print(f"      Key: '{key}'")
                    
                    if key not in seen:
                        seen.add(key)
                        print(f"      ✅ Would be added as unique")
                    else:
                        print(f"      ❌ Duplicate of existing key")
                
                print(f"\n🔧 Trying Relaxed Deduplication...")
                relaxed_vendors = serper_api._relaxed_deduplication(extracted_vendors)
                print(f"After relaxed deduplication: {len(relaxed_vendors)} vendors")
                
                if len(relaxed_vendors) == 0:
                    print(f"\n🔧 Manual Relaxed Deduplication Debug:")
                    for i, vendor in enumerate(extracted_vendors):
                        name = vendor.get('name', '').lower().strip()
                        website = vendor.get('website', '').lower()
                        
                        print(f"\n   Vendor {i+1}:")
                        print(f"      Name: '{name}' (length: {len(name)})")
                        
                        # Skip completely empty names or generic category names
                        if not name or name == '' or len(name) < 3:
                            print(f"      ❌ Skipped: Empty/short name")
                            continue
                        
                        # Skip obvious category pages
                        category_terms = ['top', 'best', 'list', 'commercial', 'services near', 'agents']
                        if any(term in name for term in category_terms):
                            print(f"      ❌ Skipped: Category page")
                            continue
                        
                        print(f"      ✅ Would pass all filters")
    
    except Exception as e:
        print(f"❌ Error in debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_deduplication() 