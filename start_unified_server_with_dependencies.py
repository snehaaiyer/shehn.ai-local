
#!/usr/bin/env python3
"""
Start Unified Wedding Server with proper dependency management
"""

import subprocess
import sys
import time
import requests
import os
import signal
import threading
from pathlib import Path

def check_port_available(port):
    """Check if port is available"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result != 0

def start_nocodb_if_needed():
    """Start NocoDB if not running"""
    try:
        response = requests.get('http://localhost:8080', timeout=3)
        if response.status_code == 200:
            print("✅ NocoDB is already running")
            return True
    except:
        pass
    
    print("🔧 Starting NocoDB...")
    try:
        # Check if we have docker or can run NocoDB
        nocodb_dir = Path('nocodb')
        if not nocodb_dir.exists():
            print("ℹ️  NocoDB not available - server will run in fallback mode")
            return False
        
        # Try to start NocoDB (if available)
        subprocess.Popen(['npm', 'run', 'nocodb'], 
                        cwd='nocodb', 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE)
        
        # Wait for NocoDB to start
        for i in range(20):
            try:
                response = requests.get('http://localhost:8080', timeout=2)
                if response.status_code == 200:
                    print("✅ NocoDB started successfully")
                    return True
            except:
                pass
            time.sleep(1)
        
        print("⚠️ NocoDB startup timeout - continuing in fallback mode")
        return False
    except Exception as e:
        print(f"⚠️ NocoDB startup failed: {e} - continuing in fallback mode")
        return False

def kill_existing_processes():
    """Kill existing processes on our ports"""
    ports = [8001, 8080, 11434]
    for port in ports:
        try:
            # Kill processes on port
            subprocess.run(['pkill', '-f', f':{port}'], capture_output=True)
            subprocess.run(['fuser', '-k', f'{port}/tcp'], capture_output=True, stderr=subprocess.DEVNULL)
        except:
            pass

def main():
    print("🚀 Starting Unified Wedding Server with Dependencies")
    print("="*60)
    
    # Kill existing processes
    print("🧹 Cleaning up existing processes...")
    kill_existing_processes()
    time.sleep(2)
    
    # Set environment variables
    print("🔧 Setting up environment...")
    os.environ.setdefault('GEMINI_API_KEY', 'demo_key_for_testing')
    if 'SERPER_API_KEY' not in os.environ:
        print("⚠️  SERPER_API_KEY not set - using mock vendor data")
    
    # Start NocoDB if possible
    nocodb_running = start_nocodb_if_needed()
    
    # Start unified server
    print("🚀 Starting Unified Wedding Server...")
    try:
        server_process = subprocess.Popen([
            sys.executable, 'unified_wedding_server.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)
        
        # Stream server output
        def stream_output():
            for line in iter(server_process.stdout.readline, ''):
                print(f"[SERVER] {line.rstrip()}")
        
        output_thread = threading.Thread(target=stream_output)
        output_thread.daemon = True
        output_thread.start()
        
        # Wait for server to be ready
        print("⏳ Waiting for server to start...")
        for i in range(30):
            try:
                response = requests.get('http://0.0.0.0:8001/health', timeout=3)
                if response.status_code == 200:
                    print("✅ Unified Wedding Server is ready!")
                    print("🌐 Server URL: http://0.0.0.0:8001")
                    print("📋 Health Check: http://0.0.0.0:8001/health")
                    print("📚 API Docs: http://0.0.0.0:8001/docs")
                    
                    # Test key endpoints
                    print("\n🧪 Testing key endpoints...")
                    test_endpoints = [
                        ('/health', 'Health Check'),
                        ('/api/vendor-data/venues?city=Mumbai', 'Vendor Discovery'),
                        ('/api/theme-images', 'Theme Images')
                    ]
                    
                    for endpoint, name in test_endpoints:
                        try:
                            test_response = requests.get(f'http://0.0.0.0:8001{endpoint}', timeout=5)
                            if test_response.status_code == 200:
                                print(f"✅ {name}: Working")
                            else:
                                print(f"⚠️ {name}: Status {test_response.status_code}")
                        except Exception as e:
                            print(f"❌ {name}: Failed ({e})")
                    
                    print("\n✅ Server startup complete!")
                    break
            except:
                pass
            time.sleep(1)
        else:
            print("❌ Server failed to start within timeout")
            return False
        
        # Keep server running
        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down server...")
            server_process.terminate()
    
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

if __name__ == "__main__":
    main()
