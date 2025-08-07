#!/usr/bin/env python3
"""
Debug script to trace the enhanced Serper API search flow
"""

from enhanced_serper_api import EnhancedSerperAPI
import json

def debug_search_flow():
    """Debug the search flow step by step"""
    
    print("🔍 Debugging Enhanced Serper API Search Flow")
    print("=" * 60)
    
    # Initialize the API
    serper_api = EnhancedSerperAPI()
    
    # Test with a simple search
    category = "photography"
    location = "Delhi"
    budget_range = (50000, 200000)
    guest_count = 200
    wedding_theme = "Candid Photography"
    max_results = 5
    
    print(f"📋 Search Parameters:")
    print(f"   Category: {category}")
    print(f"   Location: {location}")
    print(f"   Budget: ₹{budget_range[0]:,} - ₹{budget_range[1]:,}")
    print(f"   Guests: {guest_count}")
    print(f"   Theme: {wedding_theme}")
    print(f"   Max Results: {max_results}")
    
    try:
        # Execute the search
        results = serper_api.search_wedding_vendors(
            category=category,
            location=location,
            budget_range=budget_range,
            guest_count=guest_count,
            wedding_theme=wedding_theme,
            max_results=max_results
        )
        
        print(f"\n📊 Search Results Summary:")
        print(f"   Success: {results['success']}")
        print(f"   Total Found: {results['total_found']}")
        print(f"   Vendors Returned: {len(results.get('vendors', []))}")
        
        if 'search_metadata' in results:
            metadata = results['search_metadata']
            print(f"\n🔍 Search Metadata:")
            print(f"   Search Queries Used: {metadata.get('search_queries_used', 'N/A')}")
            print(f"   Total Results Searched: {metadata.get('total_results_searched', 'N/A')}")
            print(f"   Vendor Results Found: {metadata.get('vendor_results_found', 'N/A')}")
            print(f"   Filters Applied: {metadata.get('filters_applied', [])}")
        
        # Show vendor details if any
        if results.get('vendors'):
            print(f"\n📋 Vendor Details:")
            for i, vendor in enumerate(results['vendors'][:3], 1):
                print(f"\n   {i}. {vendor.get('name', 'Unknown')}")
                print(f"      Location: {vendor.get('location', 'N/A')}")
                print(f"      Phone: {vendor.get('phone', 'N/A')}")
                print(f"      Email: {vendor.get('email', 'N/A')}")
                print(f"      Website: {vendor.get('website', 'N/A')}")
                print(f"      Rating: {vendor.get('rating', 'N/A')}")
                print(f"      Search Score: {vendor.get('search_score', 'N/A')}")
                if 'score_breakdown' in vendor:
                    breakdown = vendor['score_breakdown']
                    print(f"      Score Breakdown:")
                    print(f"         Total: {breakdown.get('total_score', 'N/A')}")
                    print(f"         Contact Types: {breakdown.get('contact_count', 'N/A')}")
                    print(f"         Contact Score: {breakdown.get('contact_score', 'N/A')}")
        else:
            print(f"\n❌ No vendors found - debugging further...")
            
            # Let's test the raw search to see what's happening
            print(f"\n🔧 Testing Raw Search Components...")
            
            # Test a simple search query
            test_query = f'"{location} {category}" contact phone'
            print(f"   Testing query: {test_query}")
            
            try:
                # Try to execute a raw search
                raw_vendors = serper_api._execute_vendor_search(test_query, category, location, 5)
                print(f"   Raw vendors found: {len(raw_vendors)}")
                
                if raw_vendors:
                    print(f"   Sample raw vendor:")
                    sample = raw_vendors[0]
                    print(f"      Title: {sample.get('title', 'N/A')}")
                    print(f"      Link: {sample.get('link', 'N/A')}")
                    print(f"      Snippet: {sample.get('snippet', 'N/A')[:100]}...")
                    
                    # Test the vendor data extraction
                    try:
                        extracted_data = serper_api._extract_vendor_data(sample, category, location)
                        print(f"   Extracted vendor data:")
                        print(f"      Name: {extracted_data.get('name', 'N/A')}")
                        print(f"      Phone: {extracted_data.get('phone', 'N/A')}")
                        print(f"      Email: {extracted_data.get('email', 'N/A')}")
                        print(f"      Score: {extracted_data.get('search_score', 'N/A')}")
                    except Exception as e:
                        print(f"   ❌ Error extracting vendor data: {e}")
                
            except Exception as e:
                print(f"   ❌ Error in raw search: {e}")
    
    except Exception as e:
        print(f"❌ Error in search flow: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_search_flow() 