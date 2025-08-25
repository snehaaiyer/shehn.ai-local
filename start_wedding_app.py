
#!/usr/bin/env python3
"""
Unified Wedding App Starter
Starts backend and provides React dev instructions
"""

import subprocess
import sys
import time
import requests
import threading
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_backend_health():
    """Check if backend is running"""
    try:
        response = requests.get("http://0.0.0.0:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend():
    """Start the unified backend server"""
    logger.info("🔧 Starting Unified Backend Server...")
    try:
        process = subprocess.Popen([
            sys.executable, "unified_wedding_server.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Wait for backend to start
        for i in range(30):
            if check_backend_health():
                logger.info("✅ Backend server is ready!")
                return process
            time.sleep(1)
            
        logger.error("❌ Backend failed to start properly")
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to start backend: {e}")
        return None

def main():
    print("\n" + "=" * 60)
    print("🎉 Shehnai.AI Wedding Assistant - Unified Platform")
    print("=" * 60)
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("❌ Failed to start backend server")
        sys.exit(1)
    
    print("\n✅ Backend Status:")
    print("   🔧 Unified Server: http://0.0.0.0:8000")
    print("   📋 API Docs: http://0.0.0.0:8000/api/docs")
    print("   💚 Health: http://0.0.0.0:8000/health")
    
    print("\n🎨 To start React Frontend:")
    print("   cd react-frontend")
    print("   npm install --legacy-peer-deps")
    print("   HOST=0.0.0.0 PORT=3000 BROWSER=none npm start")
    
    print("\n📱 Frontend will be available at: http://0.0.0.0:3000")
    print("\n🎉 All services consolidated into single backend!")
    print("   - Vendor Discovery")
    print("   - AI Assistant") 
    print("   - Communications")
    print("   - Image Search")
    print("   - Budget Analysis")
    print("   - Database Management")
    
    try:
        # Keep backend running
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_process.terminate()
        backend_process.wait()
        print("✅ Shutdown complete")

if __name__ == "__main__":
    main()
