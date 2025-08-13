
#!/usr/bin/env python3
"""
RAG System Deployment Test
Tests the RAG-enhanced vendor search system end-to-end
"""

import requests
import json
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGSystemTester:
    def __init__(self):
        self.rag_api_url = "http://localhost:5003"
        self.frontend_url = "http://localhost:5000"
        
    def test_rag_api_health(self):
        """Test RAG API health endpoint"""
        try:
            logger.info("🔍 Testing RAG API health...")
            response = requests.get(f"{self.rag_api_url}/api/rag-system-health", timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                logger.info("✅ RAG API Health Check Passed")
                logger.info(f"   Status: {health_data['status']}")
                logger.info(f"   Vector DB: {health_data['rag_components']['vector_database']}")
                logger.info(f"   Vendors in DB: {health_data['rag_components']['style_collection_count']}")
                return True
            else:
                logger.error(f"❌ RAG API Health Check Failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ RAG API Health Check Error: {e}")
            return False
    
    def test_semantic_search(self):
        """Test semantic vendor search"""
        try:
            logger.info("🔍 Testing semantic vendor search...")
            
            test_request = {
                "weddingData": {
                    "yourName": "Priya",
                    "partnerName": "Arjun",
                    "guestCount": 250,
                    "budgetRange": "Luxury - 15-50 Lakhs",
                    "city": "Mumbai",
                    "weddingTheme": "royal",
                    "venueStyle": "luxury heritage",
                    "decorStyle": "elegant traditional",
                    "cuisineStyle": "traditional indian",
                    "photographyStyle": "artistic cinematic",
                    "culturalRequirements": ["traditional ceremonies", "heritage venues"],
                    "priorities": ["venue", "photography", "catering"]
                },
                "searchParams": {
                    "category": "venues"
                },
                "ragEnabled": True,
                "maxResults": 10
            }
            
            response = requests.post(
                f"{self.rag_api_url}/api/rag-vendor-search",
                json=test_request,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result['success'] and result['vendors']:
                    logger.info("✅ Semantic Search Test Passed")
                    logger.info(f"   Vendors Found: {len(result['vendors'])}")
                    logger.info(f"   Search Method: {result['rag_analytics']['search_method']}")
                    logger.info(f"   Avg Final Score: {result['rag_analytics']['average_final_score']}")
                    
                    # Show top vendor
                    top_vendor = result['vendors'][0]
                    logger.info(f"   Top Match: {top_vendor['name']} (Score: {top_vendor['rag_scores']['final_score']:.3f})")
                    
                    return True
                else:
                    logger.error("❌ Semantic Search Test Failed: No vendors returned")
                    return False
            else:
                logger.error(f"❌ Semantic Search Test Failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Semantic Search Test Error: {e}")
            return False
    
    def test_preference_analysis(self):
        """Test preference similarity analysis"""
        try:
            logger.info("🔍 Testing preference similarity analysis...")
            
            test_preferences = {
                "preferences": {
                    "weddingTheme": "traditional",
                    "decorStyle": "elegant",
                    "venueStyle": "heritage",
                    "culturalRequirements": ["traditional ceremonies"],
                    "budgetRange": "Premium",
                    "guestCount": 200
                }
            }
            
            response = requests.post(
                f"{self.rag_api_url}/api/preference-similarity-analysis",
                json=test_preferences,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result['success']:
                    logger.info("✅ Preference Analysis Test Passed")
                    profile = result['preference_profile']
                    logger.info(f"   Style Elements: {profile['style_elements_processed']}")
                    logger.info(f"   Cultural Elements: {profile['cultural_elements_processed']}")
                    logger.info(f"   Service Elements: {profile['service_elements_processed']}")
                    return True
                else:
                    logger.error("❌ Preference Analysis Test Failed")
                    return False
            else:
                logger.error(f"❌ Preference Analysis Test Failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Preference Analysis Test Error: {e}")
            return False
    
    def test_frontend_connectivity(self):
        """Test frontend connectivity"""
        try:
            logger.info("🔍 Testing frontend connectivity...")
            response = requests.get(self.frontend_url, timeout=5)
            
            if response.status_code == 200:
                logger.info("✅ Frontend Connectivity Test Passed")
                return True
            else:
                logger.error(f"❌ Frontend Connectivity Test Failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Frontend Connectivity Test Error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all RAG system tests"""
        logger.info("🚀 Starting RAG System Deployment Tests")
        logger.info("=" * 60)
        
        tests = [
            ("RAG API Health", self.test_rag_api_health),
            ("Semantic Search", self.test_semantic_search),
            ("Preference Analysis", self.test_preference_analysis),
            ("Frontend Connectivity", self.test_frontend_connectivity)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running: {test_name}")
            if test_func():
                passed_tests += 1
            time.sleep(1)  # Brief pause between tests
        
        logger.info("\n" + "=" * 60)
        logger.info(f"📊 Test Results: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            logger.info("🎉 All RAG System Tests Passed!")
            logger.info("✅ RAG-Enhanced Vendor Search is ready for production")
            return True
        else:
            logger.error(f"❌ {total_tests - passed_tests} tests failed")
            logger.info("🔧 Check system logs and fix issues before deployment")
            return False

def main():
    """Main test function"""
    tester = RAGSystemTester()
    
    # Wait for system to start
    logger.info("⏳ Waiting for RAG system to initialize (10 seconds)...")
    time.sleep(10)
    
    success = tester.run_all_tests()
    
    if success:
        logger.info("\n🎯 RAG System Deployment: SUCCESS")
        logger.info("🌐 Access your RAG-enhanced search at: http://localhost:5000")
    else:
        logger.error("\n💥 RAG System Deployment: FAILED")
        exit(1)

if __name__ == "__main__":
    main()
