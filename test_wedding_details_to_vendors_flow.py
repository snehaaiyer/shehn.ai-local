
#!/usr/bin/env python3
"""
Dry Run Test: Wedding Details to Vendor Discovery Flow
Tests the complete user journey from entering wedding details to finding vendors
"""

import asyncio
import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WeddingFlowDryRunTester:
    """Test the complete wedding planning flow"""
    
    def __init__(self):
        self.frontend_url = "http://0.0.0.0:3000"
        self.backend_url = "http://0.0.0.0:8001"
        self.test_results = []
        
    async def run_complete_flow_test(self):
        """Run complete wedding details to vendor discovery flow"""
        logger.info("🌸 Starting Wedding Details to Vendor Discovery Flow Test")
        logger.info("=" * 70)
        
        # Test wedding data (simulating user input)
        test_wedding_data = {
            "yourName": "Priya",
            "partnerName": "Arjun", 
            "weddingDate": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
            "city": "Mumbai",
            "budgetRange": "Mid Range - 5-15 Lakhs",
            "guestCount": 250,
            "weddingType": "Hindu",
            "events": ["Mehndi", "Sangeet", "Wedding", "Reception"],
            "priorities": ["venue", "photography", "catering"]
        }
        
        print(f"👥 Test Couple: {test_wedding_data['yourName']} & {test_wedding_data['partnerName']}")
        print(f"📅 Wedding Date: {test_wedding_data['weddingDate']}")
        print(f"📍 Location: {test_wedding_data['city']}")
        print(f"💰 Budget: {test_wedding_data['budgetRange']}")
        print(f"👥 Guests: {test_wedding_data['guestCount']}")
        print(f"🎯 Priorities: {', '.join(test_wedding_data['priorities'])}")
        print()
        
        try:
            # Step 1: Test Backend Services
            await self.test_backend_health()
            
            # Step 2: Save Wedding Data
            await self.test_save_wedding_data(test_wedding_data)
            
            # Step 3: Test Vendor Discovery for Each Category
            await self.test_vendor_discovery_flow(test_wedding_data)
            
            # Step 4: Test Complete Integration
            await self.test_end_to_end_integration(test_wedding_data)
            
            # Step 5: Generate Report
            await self.generate_flow_test_report()
            
        except Exception as e:
            logger.error(f"Flow test failed: {e}")
    
    async def test_backend_health(self):
        """Test 1: Backend Service Health"""
        logger.info("🏥 Step 1: Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                print(f"   ✅ Backend Health: {health_data.get('status', 'unknown')}")
                print(f"   🔧 Features: {health_data.get('features', {})}")
                self.test_results.append({
                    "step": "backend_health",
                    "status": "PASS",
                    "details": health_data
                })
                return True
            else:
                print(f"   ❌ Backend Health: HTTP {response.status_code}")
                self.test_results.append({
                    "step": "backend_health",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
                return False
        except Exception as e:
            print(f"   ❌ Backend Health: Connection failed - {e}")
            self.test_results.append({
                "step": "backend_health",
                "status": "FAIL",
                "error": str(e)
            })
            return False
    
    async def test_save_wedding_data(self, wedding_data: Dict):
        """Test 2: Save Wedding Data"""
        logger.info("💾 Step 2: Testing Wedding Data Save...")
        
        try:
            # Format data for backend API
            api_data = {
                "partner1Name": wedding_data["yourName"],
                "partner2Name": wedding_data["partnerName"],
                "weddingDate": wedding_data["weddingDate"],
                "city": wedding_data["city"],
                "budget": wedding_data["budgetRange"],
                "guestCount": wedding_data["guestCount"],
                "weddingType": wedding_data["weddingType"],
                "events": wedding_data["events"],
                "priorities": wedding_data["priorities"]
            }
            
            response = requests.post(
                f"{self.backend_url}/api/wedding-data",
                json=api_data,
                timeout=15
            )
            
            if response.status_code == 200:
                save_result = response.json()
                if save_result.get("success"):
                    print(f"   ✅ Wedding Data Saved: Record ID {save_result.get('record_id', 'N/A')}")
                    self.test_results.append({
                        "step": "save_wedding_data",
                        "status": "PASS",
                        "details": save_result,
                        "record_id": save_result.get('record_id')
                    })
                    return True
                else:
                    print(f"   ❌ Save Failed: {save_result.get('error')}")
                    self.test_results.append({
                        "step": "save_wedding_data",
                        "status": "FAIL",
                        "error": save_result.get('error')
                    })
                    return False
            else:
                print(f"   ❌ Save Failed: HTTP {response.status_code}")
                self.test_results.append({
                    "step": "save_wedding_data",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
                return False
                
        except Exception as e:
            print(f"   ❌ Save Error: {e}")
            self.test_results.append({
                "step": "save_wedding_data",
                "status": "FAIL",
                "error": str(e)
            })
            return False
    
    async def test_vendor_discovery_flow(self, wedding_data: Dict):
        """Test 3: Vendor Discovery for Each Category"""
        logger.info("🔍 Step 3: Testing Vendor Discovery Flow...")
        
        vendor_categories = ["venues", "photography", "catering", "decoration", "beauty", "planners"]
        vendor_results = {}
        
        for category in vendor_categories:
            print(f"\n   🔍 Testing {category.title()} Vendors...")
            
            try:
                # Test vendor discovery API
                search_params = {
                    "category": category,
                    "location": wedding_data["city"],
                    "budget": wedding_data["budgetRange"],
                    "guestCount": wedding_data["guestCount"],
                    "weddingType": wedding_data["weddingType"]
                }
                
                # Use the unified backend endpoint
                response = requests.post(
                    f"{self.backend_url}/api/vendor-data/{category}",
                    json=search_params,
                    timeout=30
                )
                
                if response.status_code == 200:
                    vendor_result = response.json()
                    
                    if vendor_result.get("success"):
                        vendors = vendor_result.get("vendors", [])
                        source = vendor_result.get("source", "unknown")
                        
                        print(f"      ✅ Found {len(vendors)} {category} vendors (source: {source})")
                        
                        # Validate vendor data structure
                        if vendors and len(vendors) > 0:
                            sample_vendor = vendors[0]
                            required_fields = ["name", "location", "rating"]
                            
                            has_required_fields = all(field in sample_vendor for field in required_fields)
                            has_contact_info = any(field in sample_vendor for field in ["phone", "email"])
                            
                            if has_required_fields and has_contact_info:
                                print(f"         📋 Vendor data structure: Valid")
                                print(f"         📞 Contact info available: Yes")
                                print(f"         ⭐ Sample rating: {sample_vendor.get('rating', 'N/A')}")
                                
                                vendor_results[category] = {
                                    "status": "PASS",
                                    "count": len(vendors),
                                    "source": source,
                                    "sample_vendor": sample_vendor["name"]
                                }
                            else:
                                print(f"         ❌ Vendor data structure: Invalid")
                                vendor_results[category] = {
                                    "status": "FAIL",
                                    "error": "Invalid vendor data structure",
                                    "count": len(vendors)
                                }
                        else:
                            print(f"      ⚠️ No vendors found for {category}")
                            vendor_results[category] = {
                                "status": "WARN",
                                "count": 0,
                                "message": "No vendors found"
                            }
                    else:
                        print(f"      ❌ API Error: {vendor_result.get('error')}")
                        vendor_results[category] = {
                            "status": "FAIL",
                            "error": vendor_result.get('error')
                        }
                else:
                    print(f"      ❌ HTTP Error: {response.status_code}")
                    vendor_results[category] = {
                        "status": "FAIL",
                        "error": f"HTTP {response.status_code}"
                    }
                    
            except Exception as e:
                print(f"      ❌ Exception: {e}")
                vendor_results[category] = {
                    "status": "FAIL",
                    "error": str(e)
                }
        
        # Summary
        passed_categories = sum(1 for result in vendor_results.values() if result["status"] == "PASS")
        total_categories = len(vendor_categories)
        
        print(f"\n   📊 Vendor Discovery Summary: {passed_categories}/{total_categories} categories working")
        
        self.test_results.append({
            "step": "vendor_discovery",
            "status": "PASS" if passed_categories >= total_categories * 0.8 else "FAIL",
            "category_results": vendor_results,
            "summary": f"{passed_categories}/{total_categories} categories working"
        })
    
    async def test_end_to_end_integration(self, wedding_data: Dict):
        """Test 4: End-to-End Integration"""
        logger.info("🔄 Step 4: Testing End-to-End Integration...")
        
        integration_tests = []
        
        # Test 4.1: AI Chat Integration
        await self.test_ai_chat_integration(wedding_data, integration_tests)
        
        # Test 4.2: Budget Analysis
        await self.test_budget_analysis(wedding_data, integration_tests)
        
        # Test 4.3: Image Generation
        await self.test_image_generation(wedding_data, integration_tests)
        
        # Test 4.4: Message Generation
        await self.test_message_generation(wedding_data, integration_tests)
        
        # Integration summary
        passed_tests = sum(1 for test in integration_tests if test["status"] == "PASS")
        total_tests = len(integration_tests)
        
        print(f"\n   🔗 Integration Summary: {passed_tests}/{total_tests} integration tests passed")
        
        self.test_results.append({
            "step": "end_to_end_integration",
            "status": "PASS" if passed_tests >= total_tests * 0.75 else "FAIL",
            "integration_results": integration_tests,
            "summary": f"{passed_tests}/{total_tests} integration tests passed"
        })
    
    async def test_ai_chat_integration(self, wedding_data: Dict, integration_tests: List):
        """Test AI chat integration"""
        print("\n   🤖 Testing AI Chat Integration...")
        
        try:
            chat_message = f"I'm planning a {wedding_data['weddingType']} wedding in {wedding_data['city']} for {wedding_data['guestCount']} guests. What should I prioritize?"
            
            response = requests.post(
                f"{self.backend_url}/api/ai/chat",
                json={
                    "message": chat_message,
                    "context": wedding_data
                },
                timeout=20
            )
            
            if response.status_code == 200:
                ai_result = response.json()
                if ai_result.get("success"):
                    print(f"      ✅ AI Chat: Response received")
                    print(f"      💬 Response type: {ai_result.get('source', 'unknown')}")
                    integration_tests.append({
                        "test": "ai_chat",
                        "status": "PASS",
                        "details": "AI chat integration working"
                    })
                else:
                    print(f"      ❌ AI Chat: {ai_result.get('error')}")
                    integration_tests.append({
                        "test": "ai_chat",
                        "status": "FAIL",
                        "error": ai_result.get('error')
                    })
            else:
                print(f"      ❌ AI Chat: HTTP {response.status_code}")
                integration_tests.append({
                    "test": "ai_chat",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
        except Exception as e:
            print(f"      ❌ AI Chat Exception: {e}")
            integration_tests.append({
                "test": "ai_chat",
                "status": "FAIL",
                "error": str(e)
            })
    
    async def test_budget_analysis(self, wedding_data: Dict, integration_tests: List):
        """Test budget analysis integration"""
        print("\n   💰 Testing Budget Analysis...")
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/budget-analysis",
                json={
                    "budget_range": wedding_data["budgetRange"],
                    "guest_count": wedding_data["guestCount"],
                    "wedding_type": wedding_data["weddingType"],
                    "events": wedding_data["events"]
                },
                timeout=15
            )
            
            if response.status_code == 200:
                budget_result = response.json()
                if budget_result.get("success"):
                    allocations = budget_result.get("allocations", {})
                    print(f"      ✅ Budget Analysis: {len(allocations)} categories analyzed")
                    print(f"      💰 Sample allocation - Venue: {allocations.get('venue', {}).get('amount_formatted', 'N/A')}")
                    integration_tests.append({
                        "test": "budget_analysis",
                        "status": "PASS",
                        "details": f"{len(allocations)} budget categories"
                    })
                else:
                    print(f"      ❌ Budget Analysis: {budget_result.get('error')}")
                    integration_tests.append({
                        "test": "budget_analysis",
                        "status": "FAIL",
                        "error": budget_result.get('error')
                    })
            else:
                print(f"      ❌ Budget Analysis: HTTP {response.status_code}")
                integration_tests.append({
                    "test": "budget_analysis",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
        except Exception as e:
            print(f"      ❌ Budget Analysis Exception: {e}")
            integration_tests.append({
                "test": "budget_analysis",
                "status": "FAIL",
                "error": str(e)
            })
    
    async def test_image_generation(self, wedding_data: Dict, integration_tests: List):
        """Test image generation integration"""
        print("\n   🖼️ Testing Image Generation...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/theme-images", timeout=15)
            
            if response.status_code == 200:
                image_result = response.json()
                if image_result.get("success"):
                    images = image_result.get("images", [])
                    print(f"      ✅ Theme Images: {len(images)} themes available")
                    integration_tests.append({
                        "test": "image_generation",
                        "status": "PASS",
                        "details": f"{len(images)} theme images"
                    })
                else:
                    print(f"      ❌ Theme Images: {image_result.get('error')}")
                    integration_tests.append({
                        "test": "image_generation",
                        "status": "FAIL",
                        "error": image_result.get('error')
                    })
            else:
                print(f"      ❌ Theme Images: HTTP {response.status_code}")
                integration_tests.append({
                    "test": "image_generation",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
        except Exception as e:
            print(f"      ❌ Image Generation Exception: {e}")
            integration_tests.append({
                "test": "image_generation",
                "status": "FAIL",
                "error": str(e)
            })
    
    async def test_message_generation(self, wedding_data: Dict, integration_tests: List):
        """Test message generation integration"""
        print("\n   📝 Testing Message Generation...")
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/generate-message",
                json={
                    "vendor_info": {
                        "name": "Test Venue",
                        "category": "venues"
                    },
                    "wedding_info": {
                        "wedding_date": wedding_data["weddingDate"],
                        "couple_names": f"{wedding_data['yourName']} & {wedding_data['partnerName']}",
                        "guest_count": wedding_data["guestCount"]
                    },
                    "message_type": "inquiry"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                message_result = response.json()
                if message_result.get("success"):
                    message = message_result.get("message", "")
                    print(f"      ✅ Message Generation: {len(message)} character message")
                    integration_tests.append({
                        "test": "message_generation",
                        "status": "PASS",
                        "details": f"Generated {len(message)} character message"
                    })
                else:
                    print(f"      ❌ Message Generation: {message_result.get('error')}")
                    integration_tests.append({
                        "test": "message_generation",
                        "status": "FAIL",
                        "error": message_result.get('error')
                    })
            else:
                print(f"      ❌ Message Generation: HTTP {response.status_code}")
                integration_tests.append({
                    "test": "message_generation",
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
        except Exception as e:
            print(f"      ❌ Message Generation Exception: {e}")
            integration_tests.append({
                "test": "message_generation",
                "status": "FAIL",
                "error": str(e)
            })
    
    async def generate_flow_test_report(self):
        """Generate comprehensive flow test report"""
        total_steps = len(self.test_results)
        passed_steps = sum(1 for result in self.test_results if result["status"] == "PASS")
        
        report = {
            "test_summary": {
                "test_type": "Wedding Details to Vendor Discovery Flow",
                "timestamp": datetime.now().isoformat(),
                "total_steps": total_steps,
                "passed_steps": passed_steps,
                "pass_rate": f"{(passed_steps/total_steps*100):.1f}%" if total_steps > 0 else "0%"
            },
            "flow_results": self.test_results,
            "recommendations": self._generate_flow_recommendations()
        }
        
        # Save detailed report
        report_filename = f"wedding_flow_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("\n" + "=" * 70)
        print("🎭 WEDDING FLOW DRY RUN TEST RESULTS")
        print("=" * 70)
        print(f"✅ Steps Passed: {passed_steps}/{total_steps}")
        print(f"📊 Success Rate: {report['test_summary']['pass_rate']}")
        print(f"📁 Report: {report_filename}")
        
        # Print step details
        print(f"\n📋 STEP RESULTS:")
        for result in self.test_results:
            status_emoji = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⚠️"
            print(f"  {status_emoji} {result['step'].replace('_', ' ').title()}")
            if result["status"] == "FAIL" and "error" in result:
                print(f"     Error: {result['error']}")
        
        # Print recommendations
        recommendations = report["recommendations"]
        if recommendations:
            print(f"\n🔧 RECOMMENDATIONS:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        
        print("=" * 70)
        
        return report
    
    def _generate_flow_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Check specific failures
        for result in self.test_results:
            if result["status"] == "FAIL":
                step = result["step"]
                
                if step == "backend_health":
                    recommendations.append("Start the unified backend server: python unified_wedding_server.py")
                
                elif step == "save_wedding_data":
                    recommendations.append("Check wedding data API endpoint and database connectivity")
                
                elif step == "vendor_discovery":
                    recommendations.append("Verify vendor search algorithms and data sources")
                
                elif step == "end_to_end_integration":
                    recommendations.append("Check AI service integrations and API connections")
        
        # General recommendations
        if not recommendations:
            recommendations.append("All tests passed! The wedding planning flow is working correctly.")
        else:
            recommendations.append("Run health_monitor.py to check service status")
            recommendations.append("Check backend logs for detailed error information")
        
        return recommendations

# CLI Runner
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Wedding Flow Dry Run Tester")
    parser.add_argument("--backend-url", default="http://0.0.0.0:8001", help="Backend URL")
    parser.add_argument("--frontend-url", default="http://0.0.0.0:3000", help="Frontend URL")
    
    args = parser.parse_args()
    
    tester = WeddingFlowDryRunTester()
    tester.backend_url = args.backend_url
    tester.frontend_url = args.frontend_url
    
    asyncio.run(tester.run_complete_flow_test())
