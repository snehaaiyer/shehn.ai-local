
#!/usr/bin/env python3
"""
Script to check the number of vendor entries in NocoDB
"""

import requests
import json
from config.nocodb_config import NOCODB_CONFIG

def check_vendor_count():
    """Check the number of vendors in NocoDB"""
    
    print("🔍 CHECKING NOCODB VENDOR COUNT")
    print("=" * 40)
    
    # NocoDB configuration
    base_url = NOCODB_CONFIG["BASE_URL"]
    api_token = NOCODB_CONFIG["API_TOKEN"]
    vendors_table_id = NOCODB_CONFIG["TABLE_IDS"]["vendors"]
    
    # Headers
    headers = {
        'xc-token': api_token,
        'Content-Type': 'application/json'
    }
    
    try:
        # Get all vendors with pagination to get accurate count
        all_vendors = []
        offset = 0
        limit = 100
        
        while True:
            response = requests.get(
                f"{base_url}/api/v2/tables/{vendors_table_id}/records",
                headers=headers,
                params={
                    'limit': limit,
                    'offset': offset
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                vendors = data.get('list', [])
                
                if not vendors:
                    break
                    
                all_vendors.extend(vendors)
                offset += limit
                
                print(f"📊 Fetched {len(vendors)} vendors (offset: {offset-limit})")
                
                # If we got fewer than the limit, we've reached the end
                if len(vendors) < limit:
                    break
            else:
                print(f"❌ Error fetching vendors: {response.status_code}")
                print(f"Response: {response.text}")
                return
        
        # Display results
        total_vendors = len(all_vendors)
        print(f"\n✅ TOTAL VENDOR ENTRIES: {total_vendors}")
        
        if total_vendors > 0:
            # Analyze vendor categories
            categories = {}
            locations = {}
            ratings = []
            
            for vendor in all_vendors:
                # Category analysis
                category = vendor.get('Category', 'Unknown')
                categories[category] = categories.get(category, 0) + 1
                
                # Location analysis
                location = vendor.get('City', vendor.get('Location', 'Unknown'))
                locations[location] = locations.get(location, 0) + 1
                
                # Rating analysis
                rating = vendor.get('Rating', 0)
                if rating and rating > 0:
                    ratings.append(float(rating))
            
            # Display category breakdown
            print(f"\n📋 VENDOR CATEGORIES:")
            for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                print(f"   {category}: {count} vendors")
            
            # Display location breakdown (top 10)
            print(f"\n📍 TOP LOCATIONS:")
            sorted_locations = sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10]
            for location, count in sorted_locations:
                print(f"   {location}: {count} vendors")
            
            # Display rating stats
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                print(f"\n⭐ RATING STATISTICS:")
                print(f"   Average Rating: {avg_rating:.2f}")
                print(f"   Vendors with Ratings: {len(ratings)}/{total_vendors}")
                print(f"   Highest Rating: {max(ratings)}")
                print(f"   Lowest Rating: {min(ratings)}")
        
        print("\n" + "=" * 40)
        
    except Exception as e:
        print(f"❌ Error checking vendor count: {e}")

if __name__ == "__main__":
    check_vendor_count()
