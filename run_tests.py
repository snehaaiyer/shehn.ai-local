#!/usr/bin/env python3
"""
Test Runner for Wedding Platform
Provides easy access to all testing options
"""

import subprocess
import sys
import time
import signal
import os
import requests
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.server_process = None
        self.base_url = "http://localhost:8000"
        
    def check_server_running(self):
        """Check if server is already running"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=3)
            return response.status_code == 200
        except:
            return False
    
    def start_server(self):
        """Start the unified server"""
        if self.check_server_running():
            print("✅ Server already running")
            return True
            
        print("🚀 Starting server...")
        
        # Check if simple_unified_server.py exists
        if not Path("simple_unified_server.py").exists():
            print("❌ simple_unified_server.py not found")
            print("Please ensure you're in the correct directory")
            return False
        
        try:
            # Start server in background
            self.server_process = subprocess.Popen(
                [sys.executable, "simple_unified_server.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            print("⏳ Waiting for server to start...")
            for i in range(15):  # Wait up to 15 seconds
                time.sleep(1)
                if self.check_server_running():
                    print("✅ Server started successfully")
                    return True
                print(f"   Waiting... ({i+1}/15)")
            
            print("❌ Server failed to start within 15 seconds")
            self.stop_server()
            return False
            
        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            return False
    
    def stop_server(self):
        """Stop the server if we started it"""
        if self.server_process:
            print("🛑 Stopping server...")
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
            print("✅ Server stopped")
    
    def run_manual_tests(self):
        """Run interactive manual tests"""
        print("🧪 Starting Manual Test Suite")
        print("=" * 50)
        
        if not self.check_server_running():
            if not self.start_server():
                return False
        
        try:
            from manual_test_checklist import ManualTestChecklist
            tester = ManualTestChecklist(self.base_url)
            return tester.run_all_tests()
        except ImportError:
            print("❌ manual_test_checklist.py not found")
            return False
        except Exception as e:
            print(f"❌ Test execution failed: {e}")
            return False
    
    def run_automated_tests(self, headless=True):
        """Run automated Selenium tests"""
        print("🤖 Starting Automated Test Suite")
        print("=" * 50)
        
        if not self.check_server_running():
            if not self.start_server():
                return False
        
        try:
            from test_automation import WeddingPlatformTester
            tester = WeddingPlatformTester(self.base_url, headless=headless)
            return tester.run_all_tests()
        except ImportError:
            print("❌ test_automation.py not found or Selenium not installed")
            print("Install with: pip install selenium")
            return False
        except Exception as e:
            print(f"❌ Automated test execution failed: {e}")
            return False
    
    def run_api_tests(self):
        """Run API-only tests"""
        print("🔌 Starting API Test Suite")
        print("=" * 50)
        
        if not self.check_server_running():
            if not self.start_server():
                return False
        
        # Simple API tests
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Health Check
        total_tests += 1
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                print("✅ Health Check API")
                tests_passed += 1
            else:
                print("❌ Health Check API")
        except Exception as e:
            print(f"❌ Health Check API: {e}")
        
        # Test 2: Vendor Data API
        total_tests += 1
        try:
            response = requests.get(f"{self.base_url}/api/vendor-data/venues", timeout=10)
            if response.status_code == 200 and len(response.json()) > 0:
                print("✅ Vendor Data API")
                tests_passed += 1
            else:
                print("❌ Vendor Data API")
        except Exception as e:
            print(f"❌ Vendor Data API: {e}")
        
        # Test 3: Budget Analysis API
        total_tests += 1
        try:
            response = requests.post(
                f"{self.base_url}/api/budget-analysis",
                json={"budget": "premium", "weddingDays": 3},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if "totalBudget" in data and "categoryBreakdown" in data:
                    print("✅ Budget Analysis API")
                    tests_passed += 1
                else:
                    print("❌ Budget Analysis API: Invalid response structure")
            else:
                print("❌ Budget Analysis API")
        except Exception as e:
            print(f"❌ Budget Analysis API: {e}")
        
        # Test 4: WhatsApp Message API
        total_tests += 1
        try:
            response = requests.post(
                f"{self.base_url}/api/generate-whatsapp-message",
                json={
                    "vendorName": "Test Venue",
                    "vendorType": "venue",
                    "preferences": {"dateFlexibility": "6months", "weddingDays": 3}
                },
                timeout=10
            )
            if response.status_code == 200:
                print("✅ WhatsApp Message API")
                tests_passed += 1
            else:
                print("❌ WhatsApp Message API")
        except Exception as e:
            print(f"❌ WhatsApp Message API: {e}")
        
        print(f"\n📊 API Tests: {tests_passed}/{total_tests} passed")
        return tests_passed == total_tests
    
    def show_menu(self):
        """Display test menu options"""
        print("\n🧪 Wedding Platform Test Suite")
        print("=" * 40)
        print("1. 📋 Manual Tests (Interactive)")
        print("2. 🤖 Automated Tests (Selenium)")
        print("3. 🤖 Automated Tests (Headless)")
        print("4. 🔌 API Tests Only")
        print("5. 🚀 Start Server Only")
        print("6. 🛑 Stop Server")
        print("7. ❓ Show Test Documentation")
        print("8. 🚪 Exit")
        print("=" * 40)
    
    def show_documentation(self):
        """Show test documentation"""
        print("\n📚 Test Documentation")
        print("=" * 50)
        print("""
