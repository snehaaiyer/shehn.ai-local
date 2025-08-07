"""
Ngrok Management Script
Handles ngrok tunnel setup and management
"""

import subprocess
import json
import time
import requests
from typing import Dict, Optional
import os

class NgrokManager:
    def __init__(self):
        self.ngrok_process = None
        self.tunnel_url = None
    
    def start_tunnel(self, port: int = 8080) -> Dict:
        """Start ngrok tunnel on specified port"""
        try:
            # Check if ngrok is installed
            self._check_ngrok_installation()
            
            # Start ngrok process
            cmd = f"ngrok http {port}"
            self.ngrok_process = subprocess.Popen(
                cmd.split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for tunnel to be ready
            time.sleep(2)
            
            # Get tunnel URL
            tunnel_info = self._get_tunnel_info()
            if tunnel_info:
                self.tunnel_url = tunnel_info.get('public_url')
                return {
                    "status": "success",
                    "message": "Ngrok tunnel started successfully",
                    "url": self.tunnel_url
                }
            else:
                raise Exception("Failed to get tunnel URL")
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to start ngrok tunnel: {str(e)}",
                "url": None
            }
    
    def stop_tunnel(self) -> Dict:
        """Stop ngrok tunnel"""
        try:
            if self.ngrok_process:
                self.ngrok_process.terminate()
                self.ngrok_process = None
                self.tunnel_url = None
                return {
                    "status": "success",
                    "message": "Ngrok tunnel stopped successfully"
                }
            return {
                "status": "warning",
                "message": "No active tunnel to stop"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to stop ngrok tunnel: {str(e)}"
            }
    
    def _check_ngrok_installation(self):
        """Check if ngrok is installed"""
        try:
            subprocess.run(
                ["ngrok", "version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        except FileNotFoundError:
            raise Exception(
                "Ngrok not found. Please install ngrok: "
                "https://ngrok.com/download"
            )
    
    def _get_tunnel_info(self) -> Optional[Dict]:
        """Get tunnel information from ngrok API"""
        try:
            response = requests.get("http://localhost:4040/api/tunnels")
            data = response.json()
            return data['tunnels'][0] if data['tunnels'] else None
        except Exception:
            return None
    
    def get_status(self) -> Dict:
        """Get current tunnel status"""
        if self.ngrok_process and self.tunnel_url:
            return {
                "status": "active",
                "url": self.tunnel_url
            }
        return {
            "status": "inactive",
            "url": None
        }

def main():
    """Main function for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage ngrok tunnels")
    parser.add_argument(
        "action",
        choices=["start", "stop", "status"],
        help="Action to perform"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Port to tunnel (default: 8080)"
    )
    
    args = parser.parse_args()
    manager = NgrokManager()
    
    if args.action == "start":
        result = manager.start_tunnel(args.port)
        print(json.dumps(result, indent=2))
    elif args.action == "stop":
        result = manager.stop_tunnel()
        print(json.dumps(result, indent=2))
    else:  # status
        result = manager.get_status()
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 