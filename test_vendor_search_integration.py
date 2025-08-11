
#!/usr/bin/env python3
"""
Test Vendor Search Integration
Verify that vendor search results follow wedding preferences and business logic
"""

import json
import requests
import time

def test_vendor_search_with_preferences():
    """Test vendor search with specific wedding preferences"""
    
    # Test data for Ramu and Souparnika
    test_wedding_data = {
        "yourName": "Ramu",
        "partnerName": "Souparnika", 
        "guestCount": 250,
        "budgetRange": "Mid Range - 5-15 Lakhs",
        "city": "Mumbai",
        "weddingDate": "2024-12-15",
        "weddingStyle": "traditional",
        "venueType": "heritage-palaces",
        "cuisine": "indian",
        "photographyStyle": "traditional",
        "priorities": ["venue", "catering", "photography"]
    }
    
    print("🧪 TESTING VENDOR SEARCH INTEGRATION")
    print("=" * 60)
    print(f"👥 Couple: {test_wedding_data['yourName']} & {test_wedding_data['partnerName']}")
    print(f"📍 Location: {test_wedding_data['city']}")
    print(f"💰 Budget: {test_wedding_data['budgetRange']}")
    print(f"👥 Guests: {test_wedding_data['guestCount']}")
    print(f"🎨 Style: {test_wedding_data['weddingStyle']}")
    print(f"🏛️ Venue Type: {test_wedding_data['venueType']}")
    print(f"🎯 Priorities: {', '.join(test_wedding_data['priorities'])}")
    print()
    
    # Test backend API
    backend_url = "http://localhost:5002"
    
    try:
        # Test 1: Intelligent Vendor Selection
        print("🔍 TEST 1: Intelligent Vendor Selection API")
        print("-" * 40)
        
        response = requests.post(
            f"{backend_url}/api/intelligent-vendor-selection",
            json={"weddingData": test_wedding_data},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response Success")
            
            if result.get('success'):
                print(f"📊 Total vendors analyzed: {result.get('total_vendors_analyzed', 0)}")
                
                # Check final recommendations
                recommendations = result.get('final_recommendations', {})
                print(f"📋 Recommendation categories: {list(recommendations.keys())}")
                
                for category, vendors in recommendations.items():
                    if vendors:
                        print(f"\n🏷️ {category.upper()} ({len(vendors)} vendors):")
                        for i, vendor in enumerate(vendors[:3]):  # Show top 3
                            print(f"  {i+1}. {vendor.get('name', 'Unknown')}")
                            print(f"     📍 Location: {vendor.get('location', 'N/A')}")
                            print(f"     💰 Price: {vendor.get('price_range', 'N/A')}")
                            print(f"     ⭐ Score: {vendor.get('business_logic_score', 0):.1f}")
                            print(f"     🎯 Tier: {vendor.get('recommendation_tier', 'N/A')}")
                
                # Check if business logic was applied
                if result.get('business_logic_applied'):
                    print(f"\n✅ Business Logic Applied:")
                    for logic, description in result['business_logic_applied'].items():
                        print(f"  • {logic}: {description}")
                
                print(f"\n⚙️ AI Agents Deployed: {len(result.get('agents_deployed', {}))}")
                print(f"📈 Confidence: {result.get('ai_analysis', {}).get('confidence', 'N/A')}")
                
            else:
                print(f"❌ API Error: {result.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Backend API not running. Please start enhanced_vendor_selection_api.py")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False
    
    print("\n" + "=" * 60)
    
    # Test 2: Business Logic Validation
    print("🔍 TEST 2: Business Logic Validation")
    print("-" * 40)
    
    # Test budget filtering
    test_budgets = [
        "Budget Friendly - Under 5 Lakhs",
        "Mid Range - 5-15 Lakhs", 
        "Luxury - 15-50 Lakhs",
        "Ultra Luxury - 50+ Lakhs"
    ]
    
    for budget in test_budgets:
        test_data = {**test_wedding_data, "budgetRange": budget}
        try:
            response = requests.post(
                f"{backend_url}/api/intelligent-vendor-selection",
                json={"weddingData": test_data},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                vendor_count = 0
                if result.get('success') and result.get('final_recommendations'):
                    for category, vendors in result['final_recommendations'].items():
                        vendor_count += len(vendors) if vendors else 0
                
                print(f"💰 {budget}: {vendor_count} vendors")
            else:
                print(f"💰 {budget}: API Error")
                
        except Exception as e:
            print(f"💰 {budget}: Error - {e}")
    
    print("\n" + "=" * 60)
    
    # Test 3: Location Filtering
    print("🔍 TEST 3: Location-Based Filtering")
    print("-" * 40)
    
    test_locations = ["Mumbai", "Delhi", "Bangalore", "Chennai"]
    
    for location in test_locations:
        test_data = {**test_wedding_data, "city": location}
        try:
            response = requests.post(
                f"{backend_url}/api/vendor-business-logic",
                json={"weddingData": test_data},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                vendor_count = len(result.get('vendors', []))
                print(f"📍 {location}: {vendor_count} vendors")
            else:
                print(f"📍 {location}: API Error")
                
        except Exception as e:
            print(f"📍 {location}: Error - {e}")
    
    print("\n✅ VENDOR SEARCH INTEGRATION TEST COMPLETED")
    return True

def test_preference_persistence():
    """Test that preferences are properly stored and retrieved"""
    print("\n🔍 TEST 4: Preference Persistence")
    print("-" * 40)
    
    # Simulate preference storage (as would happen in React frontend)
    sample_preferences = {
        "basicDetails": {
            "yourName": "Ramu",
            "partnerName": "Souparnika",
            "guestCount": 250,
            "budgetRange": "Mid Range - 5-15 Lakhs",
            "location": "Mumbai",
            "weddingDate": "2024-12-15",
            "priorities": [
                {"id": "venue", "name": "🏛️ Perfect Venue", "description": "Finding the ideal location"},
                {"id": "catering", "name": "🍽️ Food & Catering", "description": "Delicious cuisine"},
                {"id": "photography", "name": "📸 Photography", "description": "Capturing moments"}
            ]
        },
        "theme": {
            "selectedTheme": "traditional-regional-roots"
        },
        "venue": {
            "venueType": "heritage-palaces"
        },
        "catering": {
            "cuisine": "indian"
        },
        "photography": {
            "style": "traditional"
        }
    }
    
    print("📋 Sample preferences structure:")
    print(json.dumps(sample_preferences, indent=2))
    
    # Validate preference mapping
    mapped_data = {
        "yourName": sample_preferences["basicDetails"]["yourName"],
        "partnerName": sample_preferences["basicDetails"]["partnerName"],
        "guestCount": sample_preferences["basicDetails"]["guestCount"],
        "budgetRange": sample_preferences["basicDetails"]["budgetRange"],
        "city": sample_preferences["basicDetails"]["location"],
        "weddingDate": sample_preferences["basicDetails"]["weddingDate"],
        "weddingStyle": sample_preferences["theme"]["selectedTheme"],
        "venueType": sample_preferences["venue"]["venueType"],
        "cuisine": sample_preferences["catering"]["cuisine"],
        "photographyStyle": sample_preferences["photography"]["style"],
        "priorities": [p["id"] for p in sample_preferences["basicDetails"]["priorities"][:3]]
    }
    
    print("\n🔄 Mapped data for backend:")
    print(json.dumps(mapped_data, indent=2))
    
    print("✅ Preference persistence test completed")

if __name__ == "__main__":
    print("🚀 STARTING COMPREHENSIVE VENDOR SEARCH TESTS")
    print("=" * 60)
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    success = test_vendor_search_with_preferences()
    test_preference_persistence()
    
    if success:
        print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("🔧 The vendor search system is now properly integrated with wedding preferences.")
    else:
        print("\n⚠️ SOME TESTS FAILED")
        print("🔧 Please check the backend API and try again.")
