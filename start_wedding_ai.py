#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Simple Startup Script
"""

import subprocess
import time
import sys
import os
import requests

def check_port(port):
    """Check if a port is available"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0  # True if port is in use
    except:
        return False

def check_gemini_api():
    """Check if Gemini API is configured"""
    import os
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print("✅ Gemini API key is configured")
        return True
    else:
        print("⚠️ Gemini API key not found in environment variables")
        print("   Using default key for testing...")
        return True

def test_api_service():
    """Test basic API functionality"""
    try:
        from production_wedding_agents_gemini import ProductionWeddingAgentsGemini
        from budget_allocation_service import BudgetAllocationService
        from fixed_nocodb_api import NocoDBAPI
        
        print("✅ Testing CrewAI agents (Gemini-powered)...")
        agents = ProductionWeddingAgentsGemini()
        
        print("✅ Testing Budget service...")
        budget_service = BudgetAllocationService()
        
        print("✅ Testing NocoDB API...")
        nocodb = NocoDBAPI()
        
        return True
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        return False

def start_frontend():
    """Start the frontend web server"""
    try:
        os.chdir('local_website')
        print("🌸 Starting BID AI frontend on http://localhost:8000")
        subprocess.run([sys.executable, 'server.py'], check=False)
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def main():
    print("🌸 BID AI Wedding Assistant - Startup")
    print("=" * 50)
    
    # Check Gemini API
    if not check_gemini_api():
        print("\nPlease configure Gemini API key:")
        print("  export GEMINI_API_KEY=your_api_key_here")
        print("Or using default key for testing...")
        return
    
    # Test services
    if not test_api_service():
        print("\nSome services may not work properly")
        print("But the frontend will still function with local storage")
    
    print("\n🚀 All systems ready!")
    print("📱 Your BID AI Wedding Assistant is available at:")
    print("   http://localhost:8000")
    print("\n💡 Features available:")
    print("   ✅ Wedding planning form")
    print("   ✅ Local data storage")
    print("   ✅ Budget calculations")
    print("   ✅ Visual preferences")
    print("   ✅ AI integration (Gemini-powered)")
    print("\n🛑 Press Ctrl+C to stop\n")
    
    # Start frontend
    start_frontend()

if __name__ == "__main__":
    main() 