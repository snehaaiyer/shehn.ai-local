#!/usr/bin/env python3
"""
Setup Script for Serper AI Integration
Helps configure the Serper API key for image search functionality
"""

import os
import sys
from pathlib import Path

def check_serper_setup():
    """Check if Serper API is properly configured"""
    api_key = os.getenv('SERPER_API_KEY')
    
    print("🔍 Serper AI Configuration Check")
    print("=" * 40)
    
    if api_key:
        print(f"✅ Serper API Key found: {api_key[:8]}...{api_key[-4:]}")
        return True
    else:
        print("❌ Serper API Key not found")
        return False

def setup_instructions():
    """Display setup instructions"""
    print("\n📋 Setup Instructions")
    print("=" * 40)
    print("1. Sign up at https://serper.dev")
    print("2. Get your free API key")
    print("3. Set environment variable:")
    print("   For Mac/Linux:")
    print("   export SERPER_API_KEY='your_api_key_here'")
    print("   For Windows:")
    print("   set SERPER_API_KEY=your_api_key_here")
    print("\n4. Restart your server")
    print("\n💡 Note: Without API key, fallback images will be used")

def test_serper_connection():
    """Test the Serper API connection"""
    try:
        from serper_images import serper_client
        
        print("\n🧪 Testing Serper Connection")
        print("=" * 40)
        
        # Test with a simple query
        test_images = serper_client.search_images("indian wedding", num_results=1)
        
        if test_images and len(test_images) > 0:
            print("✅ Serper API connection successful")
            print(f"📸 Test image found: {test_images[0].get('title', 'Untitled')}")
            return True
        else:
            print("⚠️ Serper API returned no results")
            return False
            
    except Exception as e:
        print(f"❌ Serper API test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🌸 BID AI Wedding Assistant - Serper Setup")
    print("=" * 50)
    
    # Check current setup
    is_configured = check_serper_setup()
    
    if is_configured:
        # Test connection
        test_result = test_serper_connection()
        if test_result:
            print("\n🎉 Serper AI is ready!")
            print("Your wedding images will be fetched dynamically")
        else:
            print("\n⚠️ API key found but connection failed")
            print("Please check your API key and internet connection")
    else:
        # Show setup instructions
        setup_instructions()
    
    print("\n🚀 Ready to start server:")
    print("python simple_unified_server.py")

if __name__ == "__main__":
    main() 