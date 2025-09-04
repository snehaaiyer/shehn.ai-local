
#!/usr/bin/env python3
"""
Comprehensive Google API Integration Test for Shehnai.AI
Tests Google OAuth, Calendar, Gmail, and Maps API integration
"""

import requests
import json
import os
from datetime import datetime
import asyncio

def test_google_oauth_flow():
    """Test Google OAuth configuration and flow"""
    print("\n🔐 Testing Google OAuth Configuration...")
    
    # Test OAuth discovery endpoint
    try:
        discovery_url = "https://accounts.google.com/.well-known/openid_configuration"
        response = requests.get(discovery_url, timeout=10)
        
        if response.status_code == 200:
            oauth_config = response.json()
            print("✅ Google OAuth discovery endpoint accessible")
            print(f"   Authorization endpoint: {oauth_config.get('authorization_endpoint', 'N/A')}")
            return True
        else:
            print("❌ Cannot access Google OAuth discovery endpoint")
            return False
    except Exception as e:
        print(f"❌ OAuth discovery error: {e}")
        return False

def test_google_apis_availability():
    """Test Google APIs availability"""
    print("\n🔍 Testing Google APIs Availability...")
    
    required_apis = {
        "Google Calendar API": "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        "Gmail API": "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest", 
        "Google+ API (People API)": "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
        "Google Maps API": "https://www.googleapis.com/discovery/v1/apis/maps/v1/rest"
    }
    
    available_apis = []
    
    for api_name, discovery_url in required_apis.items():
        try:
            response = requests.get(discovery_url, timeout=10)
            if response.status_code == 200:
                api_data = response.json()
                print(f"✅ {api_name}: Available")
                print(f"   Version: {api_data.get('version', 'N/A')}")
                available_apis.append(api_name)
            else:
                print(f"❌ {api_name}: Unavailable (Status: {response.status_code})")
        except Exception as e:
            print(f"❌ {api_name}: Error - {e}")
    
    return len(available_apis)