🧪 MANUAL TESTS (Option 1)
   Interactive testing guided by prompts
   Tests all functionality step-by-step
   Requires browser interaction
   Best for: Understanding features, debugging issues

🤖 AUTOMATED TESTS (Option 2/3)
   Automated browser testing with Selenium
   Requires Chrome browser and chromedriver
   Option 2: Visible browser windows
   Option 3: Headless (background) execution
   Best for: Regression testing, CI/CD

🔌 API TESTS (Option 4)
   Direct API testing without browser
   Fast execution, no UI dependencies
   Tests core backend functionality
   Best for: Quick health checks

📋 TEST COVERAGE:
   ✅ Enhanced Preferences (save/restore)
   ✅ Vendor Discovery (all categories)
   ✅ Availability & Confidence Scoring
   ✅ Multi-Day Wedding Support
   ✅ Budget Analysis & Scaling
   ✅ Communication Features
   ✅ End-to-End Integration

🔧 REQUIREMENTS:
   Manual Tests: Web browser
   Automated Tests: Chrome + Selenium (pip install selenium)
   API Tests: None (just requests library)

📁 OUTPUT FILES:
   manual_test_results.json - Manual test results
   test_results.json - Automated test results
   test_cases_e2e.md - Detailed test documentation
        """)
    
    def cleanup(self):
        """Cleanup on exit"""
        self.stop_server()
    
    def run_interactive(self):
        """Run interactive test menu"""
        try:
            while True:
                self.show_menu()
                choice = input("\nSelect option (1-8): ").strip()
                
                if choice == "1":
                    self.run_manual_tests()
                elif choice == "2":
                    self.run_automated_tests(headless=False)
                elif choice == "3":
                    self.run_automated_tests(headless=True)
                elif choice == "4":
                    self.run_api_tests()
                elif choice == "5":
                    self.start_server()
                    print("Server running. Press Ctrl+C to stop.")
                    try:
                        while True:
                            time.sleep(1)
                    except KeyboardInterrupt:
                        print("\nStopping server...")
                elif choice == "6":
                    self.stop_server()
                elif choice == "7":
                    self.show_documentation()
                elif choice == "8":
                    break
                else:
                    print("❌ Invalid option. Please select 1-8.")
                
                if choice in ["1", "2", "3", "4"]:
                    input("\nPress Enter to return to menu...")
                    
        except KeyboardInterrupt:
            print("\n\n🛑 Test execution interrupted")
        finally:
            self.cleanup()

def main():
    """Main entry point"""
    runner = TestRunner()
    
    # Handle command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "manual":
            runner.run_manual_tests()
        elif command == "auto":
            headless = "--headless" in sys.argv
            runner.run_automated_tests(headless=headless)
        elif command == "api":
            runner.run_api_tests()
        elif command == "server":
            runner.start_server()
            print("Server running. Press Ctrl+C to stop.")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nStopping server...")
                runner.stop_server()
        elif command == "help":
            print("""
Wedding Platform Test Runner

Usage:
  python run_tests.py                 # Interactive menu
  python run_tests.py manual          # Run manual tests
  python run_tests.py auto            # Run automated tests (visible)
  python run_tests.py auto --headless # Run automated tests (headless)
  python run_tests.py api             # Run API tests only
  python run_tests.py server          # Start server only
  python run_tests.py help            # Show this help

Files Created:
  manual_test_results.json - Manual test results
  test_results.json - Automated test results
  test_cases_e2e.md - Test documentation
            """)
        else:
            print(f"❌ Unknown command: {command}")
            print("Use 'python run_tests.py help' for usage information")
    else:
        # Interactive mode
        runner.run_interactive()

if __name__ == "__main__":
    main() 