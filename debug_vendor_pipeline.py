
#!/usr/bin/env python3
"""
Debug script to examine the vendor data pipeline step by step
"""

import json
import requests
from datetime import datetime
from enhanced_serper_api import EnhancedSerperAPI
from config.api_config import SERPER_API_KEY

def debug_vendor_pipeline():
    """Debug the complete vendor pipeline to find where vendors are being lost"""
    
    print("🔍 DEBUGGING VENDOR PIPELINE")
    print("=" * 60)
    
    # Initialize API
    serper_api = EnhancedSerperAPI()
    
    # Test parameters
    category = "venues"
    location = "Mumbai"
    
    print(f"📋 Testing: {category} in {location}")
    print("-" * 40)
    
    try:
        # Step 1: Generate search queries
        print("\n1️⃣ GENERATING SEARCH QUERIES")
        queries = serper_api._generate_targeted_search_queries(
            category, location, (100000, 500000), 200, "wedding"
        )
        print(f"   Generated {len(queries)} search queries")
        for i, query in enumerate(queries[:5], 1):
            print(f"   {i}. {query}")
        
        # Step 2: Execute raw searches
        print(f"\n2️⃣ EXECUTING RAW SEARCHES (testing first 3 queries)")
        all_raw_results = []
        
        for i, query in enumerate(queries[:3], 1):  # Test first 3 queries
            try:
                print(f"\n   Query {i}: {query[:60]}...")
                raw_results = serper_api._execute_vendor_search(query, category, location, 10)
                print(f"   Raw results: {len(raw_results)}")
                
                # Show sample raw results
                for j, result in enumerate(raw_results[:3], 1):
                    title = result.get('title', 'No title')
                    link = result.get('link', 'No link')
                    snippet = result.get('snippet', 'No snippet')[:100]
                    print(f"      {j}. Title: {title}")
                    print(f"         Link: {link}")
                    print(f"         Snippet: {snippet}...")
                    print()
                
                all_raw_results.extend(raw_results)
                
            except Exception as e:
                print(f"   ❌ Error in query {i}: {e}")
        
        print(f"\n📊 Total raw results collected: {len(all_raw_results)}")
        
        # Step 3: Apply vendor filtering
        print(f"\n3️⃣ APPLYING VENDOR FILTERING")
        filtered_results = serper_api._filter_vendor_results(all_raw_results, category)
        print(f"   Filtered results: {len(filtered_results)}")
        
        if len(filtered_results) == 0:
            print("   ❌ ALL RESULTS FILTERED OUT - ANALYZING WHY")
            
            # Analyze each raw result to see why it was filtered
            for i, result in enumerate(all_raw_results[:10], 1):
                title = result.get('title', '')
                snippet = result.get('snippet', '')
                link = result.get('link', '')
                
                print(f"\n   Raw Result {i}:")
                print(f"      Title: {title}")
                print(f"      Link: {link}")
                
                # Test validation
                is_valid = serper_api._is_valid_vendor_result(result, category)
                print(f"      Is Valid Vendor: {is_valid}")
                
                if not is_valid:
                    # Check specific rejection reasons
                    title_lower = title.lower()
                    
                    # Check collection rejection patterns
                    collection_patterns = [
                        'top', 'best', 'list of', 'find', 'search', 'popular', 'famous',
                        'leading', 'directory', 'agents', 'compare', 'booking agents',
                        'venue booking', 'wedding vendors', 'marriage vendors'
                    ]
                    
                    rejected_patterns = [p for p in collection_patterns if p in title_lower]
                    if rejected_patterns:
                        print(f"      ❌ Rejected for collection patterns: {rejected_patterns}")
                    
                    # Check service category patterns
                    service_patterns = [
                        'services in', 'decoration in', 'booking service',
                        'photography service', 'catering service'
                    ]
                    
                    rejected_service = [p for p in service_patterns if p in title_lower]
                    if rejected_service:
                        print(f"      ❌ Rejected for service patterns: {rejected_service}")
        
        else:
            print(f"   ✅ {len(filtered_results)} results passed filtering")
            for i, result in enumerate(filtered_results[:3], 1):
                title = result.get('title', 'No title')
                score = result.get('score_breakdown', {}).get('total_score', 0)
                print(f"      {i}. {title} (Score: {score})")
        
        # Step 4: Extract vendor data
        print(f"\n4️⃣ EXTRACTING VENDOR DATA")
        extracted_vendors = []
        
        for i, result in enumerate(filtered_results, 1):
            try:
                vendor_data = serper_api._extract_vendor_data(result, category, location)
                extracted_vendors.append(vendor_data)
                
                print(f"   Vendor {i}:")
                print(f"      Name: '{vendor_data.get('name', 'No name')}'")
                print(f"      Phone: {vendor_data.get('phone', 'No phone')}")
                print(f"      Email: {vendor_data.get('email', 'No email')}")
                print(f"      Contact Score: {vendor_data.get('search_score', 0)}")
                
            except Exception as e:
                print(f"   ❌ Error extracting vendor {i}: {e}")
        
        print(f"\n📊 Extracted {len(extracted_vendors)} vendors")
        
        # Step 5: Test deduplication
        print(f"\n5️⃣ TESTING DEDUPLICATION")
        unique_vendors = serper_api._deduplicate_vendors(extracted_vendors)
        print(f"   After deduplication: {len(unique_vendors)} vendors")
        
        if len(unique_vendors) == 0 and len(extracted_vendors) > 0:
            print("   ❌ DEDUPLICATION ELIMINATED ALL VENDORS")
            
            # Test with relaxed deduplication
            relaxed_vendors = serper_api._relaxed_deduplication(extracted_vendors)
            print(f"   After relaxed deduplication: {len(relaxed_vendors)} vendors")
            
            if len(relaxed_vendors) == 0:
                print("   ❌ Even relaxed deduplication failed")
                
                # Show why vendors are being eliminated
                for i, vendor in enumerate(extracted_vendors, 1):
                    name = vendor.get('name', '').lower().strip()
                    print(f"   Vendor {i}:")
                    print(f"      Name: '{name}' (length: {len(name)})")
                    
                    if len(name) < 3:
                        print(f"      ❌ Name too short")
                    elif not name or name == '':
                        print(f"      ❌ Empty name")
                    else:
                        print(f"      ✅ Name looks valid")
        
        # Final summary
        print(f"\n📈 PIPELINE SUMMARY")
        print(f"   Raw search results: {len(all_raw_results)}")
        print(f"   After filtering: {len(filtered_results)}")
        print(f"   After extraction: {len(extracted_vendors)}")
        print(f"   After deduplication: {len(unique_vendors)}")
        
        if len(unique_vendors) == 0:
            print(f"\n💡 RECOMMENDATIONS:")
            print(f"   1. Raw results are being over-filtered")
            print(f"   2. Vendor name extraction may be too strict")
            print(f"   3. Deduplication may be too aggressive")
            print(f"   4. Consider relaxing validation criteria")
        
    except Exception as e:
        print(f"❌ Error in pipeline debug: {e}")
        import traceback
        traceback.print_exc()

