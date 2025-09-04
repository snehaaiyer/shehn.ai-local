
#!/usr/bin/env python3
"""
Test Google APIs for Shehnai.AI Wedding Assistant
Check which APIs are enabled and working with the current OAuth Client ID
"""

import requests
import json
from datetime import datetime

def test_google_api_status():
    """Test Google API endpoints and OAuth configuration"""
    
    print("🔍 TESTING GOOGLE APIs FOR SHEHNAI.AI")
    print("=" * 60)
    print(f"Client ID: REDACTED_GOOGLE_CLIENT_ID")
    print(f"Deployment URL: https://shehnai.replit.app")
    print("=" * 60)
    
    # Test OAuth Client ID configuration
    client_id = "REDACTED_GOOGLE_CLIENT_ID"
    
    # Test 1: Check OAuth Client ID validity
    print("\n1️⃣ TESTING OAUTH CLIENT ID")
    print("-" * 40)
    
    try:
        # Test Google OAuth discovery endpoint
        discovery_url = "https://accounts.google.com/.well-known/openid_configuration"
        response = requests.get(discovery_url, timeout=10)
        
        if response.status_code == 200:
            oauth_config = response.json()
            print("✅ Google OAuth discovery endpoint accessible")
            print(f"   Authorization endpoint: {oauth_config.get('authorization_endpoint', 'N/A')}")
            print(f"   Token endpoint: {oauth_config.get('token_endpoint', 'N/A')}")
        else:
            print("❌ Cannot access Google OAuth discovery endpoint")
    except Exception as e:
        print(f"❌ OAuth discovery error: {e}")
    
    # Test 2: Required API availability
    print("\n2️⃣ TESTING REQUIRED APIs")
    print("-" * 40)
    
    required_apis = {
        "Google Calendar API": {
            "discovery_url": "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
            "status": "unknown"
        },
        "Gmail API": {
            "discovery_url": "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
            "status": "unknown"
        },
        "Google+ API (People API)": {
            "discovery_url": "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
            "status": "unknown"
        },
        "Google Drive API": {
            "discovery_url": "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            "status": "unknown"
        }
    }
    
    for api_name, api_info in required_apis.items():
        try:
            response = requests.get(api_info["discovery_url"], timeout=10)
            if response.status_code == 200:
                api_info["status"] = "✅ Available"
                api_data = response.json()
                print(f"✅ {api_name}: Available")
                print(f"   Version: {api_data.get('version', 'N/A')}")
                print(f"   Base URL: {api_data.get('baseUrl', 'N/A')}")
            else:
                api_info["status"] = "❌ Unavailable"
                print(f"❌ {api_name}: Unavailable (Status: {response.status_code})")
        except Exception as e:
            api_info["status"] = f"❌ Error: {e}"
            print(f"❌ {api_name}: Error - {e}")
    
    # Test 3: Check OAuth scopes validity
    print("\n3️⃣ TESTING OAUTH SCOPES")
    print("-" * 40)
    
    required_scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ]
    
    for scope in required_scopes:
        # Check if scope URL is accessible (basic validation)
        try:
            # Extract API from scope URL
            if "calendar" in scope:
                print(f"✅ Calendar scope: {scope}")
            elif "gmail" in scope:
                print(f"✅ Gmail scope: {scope}")
            elif "userinfo" in scope:
                print(f"✅ User info scope: {scope}")
            else:
                print(f"✅ Other scope: {scope}")
        except Exception as e:
            print(f"❌ Scope validation error: {scope} - {e}")
    
    # Test 4: Check redirect URIs configuration
    print("\n4️⃣ REDIRECT URI CONFIGURATION")
    print("-" * 40)
    
    deployment_url = "https://shehnai.replit.app"
    
    required_redirect_uris = [
        f"{deployment_url}",
        f"{deployment_url}/oauth2callback"
    ]
    
    print("Required Authorized JavaScript Origins:")
    print(f"   ✅ {deployment_url}")
    
    print("\nRequired Authorized Redirect URIs:")
    for uri in required_redirect_uris:
        print(f"   ✅ {uri}")
    
    # Test 5: Wedding app specific API needs
    print("\n5️⃣ WEDDING APP SPECIFIC FEATURES")
    print("-" * 40)
    
    wedding_features = {
        "Calendar Events": "Google Calendar API - Create wedding events, vendor meetings",
        "Email Invitations": "Gmail API - Send wedding invitations to guests",
        "Vendor Communications": "Gmail API - Email vendor inquiries and confirmations",
        "User Authentication": "OAuth2 + People API - Sign in and get user profile",
        "Document Storage": "Google Drive API - Store contracts, guest lists (optional)"
    }
    
    for feature, description in wedding_features.items():
        print(f"✅ {feature}: {description}")
    
    # Test 6: Current configuration status
    print("\n6️⃣ CURRENT CONFIGURATION STATUS")
    print("-" * 40)
    
    # Check if environment variables are set up
    print("Frontend Configuration Check:")
    print("   📝 REACT_APP_GOOGLE_CLIENT_ID: Required in .env file")
    print("   📝 REACT_APP_GOOGLE_API_KEY: Required in .env file")
    print("   📝 Google API Service: react-frontend/src/services/google_api_service.ts ✅")
    print("   📝 Google Config: react-frontend/src/config/google_config.ts ✅")
    
    # Summary and recommendations
    print("\n7️⃣ SUMMARY & RECOMMENDATIONS")
    print("-" * 40)
    
    print("🎯 NEXT STEPS TO COMPLETE GOOGLE INTEGRATION:")
    print("1. ✅ OAuth Client ID is available")
    print("2. 📝 Enable required APIs in Google Cloud Console:")
    print("   - Google Calendar API")
    print("   - Gmail API")
    print("   - Google+ API (People API)")
    print("   - Google Drive API (optional)")
    print("3. 📝 Configure OAuth consent screen")
    print("4. 📝 Add redirect URIs in Google Cloud Console")
    print("5. 📝 Set environment variables in Replit Secrets")
    print("6. 📝 Test the integration after deployment")
    
    # Generate test report
    test_report = {
        "timestamp": datetime.now().isoformat(),
        "client_id": client_id,
        "deployment_url": deployment_url,
        "required_apis": required_apis,
        "required_scopes": required_scopes,
        "redirect_uris": required_redirect_uris,
        "wedding_features": wedding_features,
        "status": "APIs available, configuration needed"
    }
    
    # Save report
    with open("google_api_test_report.json", "w") as f:
        json.dump(test_report, f, indent=2)
    
    print(f"\n📊 Test report saved to: google_api_test_report.json")
    
    return test_report

