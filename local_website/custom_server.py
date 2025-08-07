#!/usr/bin/env python3
"""
Custom HTTP Server for Vivaha AI Wedding Planner
Ensures proper serving of the index.html file
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

class WeddingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that always serves index.html for root requests"""
    
    def do_GET(self):
        # If requesting root or empty path, serve index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # Add CORS headers for API connectivity
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super(WeddingHTTPRequestHandler, self).end_headers()
        
        self.end_headers = end_headers.__get__(self, WeddingHTTPRequestHandler)
        
        return super().do_GET()
    
    def log_message(self, format, *args):
        """Custom logging"""
        message = format % args
        print(f"🌸 Vivaha AI: {message}")

def main():
    PORT = 8003
    HOST = 'localhost'
    
    # Ensure we're in the right directory
    if not os.path.exists('index.html'):
        print("❌ Error: index.html not found!")
        print(f"Current directory: {os.getcwd()}")
        return
    
    # Kill any existing servers on this port
    os.system(f"lsof -ti:8003 | xargs kill -9 2>/dev/null")
    
    try:
        with socketserver.TCPServer((HOST, PORT), WeddingHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🎉 Vivaha AI Wedding Planner Server Starting...")
            print("=" * 60)
            print(f"🌸 Wedding App URL: http://{HOST}:{PORT}")
            print(f"📁 Serving from: {os.getcwd()}")
            print(f"📄 Index file: {'✅ Found' if os.path.exists('index.html') else '❌ Missing'}")
            print("=" * 60)
            print("💡 Tips:")
            print("   - Press Ctrl+C to stop the server")
            print("   - Clear browser cache if you see old content")
            print("   - API backend should be running on port 5001")
            print("=" * 60)
            
            print(f"✅ Vivaha AI Wedding Planner is now running!")
            print(f"   Access at: http://{HOST}:{PORT}")
            print("Ready to plan your dream wedding! 💒✨")
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print(f"Try running: lsof -ti:8003 | xargs kill -9")
        else:
            print(f"❌ Server error: {e}")
    except KeyboardInterrupt:
        print("\n\n🛑 Vivaha AI Wedding Planner server stopped.")
        print("Thank you for using Vivaha AI! 🙏")

if __name__ == "__main__":
    main() 