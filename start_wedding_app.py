#!/usr/bin/env python3
"""
Simplified Wedding App Startup Script
"""

import subprocess
import sys
import time
import os

def start_app():
    """Start the wedding app with proper error handling"""
    print("🎉 Starting Shehnai.AI Wedding App...")

    # Set environment variables
    os.environ.setdefault('REACT_APP_SANDBOX_MODE', 'true')
    os.environ.setdefault('SERPER_API_KEY', 'demo_key')

    try:
        # Start the unified server
        print("🚀 Starting unified server on port 5000...")
        # This part of the code is intended to start the backend server
        # The changes provided were for a FastAPI application, which is not what is being run here.
        # Therefore, the original subprocess.run call is kept as is.
        subprocess.run([
            sys.executable,
            'simple_unified_server.py'
        ], check=True)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Try running: python simple_unified_server.py directly")

if __name__ == "__main__":
    start_app()