def test_unified_server_google_endpoints():
    """Test unified server Google API endpoints"""
    print("\n🚀 Testing Unified Server Google Endpoints...")
    
    server_url = "http://0.0.0.0:8001"
    
    # Test Google auth URL endpoint
    try:
        response = requests.get(f"{server_url}/api/google/auth-url", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('auth_url'):
                print("✅ Google auth URL endpoint working")
                print(f"   Auth URL: {data['auth_url'][:80]}...")
                return True
            else:
                print("❌ Google auth URL endpoint not working properly")
                return False
        else:
            print(f"❌ Google auth URL endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server connection error: {e}")
        return False

def test_frontend_google_config():
    """Test frontend Google configuration"""
    print("\n⚛️ Testing Frontend Google Configuration...")
    
    config_file = "react-frontend/src/config/google_config.ts"
    
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            content = f.read()
            
        # Check for required configurations
        checks = {
            "CLIENT_ID configured": "CLIENT_ID" in content,
            "API_KEY configured": "API_KEY" in content,
            "DISCOVERY_DOCS configured": "DISCOVERY_DOCS" in content,
            "SCOPES configured": "SCOPES" in content
        }
        
        for check, passed in checks.items():
            if passed:
                print(f"✅ {check}")
            else:
                print(f"❌ {check}")
        
        return all(checks.values())
    else:
        print("❌ Google config file not found")
        return False

def test_environment_variables():
    """Test environment variables"""
    print("\n🔧 Testing Environment Variables...")
    
    # Check backend environment variables
    backend_vars = {
        "GOOGLE_CLIENT_ID": os.getenv('GOOGLE_CLIENT_ID'),
        "GOOGLE_CLIENT_SECRET": os.getenv('GOOGLE_CLIENT_SECRET'),
        "GOOGLE_API_KEY": os.getenv('GOOGLE_API_KEY')
    }
    
    # Check frontend .env file
    frontend_env_file = "react-frontend/.env"
    frontend_vars = {}
    
    if os.path.exists(frontend_env_file):
        with open(frontend_env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    frontend_vars[key] = value
    
    print("Backend Environment Variables:")
    for var, value in backend_vars.items():
        if value and value.strip():
            print(f"✅ {var}: {'*' * 8}...{value[-4:] if len(value) > 4 else '****'}")
        else:
            print(f"❌ {var}: Not set")
    
    print("\nFrontend Environment Variables:")
    for var in ['REACT_APP_GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_API_KEY']:
        if var in frontend_vars and frontend_vars[var].strip():
            value = frontend_vars[var]
            print(f"✅ {var}: {'*' * 8}...{value[-4:] if len(value) > 4 else '****'}")
        else:
            print(f"❌ {var}: Not set")
    
    backend_configured = all(v and v.strip() for v in backend_vars.values())
    frontend_configured = all(frontend_vars.get(var, '').strip() for var in ['REACT_APP_GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_API_KEY'])
    
    return backend_configured and frontend_configured

def test_google_integration_component():
    """Test Google Integration React component"""
    print("\n⚛️ Testing Google Integration Component...")
    
    component_file = "react-frontend/src/components/GoogleIntegration.tsx"
    
    if os.path.exists(component_file):
        with open(component_file, 'r') as f:
            content = f.read()
        
        # Check for required imports and functionality
        checks = {
            "GoogleAPIService import": "GoogleAPIService" in content,
            "Calendar functionality": "Calendar" in content and "createWeddingEvent" in content,
            "Email functionality": "Mail" in content and "sendWeddingInvitation" in content,
            "Authentication handling": "signIn" in content and "signOut" in content,
            "Error handling": "try" in content and "catch" in content
        }
        
        for check, passed in checks.items():
            if passed:
                print(f"✅ {check}")
            else:
                print(f"❌ {check}")
        
        return all(checks.values())
    else:
        print("❌ Google Integration component not found")
        return False

def test_google_api_service():
    """Test Google API Service"""
    print("\n🔧 Testing Google API Service...")
    
    service_file = "react-frontend/src/services/google_api_service.ts"
    
    if os.path.exists(service_file):
        with open(service_file, 'r') as f:
            content = f.read()
        
        # Check for required methods
        required_methods = [
            "initialize",
            "signIn", 
            "signOut",
            "createWeddingEvent",
            "updateWeddingEvent",
            "deleteWeddingEvent",
            "getWeddingEvents",
            "sendWeddingInvitation",
            "sendVendorEmail",
            "getWeddingEmails"
        ]
        
        missing_methods = []
        for method in required_methods:
            if method not in content:
                missing_methods.append(method)
            else:
                print(f"✅ {method} method present")
        
        if missing_methods:
            for method in missing_methods:
                print(f"❌ {method} method missing")
            return False
        else:
            print("✅ All required methods present")
            return True
    else:
        print("❌ Google API Service file not found")
        return False

def run_comprehensive_test():
    """Run all tests and generate report"""
    print("🌸 SHEHNAI.AI GOOGLE INTEGRATION TEST SUITE")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Testing Client ID: REDACTED_GOOGLE_CLIENT_ID")
    print("=" * 60)
    
    test_results = {}
    
    # Run all tests
    test_results['oauth_flow'] = test_google_oauth_flow()
    test_results['apis_availability'] = test_google_apis_availability() >= 3
    test_results['server_endpoints'] = test_unified_server_google_endpoints()
    test_results['frontend_config'] = test_frontend_google_config()
    test_results['environment_vars'] = test_environment_variables()
    test_results['integration_component'] = test_google_integration_component()
    test_results['api_service'] = test_google_api_service()
    
    # Calculate overall score
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n📊 TEST RESULTS SUMMARY")
    print("=" * 30)
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n🎯 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    # Generate recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if not test_results['environment_vars']:
        print("1. Configure Google API keys in environment variables")
    if not test_results['server_endpoints']:
        print("2. Start the unified server on port 8001")
    if not test_results['frontend_config']:
        print("3. Update frontend Google configuration")
    
    if success_rate >= 80:
        print("🎉 Google integration is mostly ready!")
    elif success_rate >= 60:
        print("⚠️ Google integration needs some fixes")
    else:
        print("🚨 Google integration requires significant work")
    
    # Save test report
    report = {
        "timestamp": datetime.now().isoformat(),
        "client_id": "REDACTED_GOOGLE_CLIENT_ID",
        "test_results": test_results,
        "success_rate": success_rate,
        "recommendations": []
    }
    
    with open("google_integration_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Test report saved to: google_integration_test_report.json")
    
    return success_rate >= 70

if __name__ == "__main__":
    success = run_comprehensive_test()
    exit(0 if success else 1)
