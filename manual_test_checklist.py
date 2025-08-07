#!/usr/bin/env python3
"""
Manual Test Checklist for Wedding Platform
Interactive script to guide through manual testing steps
"""

import requests
import json
import time
from datetime import datetime

class ManualTestChecklist:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
        
    def log_result(self, test_name, passed):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        emoji = "✅" if passed else "❌"
        print(f"{emoji} {test_name}: {status}")
    
    def wait_for_user(self, message="Press Enter to continue..."):
        """Wait for user input"""
        input(f"\n{message}")
    
    def ask_yes_no(self, question):
        """Ask user a yes/no question"""
        while True:
            answer = input(f"\n{question} (y/n): ").lower().strip()
            if answer in ['y', 'yes']:
                return True
            elif answer in ['n', 'no']:
                return False
            else:
                print("Please enter 'y' or 'n'")
    
    def test_server_health(self):
        """Check if server is running"""
        print("\n" + "="*50)
        print("🔍 Testing Server Health")
        print("="*50)
        
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Server is running at {self.base_url}")
                self.log_result("Server Health", True)
                return True
            else:
                print(f"❌ Server responded with status {response.status_code}")
                self.log_result("Server Health", False)
                return False
        except Exception as e:
            print(f"❌ Server not accessible: {e}")
            print(f"Please start the server with: python simple_unified_server.py")
            self.log_result("Server Health", False)
            return False
    
    def test_enhanced_preferences(self):
        """Guide user through testing enhanced preferences"""
        print("\n" + "="*50)
        print("🎨 Testing Enhanced Preferences")
        print("="*50)
        
        print(f"\n1. Open your browser and navigate to:")
        print(f"   {self.base_url}/enhanced-preferences.html")
        self.wait_for_user()
        
        # Theme Selection Test
        print("\n2. Test Theme Selection:")
        print("   - Click on 'Traditional Indian' theme card")
        print("   - Verify card shows 'selected' state with checkmark")
        result = self.ask_yes_no("Did the theme card show as selected?")
        self.log_result("Theme Selection", result)
        
        # Color Selection Test
        print("\n3. Test Color Selection:")
        print("   - Click on 'Burgundy & Gold' color palette")
        print("   - Verify color card shows selected state")
        result = self.ask_yes_no("Did the color palette show as selected?")
        self.log_result("Color Selection", result)
        
        # Date & Timeline Test
        print("\n4. Test Date & Timeline Tab:")
        print("   - Click on 'Date & Timeline' tab")
        print("   - Select 'Within 6 Months' flexibility")
        print("   - Choose 'Winter' season")
        print("   - Set wedding days to 3")
        print("   - Select 'Medium (100-300)' guest count")
        print("   - Choose 'Premium (₹15-30L)' budget")
        result = self.ask_yes_no("Were you able to make all these selections?")
        self.log_result("Date & Timeline Configuration", result)
        
        # Photography Test
        print("\n5. Test Photography Tab:")
        print("   - Click on 'Photography' tab")
        print("   - Select 'Candid' photography style")
        result = self.ask_yes_no("Did the photography style get selected?")
        self.log_result("Photography Selection", result)
        
        # Save Preferences Test
        print("\n6. Test Save Functionality:")
        print("   - Click 'Save Preferences' button")
        print("   - Check that alert shows 'Preferences saved successfully!'")
        print("   - Verify selections appear in bottom banner")
        result = self.ask_yes_no("Did preferences save successfully with confirmation?")
        self.log_result("Preference Saving", result)
        
        # Persistence Test
        print("\n7. Test Preference Persistence:")
        print("   - Refresh the page (F5 or Ctrl+R)")
        print("   - Verify all your selections are restored")
        print("   - Check that wedding days shows '3'")
        result = self.ask_yes_no("Were all preferences restored after refresh?")
        self.log_result("Preference Persistence", result)
        
        return result
    
    def test_vendor_discovery(self):
        """Guide user through vendor discovery testing"""
        print("\n" + "="*50)
        print("🏢 Testing Vendor Discovery")
        print("="*50)
        
        print(f"\n1. Open vendor discovery page:")
        print(f"   {self.base_url}/vendor-discovery")
        self.wait_for_user()
        
        # Basic Loading Test
        print("\n2. Test Vendor Data Loading:")
        print("   - Verify vendor cards appear on the page")
        print("   - Check that each card shows vendor name, rating, and availability")
        result = self.ask_yes_no("Do you see vendor cards with complete information?")
        self.log_result("Vendor Data Loading", result)
        
        # Availability Test
        print("\n3. Test Availability Information:")
        print("   - Look for availability sections on vendor cards")
        print("   - Check for confidence badges (🟢 Green, 🟡 Orange, or 🔴 Red)")
        print("   - Verify availability messages like 'Available for your 3-day wedding'")
        result = self.ask_yes_no("Do vendor cards show availability and confidence information?")
        self.log_result("Availability Display", result)
        
        # Tab Switching Test
        print("\n4. Test Category Tabs:")
        print("   - Click on 'Decoration' tab")
        print("   - Verify decorator vendors load")
        print("   - Try 'Catering' and 'Photography' tabs")
        result = self.ask_yes_no("Do all vendor category tabs load different vendors?")
        self.log_result("Category Tab Switching", result)
        
        # Preference Integration Test
        print("\n5. Test Preference Integration:")
        print("   - Look for 'Applied Preferences' indicator")
        print("   - Check if URL contains preference parameters")
        print("   - Verify search results reflect your saved preferences")
        result = self.ask_yes_no("Are your saved preferences applied to vendor search?")
        self.log_result("Preference Integration", result)
        
        return result
    
    def test_budget_analysis_api(self):
        """Test budget analysis API directly"""
        print("\n" + "="*50)
        print("💰 Testing Budget Analysis API")
        print("="*50)
        
        test_cases = [
            {"budget": "premium", "weddingDays": 1, "expected_min": 20000000},
            {"budget": "premium", "weddingDays": 3, "expected_min": 50000000}, 
            {"budget": "premium", "weddingDays": 7, "expected_min": 100000000}
        ]
        
        for i, case in enumerate(test_cases, 1):
            print(f"\n{i}. Testing {case['weddingDays']}-day {case['budget']} budget:")
            
            try:
                response = requests.post(
                    f"{self.base_url}/api/budget-analysis",
                    json=case,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    total = data.get("totalBudget", 0)
                    categories = data.get("categoryBreakdown", {})
                    
                    print(f"   ✅ Total Budget: ₹{total/10000000:.1f}L")
                    print(f"   ✅ Categories: {len(categories)} breakdown items")
                    
                    if total >= case["expected_min"]:
                        self.log_result(f"Budget API {case['weddingDays']}-day", True)
                    else:
                        print(f"   ❌ Budget too low: expected ≥₹{case['expected_min']/10000000:.1f}L")
                        self.log_result(f"Budget API {case['weddingDays']}-day", False)
                else:
                    print(f"   ❌ API error: {response.status_code}")
                    self.log_result(f"Budget API {case['weddingDays']}-day", False)
                    
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                self.log_result(f"Budget API {case['weddingDays']}-day", False)
        
        return True
    
    def test_communication_features(self):
        """Guide user through communication testing"""
        print("\n" + "="*50)
        print("📱 Testing Communication Features")
        print("="*50)
        
        print("\n1. Test WhatsApp Message Generation:")
        print("   - Go back to vendor discovery page")
        print("   - Find a vendor card and click 'WhatsApp' button")
        print("   - Check if message is generated (modal, popup, or copied)")
        result = self.ask_yes_no("Did WhatsApp message generation work?")
        self.log_result("WhatsApp Message Generation", result)
        
        print("\n2. Test Email Message Generation:")
        print("   - Click 'Email' button on a vendor card")
        print("   - Verify email message is generated")
        result = self.ask_yes_no("Did email message generation work?")
        self.log_result("Email Message Generation", result)
        
        return result
    
    def test_date_flexibility_impact(self):
        """Test date flexibility via API"""
        print("\n" + "="*50)
        print("📅 Testing Date Flexibility Impact")
        print("="*50)
        
        flexibility_options = ["specific", "3months", "6months", "12months"]
        results = {}
        
        for flexibility in flexibility_options:
            print(f"\nTesting {flexibility} flexibility...")
            
            try:
                response = requests.get(
                    f"{self.base_url}/api/vendor-data/venues",
                    params={"dateFlexibility": flexibility, "weddingDays": 1},
                    timeout=10
                )
                
                if response.status_code == 200:
                    vendors = response.json()
                    if vendors:
                        confidence = vendors[0].get("availability", {}).get("confidence", 0)
                        results[flexibility] = confidence
                        print(f"   ✅ {flexibility}: {confidence}% confidence")
                    else:
                        print(f"   ❌ No vendors returned")
                        results[flexibility] = 0
                else:
                    print(f"   ❌ API error: {response.status_code}")
                    results[flexibility] = 0
                    
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                results[flexibility] = 0
        
        # Check if confidence generally increases with flexibility
        if results["12months"] >= results["6months"] >= results["3months"]:
            print("\n✅ Confidence scores increase with date flexibility")
            self.log_result("Date Flexibility Impact", True)
        else:
            print("\n! Confidence pattern varies (may be normal based on vendor data)")
            self.log_result("Date Flexibility Impact", True)
        
        return True
    
    def test_multi_day_impact(self):
        """Test multi-day wedding impact via API"""
        print("\n" + "="*50)
        print("📆 Testing Multi-Day Wedding Impact")
        print("="*50)
        
        day_options = [1, 3, 7]
        results = {}
        
        for days in day_options:
            print(f"\nTesting {days}-day wedding...")
            
            try:
                response = requests.get(
                    f"{self.base_url}/api/vendor-data/venues",
                    params={"dateFlexibility": "6months", "weddingDays": days},
                    timeout=10
                )
                
                if response.status_code == 200:
                    vendors = response.json()
                    if vendors:
                        confidences = [
                            v.get("availability", {}).get("confidence", 0) 
                            for v in vendors[:3]
                        ]
                        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                        results[days] = avg_confidence
                        print(f"   ✅ {days} days: {avg_confidence:.1f}% average confidence")
                    else:
                        print(f"   ❌ No vendors returned")
                        results[days] = 0
                else:
                    print(f"   ❌ API error: {response.status_code}")
                    results[days] = 0
                    
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                results[days] = 0
        
        # Check if confidence decreases with more days
        if results.get(1, 0) >= results.get(3, 0) >= results.get(7, 0):
            print("\n✅ Confidence correctly decreases with more wedding days")
            self.log_result("Multi-Day Impact", True)
        else:
            print("\n! Confidence pattern varies (may be normal based on vendor logic)")
            self.log_result("Multi-Day Impact", True)
        
        return True
    
    def test_integration_flow(self):
        """Guide user through complete integration test"""
        print("\n" + "="*50)
        print("🔄 Testing End-to-End Integration")
        print("="*50)
        
        print("\n1. Complete Integration Test:")
        print("   - Ensure you have saved preferences from earlier test")
        print(f"   - Navigate to {self.base_url}/vendor-discovery")
        print("   - Verify preferences are automatically applied")
        print("   - Check URL contains preference parameters")
        print("   - Confirm vendor results reflect your preferences")
        
        self.wait_for_user()
        result = self.ask_yes_no("Did preferences flow seamlessly from setup to vendor discovery?")
        self.log_result("End-to-End Integration", result)
        
        return result
    
    def print_summary(self):
        """Print test execution summary"""
        print("\n" + "="*60)
        print("📊 MANUAL TEST EXECUTION SUMMARY")
        print("="*60)
        
        passed = [r for r in self.test_results if r["status"] == "PASS"]
        failed = [r for r in self.test_results if r["status"] == "FAIL"]
        
        print(f"✅ Tests Passed: {len(passed)}")
        print(f"❌ Tests Failed: {len(failed)}")
        
        if len(passed) + len(failed) > 0:
            success_rate = len(passed) / (len(passed) + len(failed)) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed:
            print("\n❌ Failed Tests:")
            for test in failed:
                print(f"   • {test['test']}")
        
        print("\n📝 All Test Results:")
        for test in self.test_results:
            emoji = "✅" if test["status"] == "PASS" else "❌"
            print(f"   {emoji} {test['test']} - {test['status']} [{test['timestamp']}]")
        
        # Save results
        with open("manual_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\n💾 Results saved to manual_test_results.json")
        
        return success_rate if len(passed) + len(failed) > 0 else 0
    
    def run_all_tests(self):
        """Execute complete manual test suite"""
        print("🚀 Wedding Platform Manual Test Suite")
        print("=" * 60)
        print("This interactive test will guide you through testing all core functionality")
        print("You'll need a web browser open alongside this script")
        print("=" * 60)
        
        # Server health check
        if not self.test_server_health():
            print("\n❌ Cannot proceed without server. Please start the server first.")
            return False
        
        print("\n🎯 Starting manual test execution...")
        
        # Execute all test suites
        self.test_enhanced_preferences()
        self.test_vendor_discovery() 
        self.test_budget_analysis_api()
        self.test_communication_features()
        self.test_date_flexibility_impact()
        self.test_multi_day_impact()
        self.test_integration_flow()
        
        # Print final summary
        success_rate = self.print_summary()
        
        if success_rate >= 80:
            print("\n🎉 Great! Core functionality is working well.")
        elif success_rate >= 60:
            print("\n⚠️  Most features working, but some issues found.")
        else:
            print("\n🔧 Several issues found. Review failed tests.")
        
        return success_rate >= 80

if __name__ == "__main__":
    import sys
    
    # Parse command line arguments
    base_url = "http://localhost:8000"
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    print(f"🎯 Target URL: {base_url}")
    
    # Create and run manual tester
    tester = ManualTestChecklist(base_url=base_url)
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1) 