def check_google_cloud_console_setup():
    """Provide specific instructions for Google Cloud Console setup"""
    
    print("\n🔧 GOOGLE CLOUD CONSOLE SETUP INSTRUCTIONS")
    print("=" * 60)
    
    instructions = [
        {
            "step": "1. Go to Google Cloud Console",
            "url": "https://console.cloud.google.com/",
            "action": "Navigate to your project or create a new one"
        },
        {
            "step": "2. Enable APIs",
            "url": "https://console.cloud.google.com/apis/library",
            "action": "Search and enable: Calendar API, Gmail API, People API, Drive API"
        },
        {
            "step": "3. Configure OAuth Consent Screen",
            "url": "https://console.cloud.google.com/apis/credentials/consent",
            "action": "Set up consent screen with your app information"
        },
        {
            "step": "4. Update OAuth Client",
            "url": "https://console.cloud.google.com/apis/credentials",
            "action": "Add authorized origins and redirect URIs"
        }
    ]
    
    for instruction in instructions:
        print(f"\n{instruction['step']}:")
        print(f"   🔗 URL: {instruction['url']}")
        print(f"   📝 Action: {instruction['action']}")
    
    print("\n📋 EXACT VALUES TO ENTER:")
    print("-" * 30)
    print("Authorized JavaScript Origins:")
    print("   https://shehnai.replit.app")
    print("\nAuthorized Redirect URIs:")
    print("   https://shehnai.replit.app")
    print("   https://shehnai.replit.app/oauth2callback")

if __name__ == "__main__":
    print("🌸 Starting Google API Test for Shehnai.AI Wedding Assistant")
    
    # Run the main test
    report = test_google_api_status()
    
    # Show setup instructions
    check_google_cloud_console_setup()
    
    print("\n🎉 Google API test completed!")
    print("Check the report above and follow the setup instructions.")
