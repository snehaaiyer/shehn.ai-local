
#!/usr/bin/env python3
"""
Quick service status checker for BID AI Wedding Assistant
"""

import requests
import json
from datetime import datetime

def check_main_server():
    """Check main server status"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Main Server: HEALTHY")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Features: {len(data.get('features', {}))}")
            return True
        else:
            print(f"❌ Main Server: UNHEALTHY (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Main Server: UNREACHABLE ({e})")
        return False

def check_api_endpoints():
    """Check API endpoints"""
    endpoints = [
        ('/api/health', 'API Health'),
        ('/api/budget-analysis', 'Budget Analysis'),
        ('/api/docs', 'API Docs')
    ]
    
    results = []
    for endpoint, name in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=3)
            if response.status_code == 200:
                print(f"✅ {name}: WORKING")
                results.append(True)
            else:
                print(f"⚠️ {name}: STATUS {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ {name}: UNREACHABLE")
            results.append(False)
    
    return all(results)

def main():
    print("🔍 BID AI Wedding Assistant - Service Status Check")
    print("=" * 50)
    print(f"🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    main_healthy = check_main_server()
    print()
    api_healthy = check_api_endpoints()
    print("=" * 50)
    
    if main_healthy and api_healthy:
        print("🎉 ALL SERVICES OPERATIONAL")
        print("🌐 Access your app at: http://localhost:8000")
    else:
        print("⚠️ SOME SERVICES HAVE ISSUES")
        print("Run 'python start_all_services.py' to restart")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
