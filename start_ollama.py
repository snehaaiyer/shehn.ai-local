
#!/usr/bin/env python3
"""
Start Ollama service for BID AI Wedding Assistant
"""

import subprocess
import time
import requests
import os
import signal
import sys

def start_ollama_server():
    """Start Ollama server in background"""
    try:
        print("🤖 Starting Ollama server...")
        
        # Set environment variables for Replit
        env = os.environ.copy()
        env['OLLAMA_HOST'] = '0.0.0.0:11434'
        env['OLLAMA_ORIGINS'] = '*'
        
        # Start Ollama server
        process = subprocess.Popen(
            ['ollama', 'serve'],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit for server to start
        time.sleep(5)
        
        # Check if server is running
        try:
            response = requests.get('http://0.0.0.0:11434/api/tags', timeout=5)
            if response.status_code == 200:
                print("✅ Ollama server started successfully")
                return process
            else:
                print(f"❌ Ollama server not responding: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Ollama server check failed: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to start Ollama server: {e}")
        return None

def pull_required_models():
    """Pull required models for wedding AI"""
    models = [
        "nous-hermes:latest",
        "llama3.2:1b"
    ]
    
    for model in models:
        try:
            print(f"📥 Pulling model: {model}")
            result = subprocess.run(
                ['ollama', 'pull', model],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                print(f"✅ Model {model} pulled successfully")
            else:
                print(f"❌ Failed to pull {model}: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout pulling {model} - continuing...")
        except Exception as e:
            print(f"❌ Error pulling {model}: {e}")

def main():
    """Main startup sequence"""
    print("🌸 BID AI - Ollama Startup")
    print("=" * 40)
    
    # Pull models first
    print("📥 Ensuring required models are available...")
    pull_required_models()
    
    # Start server
    print("\n🚀 Starting Ollama service...")
    process = start_ollama_server()
    
    if process:
        print("\n✅ Ollama is ready for BID AI Wedding Assistant!")
        print("   Available at: http://0.0.0.0:11434")
        print("   Models: nous-hermes:latest, llama3.2:1b")
        print("\n🛑 Press Ctrl+C to stop")
        
        try:
            # Keep running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping Ollama server...")
            process.terminate()
            print("✅ Ollama stopped")
    else:
        print("\n❌ Failed to start Ollama")
        print("   Try running manually: ollama serve")

if __name__ == "__main__":
    main()
