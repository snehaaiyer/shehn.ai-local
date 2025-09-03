
#!/usr/bin/env python3
"""
Start All Backend Services
Ensures all required backend services are running
"""

import subprocess
import time
import sys
import os
import signal
import requests
from typing import List, Dict

class BackendServiceManager:
    def __init__(self):
        self.services = {
            'unified_wedding_server': {
                'script': 'unified_wedding_server.py',
                'port': 8001,
                'process': None
            },
            'enhanced_rag_vendor_api': {
                'script': 'enhanced_rag_vendor_api_server.py',
                'port': 5003,
                'process': None
            },
            'vendor_communication': {
                'script': 'vendor_communication_server.py',
                'port': 5004,
                'process': None
            }
        }
        self.running_processes = []
    
    def check_port_available(self, port: int) -> bool:
        """Check if port is available"""
        try:
            response = requests.get(f"http://0.0.0.0:{port}/health", timeout=3)
            return response.status_code == 200
        except:
            return False
    
    def start_service(self, service_name: str, service_config: Dict) -> bool:
        """Start a single service"""
        script_path = service_config['script']
        port = service_config['port']
        
        print(f"🚀 Starting {service_name} on port {port}...")
        
        # Check if already running
        if self.check_port_available(port):
            print(f"✅ {service_name} already running on port {port}")
            return True
        
        try:
            # Start the service
            process = subprocess.Popen([
                sys.executable, script_path
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            service_config['process'] = process
            self.running_processes.append(process)
            
            # Wait a moment for startup
            time.sleep(3)
            
            # Check if service started successfully
            if self.check_port_available(port):
                print(f"✅ {service_name} started successfully on port {port}")
                return True
            else:
                print(f"❌ {service_name} failed to start on port {port}")
                return False
                
        except Exception as e:
            print(f"❌ Error starting {service_name}: {e}")
            return False
    
    def start_all_services(self):
        """Start all backend services"""
        print("🔄 Starting all backend services...")
        print("=" * 50)
        
        success_count = 0
        total_services = len(self.services)
        
        for service_name, service_config in self.services.items():
            if self.start_service(service_name, service_config):
                success_count += 1
            time.sleep(2)  # Stagger startup
        
        print("=" * 50)
        print(f"📊 Service Startup Summary: {success_count}/{total_services} services started")
        
        if success_count == total_services:
            print("🎉 All backend services started successfully!")
            self.run_health_check()
        else:
            print("⚠️ Some services failed to start. Check logs above.")
        
        return success_count == total_services
    
    def run_health_check(self):
        """Run health check on all services"""
        print("\n🔍 Running health check...")
        
        for service_name, service_config in self.services.items():
            port = service_config['port']
            try:
                response = requests.get(f"http://0.0.0.0:{port}/health", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {service_name}: {data.get('status', 'healthy')}")
                else:
                    print(f"❌ {service_name}: HTTP {response.status_code}")
            except Exception as e:
                print(f"❌ {service_name}: {str(e)}")
    
    def cleanup(self):
        """Cleanup running processes"""
        print("\n🧹 Cleaning up processes...")
        for process in self.running_processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n🛑 Stopping all services...")
    manager.cleanup()
    sys.exit(0)

if __name__ == "__main__":
    manager = BackendServiceManager()
    
    # Setup signal handler for cleanup
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        success = manager.start_all_services()
        
        if success:
            print("\n🎯 All services running. Press Ctrl+C to stop all services.")
            print("📊 Access health monitor: python health_monitor.py")
            print("🔗 Service URLs:")
            for service_name, config in manager.services.items():
                print(f"   - {service_name}: http://0.0.0.0:{config['port']}")
            
            # Keep running
            while True:
                time.sleep(10)
                # Optional: periodic health check
        else:
            print("❌ Failed to start all services")
            manager.cleanup()
            sys.exit(1)
            
    except KeyboardInterrupt:
        signal_handler(None, None)
    except Exception as e:
        print(f"❌ Error: {e}")
        manager.cleanup()
        sys.exit(1)
