
#!/usr/bin/env python3
"""
Test Backend Google API Integration
Tests the unified_wedding_server.py Google API endpoints
"""

import requests
import json
import time
from datetime import datetime

def test_server_health():
    """Test if the unified server is running"""
    print("🔍 Testing Server Health...")
    
    try:
        response = requests.get("http://0.0.0.0:8001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Server is running")
            print(f"   Service: {data.get('service', 'N/A')}")
            print(f"   Version: {data.get('version', 'N/A')}")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_google_auth_url_endpoint():
    """Test Google auth URL generation endpoint"""
    print("\n🔐 Testing Google Auth URL Endpoint...")
    
    try:
        response = requests.get("http://0.0.0.0:8001/api/google/auth-url", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('auth_url'):
                auth_url = data['auth_url']
                print("✅ Google auth URL endpoint working")
                print(f"   URL length: {len(auth_url)} characters")
                
                # Validate URL structure
                required_params = ['client_id', 'redirect_uri', 'scope', 'response_type']
                missing_params = [param for param in required_params if param not in auth_url]
                
                if not missing_params:
                    print("✅ Auth URL contains all required parameters")
                    return True
                else:
                    print(f"❌ Missing parameters: {missing_params}")
                    return False
            else:
                print("❌ Invalid response format")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing auth URL: {e}")
        return False

def test_google_oauth_callback_endpoint():
    """Test Google OAuth callback endpoint"""
    print("\n🔄 Testing Google OAuth Callback Endpoint...")
    
    # Test with mock authorization code
    test_payload = {
        "code": "test_authorization_code_12345"
    }
    
    try:
        response = requests.post(
            "http://0.0.0.0:8001/api/google/oauth2callback",
            json=test_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ OAuth callback endpoint responding")
                print(f"   Message: {data.get('message', 'N/A')}")
                return True
            else:
                print("❌ OAuth callback returned error")
                print(f"   Error: {data.get('error', 'N/A')}")
                return False
        else:
            print(f"❌ OAuth callback failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing OAuth callback: {e}")
        return False

def test_server_google_credentials():
    """Test if server has Google credentials configured"""
    print("\n🔑 Testing Server Google Credentials...")
    
    try:
        # Check the unified_wedding_server.py file for credential loading
        with open("unified_wedding_server.py", "r") as f:
            content = f.read()
        
        checks = {
            "GOOGLE_CLIENT_ID loading": "GOOGLE_CLIENT_ID" in content,
            "GOOGLE_CLIENT_SECRET loading": "GOOGLE_CLIENT_SECRET" in content,
            "GOOGLE_API_KEY loading": "GOOGLE_API_KEY" in content,
            "Credential logging": "Google OAuth credentials loaded" in content
        }
        
        for check, passed in checks.items():
            if passed:
                print(f"✅ {check}")
            else:
                print(f"❌ {check}")
        
        return all(checks.values())
    except Exception as e:
        print(f"❌ Error checking server credentials: {e}")
        return False

def test_api_documentation():
    """Test API documentation endpoints"""
    print("\n📚 Testing API Documentation...")
    
    try:
        # Test OpenAPI docs
        response = requests.get("http://0.0.0.0:8001/api/docs", timeout=10)
        if response.status_code == 200:
            print("✅ API documentation accessible")
            print("   URL: http://0.0.0.0:8001/api/docs")
            return True
        else:
            print(f"❌ API docs not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error accessing API docs: {e}")
        return False

def run_backend_test():
    """Run comprehensive backend test"""
    print("🚀 BACKEND GOOGLE API INTEGRATION TEST")
    print("=" * 50)
    print(f"Testing server at: http://0.0.0.0:8001")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)
    
    test_results = {}
    
    # Run tests
    test_results['server_health'] = test_server_health()
    test_results['google_auth_url'] = test_google_auth_url_endpoint()
    test_results['oauth_callback'] = test_google_oauth_callback_endpoint()
    test_results['server_credentials'] = test_server_google_credentials()
    test_results['api_docs'] = test_api_documentation()
    
    # Summary
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n📊 BACKEND TEST RESULTS")
    print("=" * 30)
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n🎯 Backend Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    # Recommendations
    if not test_results['server_health']:
        print("\n⚠️ Start the server with: python unified_wedding_server.py")
    if success_rate >= 80:
        print("🎉 Backend Google integration is ready!")
    elif success_rate >= 60:
        print("⚠️ Backend needs minor fixes")
    else:
        print("🚨 Backend requires attention")
    
    return success_rate >= 70

if __name__ == "__main__":
    success = run_backend_test()
    exit(0 if success else 1)
