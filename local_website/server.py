#!/usr/bin/env python3
"""
Simple HTTP Server for BID AI Wedding Assistant
Run this to host your wedding planning app locally
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

class WeddingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve the wedding app with proper MIME types"""
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """Add custom MIME type mappings"""
        # Ensure JavaScript files are served with correct MIME type
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.html'):
            return 'text/html'
        
        # Fall back to default behavior
        return super().guess_type(path)
    
    def log_message(self, format, *args):
        """Custom logging to show wedding app access"""
        message = format % args
        print(f"🌸 BID AI: {message}")

def main():
    """Start the wedding app server"""
    # Default configuration
    PORT = 8000
    HOST = 'localhost'
    
    # Check for custom port from command line
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print(f"❌ Invalid port number: {sys.argv[1]}")
            print("Usage: python server.py [port]")
            sys.exit(1)
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("❌ Error: index.html not found!")
        print("Make sure you're running this from the BID AI app directory.")
        sys.exit(1)
    
    # Create server
    try:
        with socketserver.TCPServer((HOST, PORT), WeddingHTTPRequestHandler) as httpd:
            app_url = f"http://{HOST}:{PORT}"
            
            print("🎉 BID AI Wedding Assistant Server Starting...")
            print("=" * 50)
            print(f"🌸 Wedding App URL: {app_url}")
            print(f"📱 Local Network:   http://localhost:{PORT}")
            print(f"🖥️  Server Directory: {os.getcwd()}")
            print("=" * 50)
            print("💡 Tips:")
            print("   - Press Ctrl+C to stop the server")
            print("   - Your data is saved locally in browser storage")
            print("   - Access from any device on your network using your IP")
            print("=" * 50)
            
            # Try to open browser automatically
            try:
                print(f"🚀 Opening wedding app in your default browser...")
                webbrowser.open(app_url)
            except Exception as e:
                print(f"⚠️  Could not open browser automatically: {e}")
                print(f"Please manually open: {app_url}")
            
            print(f"\n✅ BID AI Wedding Assistant is now running on {app_url}")
            print("Ready to plan your dream wedding! 💒✨")
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print(f"Try running: python server.py {PORT + 1}")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑 BID AI Wedding Assistant server stopped.")
        print("Thank you for using BID AI! 🙏")
        print("Your wedding data is safely stored in your browser.")

if __name__ == "__main__":
    main() 