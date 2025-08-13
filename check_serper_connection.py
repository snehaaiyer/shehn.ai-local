
#!/usr/bin/env python3
"""
Check Serper API connectivity and configuration
"""

import os
import requests
from config.api_config import SERPER_API_KEY

def check_serper_connection():
    """Check if Serper API is working"""
    
    print("🔍 CHECKING SERPER API CONNECTION")
    print("=" * 60)
    
    # Check API key
    if not SERPER_API_KEY:
        print("❌ SERPER_API_KEY not found in config")
        return False
    
    print(f"✅ API Key loaded: {SERPER_API_KEY[:10]}...")
    
    # Test simple API call
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'q': 'test search',
        'num': 5
    }
    
    try:
        response = requests.post(
            'https://google.serper.dev/search',
            headers=headers,
            json=payload,
            timeout=10
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            organic_count = len(data.get('organic', []))
            print(f"✅ API is working - returned {organic_count} results")
            return True
        elif response.status_code == 401:
            print("❌ API Key is invalid or expired")
            return False
        elif response.status_code == 429:
            print("❌ API rate limit exceeded")
            return False
        else:
            print(f"❌ API error: {response.text}")
            return False
    
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    check_serper_connection()
