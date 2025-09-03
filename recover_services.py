
#!/usr/bin/env python3
"""
Service Recovery and Health Restoration Script
Automatically diagnoses and fixes common service issues
"""

import subprocess
import time
import requests
import sys
import os
from pathlib import Path

class ServiceRecovery:
    def __init__(self):
        self.unified_server_url = 'http://0.0.0.0:8001'
        
    def check_unified_server(self) -> bool:
        """Check if unified server is running"""
        try:
            response = requests.get(f'{self.unified_server_url}/health', timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def start_unified_server(self):
        """Start the unified server"""
        print("🚀 Starting unified wedding server...")
        try:
            # Kill any existing processes on port 8001
            subprocess.run(['pkill', '-f', 'unified_wedding_server'], capture_output=True)
            time.sleep(2)
            
            # Start server in background
            process = subprocess.Popen([
                sys.executable, 'unified_wedding_server.py'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for server to start
            for i in range(30):
                if self.check_unified_server():
                    print("✅ Unified server started successfully")
                    return True
                time.sleep(1)
            
            print("❌ Failed to start unified server")
            return False
            
        except Exception as e:
            print(f"❌ Error starting server: {e}")
            return False
    
    def build_react_frontend(self):
        """Build React frontend for production"""
        print("🔨 Building React frontend...")
        try:
            os.chdir('react-frontend')
            
            # Install dependencies
            subprocess.run(['npm', 'install', '--legacy-peer-deps'], check=True)
            
            # Build for production
            subprocess.run(['npm', 'run', 'build'], check=True)
            
            os.chdir('..')
            print("✅ React frontend built successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error building frontend: {e}")
            os.chdir('..')
            return False
    
    def verify_system_health(self):
        """Verify all systems are working"""
        print("🔍 Verifying system health...")
        
        # Test unified server
        if not self.check_unified_server():
            print("❌ Unified server health check failed")
            return False
        
        # Test frontend serving
        try:
            response = requests.get(f'{self.unified_server_url}/', timeout=10)
            if response.status_code != 200:
                print("❌ Frontend not served properly")
                return False
        except:
            print("❌ Frontend serving failed")
            return False
        
        # Test API endpoints
        try:
            response = requests.get(f'{self.unified_server_url}/api/health', timeout=10)
            if response.status_code != 200:
                print("❌ API endpoints not working")
                return False
        except:
            print("❌ API health check failed")
            return False
        
        print("✅ All systems verified healthy")
        return True
    
    def recover_system(self):
        """Complete system recovery process"""
        print("🔧 Starting system recovery process...")
        print("=" * 50)
        
        # Step 1: Build React frontend
        if not self.build_react_frontend():
            print("❌ Recovery failed at frontend build step")
            return False
        
        # Step 2: Start unified server
        if not self.start_unified_server():
            print("❌ Recovery failed at server start step")
            return False
        
        # Step 3: Verify system health
        if not self.verify_system_health():
            print("❌ Recovery completed but system health verification failed")
            return False
        
        print("=" * 50)
        print("🎉 SYSTEM RECOVERY COMPLETED SUCCESSFULLY!")
        print("🌐 Access your app at: http://0.0.0.0:8001")
        print("🔗 API documentation: http://0.0.0.0:8001/api/docs")
        print("=" * 50)
        return True

if __name__ == "__main__":
    recovery = ServiceRecovery()
    success = recovery.recover_system()
    sys.exit(0 if success else 1)
