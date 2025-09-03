
#!/usr/bin/env python3
"""
Run Backend Services Tests for BID AI Wedding Assistant
"""

import subprocess
import sys
import time
import requests
from datetime import datetime

def check_backend_server():
    """Check if backend server is running"""
    try:
        response = requests.get("http://0.0.0.0:8001/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend_server():
    """Start the backend server"""
    print("🚀 Starting backend server...")
    try:
        process = subprocess.Popen(
            ["python", "unified_wedding_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for server to start
        time.sleep(5)
        
        # Check if server is running
        if check_backend_server():
            print("✅ Backend server started successfully")
            return process
        else:
            print("❌ Backend server failed to start")
            return None
    except Exception as e:
        print(f"❌ Error starting backend server: {e}")
        return None

def run_backend_tests():
    """Run the backend services test suite"""
    print("🧪 Running Backend Services Test Suite...")
    
    try:
        result = subprocess.run(
            ["python", "test_backend_services.py"],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        print("\n" + "="*50)
        print("BACKEND SERVICES TEST OUTPUT")
        print("="*50)
        print(result.stdout)
        
        if result.stderr:
            print("\nERRORS:")
            print(result.stderr)
        
        print(f"\nTest completed with exit code: {result.returncode}")
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("❌ Backend tests timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Error running backend tests: {e}")
        return False

def main():
    """Main execution function"""
    print("🏭 BID AI Wedding Assistant - Backend Services Test Runner")
    print("=" * 60)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Check if backend is already running
    if check_backend_server():
        print("✅ Backend server is already running")
        server_process = None
    else:
        print("🔄 Backend server not running, starting it...")
        server_process = start_backend_server()
        
        if not server_process:
            print("❌ Cannot run tests without backend server")
            sys.exit(1)
    
    try:
        # Run the backend tests
        test_success = run_backend_tests()
        
        if test_success:
            print("\n🎉 Backend services tests completed successfully!")
        else:
            print("\n❌ Backend services tests failed")
        
    finally:
        # Clean up - stop server if we started it
        if server_process:
            print("\n🛑 Stopping backend server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=10)
                print("✅ Backend server stopped")
            except subprocess.TimeoutExpired:
                server_process.kill()
                print("🔪 Backend server force killed")
    
    print(f"\nEnd Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
