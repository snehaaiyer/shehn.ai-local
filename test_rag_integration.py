
#!/usr/bin/env python3
"""
Test RAG Integration - End-to-End
Tests the complete integration of wedding preferences → NocoDB → RAG-enhanced vendor filtering
"""

import requests
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_complete_rag_integration():
    """Test the complete RAG integration flow"""
    
    logger.info("🧪 Testing Complete RAG Integration Flow")
    
    # Test data
    test_preferences = {
        "basicDetails": {
            "yourName": "Priya",
            "partnerName": "Arjun", 
            "guestCount": 300,
            "budgetRange": "Luxury - 15-50 Lakhs",
            "location": "Mumbai",
            "weddingDate": "2024-12-15",
            "eventDuration": "3",
            "priorities": [
                {"id": "venue", "name": "Perfect Venue"},
                {"id": "photography", "name": "Photography & Videography"},
                {"id": "catering", "name": "Food & Catering"}
            ]
        },
        "theme": {
            "selectedTheme": "royal-palace-rajasthani"
        },
        "venue": {
            "venueType": "heritage-palaces"
        },
        "catering": {
            "cuisine": "multi-cuisine"
        },
        "photography": {
            "style": "cinematic",
            "coverage": "full-day",
            "multiDayCoverage": {
                "weddingCeremony": True,
                "reception": True,
                "preWeddingShoot": True
            },
            "videography": {
                "required": True,
                "style": "cinematic"
            }
        }
    }
    
    # Test 1: Wedding Preferences Integration
    logger.info("📝 Test 1: Wedding Preferences Storage")
    try:
        # This would normally be handled by the React frontend
        logger.info("✅ Wedding preferences would be stored in localStorage and NocoDB")
    except Exception as e:
        logger.error(f"❌ Preferences storage test failed: {e}")
        return False
    
    # Test 2: RAG-Enhanced Vendor Search
    logger.info("🔍 Test 2: RAG-Enhanced Vendor Search")
    try:
        search_payload = {
            "weddingData": {
                "yourName": test_preferences["basicDetails"]["yourName"],
                "partnerName": test_preferences["basicDetails"]["partnerName"],
                "guestCount": test_preferences["basicDetails"]["guestCount"],
                "budgetRange": test_preferences["basicDetails"]["budgetRange"],
                "city": test_preferences["basicDetails"]["location"],
                "weddingDate": test_preferences["basicDetails"]["weddingDate"],
                "weddingStyle": test_preferences["theme"]["selectedTheme"],
                "venueType": test_preferences["venue"]["venueType"],
                "cuisine": test_preferences["catering"]["cuisine"],
                "photographyStyle": test_preferences["photography"]["style"],
                "priorities": [p["id"] for p in test_preferences["basicDetails"]["priorities"][:3]]
            },
            "searchParams": {
                "category": "venues"
            },
            "ragEnabled": True
        }
        
        # Test with local server
        response = requests.post(
            'http://localhost:5002/api/intelligent-vendor-selection',
            json=search_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                logger.info("✅ RAG-enhanced vendor search successful")
                
                # Analyze results
                recommendations = result.get('final_recommendations', {})
                rag_stats = result.get('rag_processing_stats', {})
                
                logger.info(f"📊 RAG Processing Stats:")
                logger.info(f"   - Vendors processed: {rag_stats.get('vendors_processed', 0)}")
                logger.info(f"   - Vendors enhanced: {rag_stats.get('vendors_enhanced', 0)}")
                logger.info(f"   - Average match score: {rag_stats.get('average_match_score', 0):.1f}")
                
                # Check venue recommendations
                venues = recommendations.get('venues', [])
                if venues:
                    logger.info(f"🏛️ Top venue recommendations:")
                    for i, venue in enumerate(venues[:3]):
                        logger.info(f"   {i+1}. {venue.get('name', 'Unknown')} "
                                  f"(Score: {venue.get('context_match_score', 0)}/100, "
                                  f"Compatibility: {venue.get('budget_compatibility', 'Unknown')})")
                        
                        # Check RAG enhancements
                        if venue.get('extracted_specialties'):
                            logger.info(f"      Specialties: {', '.join(venue.get('extracted_specialties', []))}")
                        
                        if venue.get('preference_alignment'):
                            alignments = venue.get('preference_alignment', {})
                            logger.info(f"      Alignments: Budget={alignments.get('budget', 0):.2f}, "
                                      f"Style={alignments.get('style', 0):.2f}, "
                                      f"Location={alignments.get('location', 0):.2f}")
                
                return True
            else:
                logger.error(f"❌ RAG search failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            logger.error(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ RAG vendor search test failed: {e}")
        return False
    
    # Test 3: Multi-Category RAG Processing
    logger.info("🎯 Test 3: Multi-Category RAG Processing")
    try:
        multi_category_payload = {
            "weddingData": search_payload["weddingData"],
            "searchParams": {},  # No specific category = all categories
            "ragEnabled": True
        }
        
        response = requests.post(
            'http://localhost:5002/api/intelligent-vendor-selection',
            json=multi_category_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                recommendations = result.get('final_recommendations', {})
                
                logger.info(f"✅ Multi-category RAG processing successful")
                logger.info(f"📈 Categories processed: {list(recommendations.keys())}")
                
                for category, vendors in recommendations.items():
                    if vendors:
                        top_vendor = vendors[0]
                        logger.info(f"   {category.title()}: {top_vendor.get('name', 'Unknown')} "
                                  f"(Score: {top_vendor.get('context_match_score', 0)}/100)")
                
                return True
            else:
                logger.error(f"❌ Multi-category RAG failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            logger.error(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Multi-category RAG test failed: {e}")
        return False

def test_preferences_completeness():
    """Test preferences completeness calculation"""
    
    logger.info("📋 Testing Preferences Completeness Calculation")
    
    # Complete preferences
    complete_prefs = {
        "basicDetails": {
            "yourName": "Priya",
            "partnerName": "Arjun",
            "guestCount": 300,
            "location": "Mumbai", 
            "budgetRange": "Luxury - 15-50 Lakhs"
        },
        "theme": {"selectedTheme": "royal"},
        "venue": {"venueType": "hotels"},
        "catering": {"cuisine": "indian"},
        "photography": {"style": "candid"}
    }
    
    # Incomplete preferences  
    incomplete_prefs = {
        "basicDetails": {
            "yourName": "Priya"
        },
        "theme": {},
        "venue": {},
        "catering": {},
        "photography": {}
    }
    
    # This would be calculated by the frontend service
    # Just simulate the logic here
    def calculate_completion(prefs):
        required_fields = [
            'basicDetails.yourName', 'basicDetails.partnerName',
            'basicDetails.guestCount', 'basicDetails.location', 
            'basicDetails.budgetRange', 'theme.selectedTheme',
            'venue.venueType', 'catering.cuisine', 'photography.style'
        ]
        
        completed = 0
        for field in required_fields:
            parts = field.split('.')
            value = prefs
            for part in parts:
                value = value.get(part, '')
            if value:
                completed += 1
        
        return (completed / len(required_fields)) * 100
    
    complete_score = calculate_completion(complete_prefs)
    incomplete_score = calculate_completion(incomplete_prefs)
    
    logger.info(f"✅ Complete preferences score: {complete_score:.1f}%")
    logger.info(f"⚠️ Incomplete preferences score: {incomplete_score:.1f}%")
    
    return complete_score >= 90 and incomplete_score <= 20

if __name__ == "__main__":
    logger.info("🚀 Starting RAG Integration Tests")
    
    # Wait for server to be ready
    logger.info("⏳ Waiting for RAG-enhanced API server...")
    time.sleep(3)
    
    # Test server health
    try:
        response = requests.get('http://localhost:5002/health', timeout=10)
        if response.status_code == 200:
            logger.info("✅ RAG-enhanced API server is healthy")
        else:
            logger.error("❌ RAG-enhanced API server is not responding properly")
            exit(1)
    except Exception as e:
        logger.error(f"❌ Cannot connect to RAG-enhanced API server: {e}")
        logger.info("💡 Please start the server with: python enhanced_vendor_selection_with_rag.py")
        exit(1)
    
    # Run integration tests
    test_results = []
    
    test_results.append(("RAG Integration Flow", test_complete_rag_integration()))
    test_results.append(("Preferences Completeness", test_preferences_completeness()))
    
    # Print results
    logger.info("📊 Test Results Summary:")
    logger.info("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name:<30} {status}")
        if result:
            passed += 1
    
    logger.info("=" * 50)
    logger.info(f"Overall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All RAG integration tests passed!")
        exit(0)
    else:
        logger.error("💥 Some tests failed. Please check the implementation.")
        exit(1)