def test_simple_serper_call():
    """Test a simple direct Serper API call"""
    
    print("\n🔍 TESTING DIRECT SERPER API CALL")
    print("=" * 60)
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Simple test query
    query = 'Mumbai wedding venues with contact phone'
    
    payload = {
        'q': query,
        'num': 10,
        'gl': 'in',
        'hl': 'en',
        'safe': 'active'
    }
    
    try:
        response = requests.post(
            'https://google.serper.dev/search',
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            organic_results = data.get('organic', [])
            
            print(f"✅ Direct API call successful")
            print(f"📊 Results returned: {len(organic_results)}")
            
            for i, result in enumerate(organic_results[:5], 1):
                title = result.get('title', 'No title')
                link = result.get('link', 'No link')
                snippet = result.get('snippet', 'No snippet')[:100]
                
                print(f"\n{i}. {title}")
                print(f"   Link: {link}")
                print(f"   Snippet: {snippet}...")
                
                # Check if this looks like a real vendor
                if any(word in title.lower() for word in ['hotel', 'resort', 'palace', 'hall', 'garden']):
                    print(f"   ✅ Looks like a real venue")
                else:
                    print(f"   ❓ May not be a specific venue")
        
        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Error in direct API call: {e}")

if __name__ == "__main__":
    # Run the debug pipeline
    debug_vendor_pipeline()
    
    # Also test direct API call
    test_simple_serper_call()
