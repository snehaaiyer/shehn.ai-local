
#!/usr/bin/env python3
"""
Health Monitor for Wedding Planning Services
"""

import requests
import time
import json
from datetime import datetime

class HealthMonitor:
    def __init__(self):
        self.services = {
            'React Frontend': 'http://0.0.0.0:3000',
            'Enhanced RAG Vendor API': 'http://0.0.0.0:5003/health',
            'Unified Wedding Server': 'http://0.0.0.0:8001/health',
            'Vendor Communication': 'http://0.0.0.0:5004/health'
        }
    
    def check_service(self, name: str, url: str) -> dict:
        """Check individual service health"""
        try:
            print(f"🔍 Checking {name} at {url}...")
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {name}: Healthy (Response time: {response.elapsed.total_seconds():.3f}s)")
                return {
                    'name': name,
                    'status': 'healthy',
                    'response_time': response.elapsed.total_seconds(),
                    'status_code': response.status_code,
                    'response_data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]
                }
            else:
                print(f"⚠️ {name}: Unhealthy (Status: {response.status_code})")
                return {
                    'name': name,
                    'status': 'unhealthy',
                    'response_time': response.elapsed.total_seconds(),
                    'status_code': response.status_code,
                    'error': f"HTTP {response.status_code}: {response.text[:100]}"
                }
        except requests.exceptions.ConnectionError as e:
            print(f"❌ {name}: Connection refused")
            return {
                'name': name,
                'status': 'down',
                'error': f"Connection refused: {str(e)}",
                'response_time': None,
                'status_code': None,
                'suggestion': f"Check if service is running on the expected port"
            }
        except requests.exceptions.Timeout as e:
            print(f"❌ {name}: Timeout")
            return {
                'name': name,
                'status': 'timeout',
                'error': f"Request timeout: {str(e)}",
                'response_time': None,
                'status_code': None,
                'suggestion': "Service may be overloaded or unresponsive"
            }
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            return {
                'name': name,
                'status': 'error',
                'error': str(e),
                'response_time': None,
                'status_code': None
            }
    
    def check_all_services(self) -> dict:
        """Check all services"""
        results = {}
        for name, url in self.services.items():
            results[name] = self.check_service(name, url)
        return results
    
    def print_status(self, results: dict):
        """Print formatted status"""
        print(f"\n{'='*60}")
        print(f"Health Check Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        for name, result in results.items():
            status_icon = "✅" if result['status'] == 'healthy' else "❌"
            print(f"{status_icon} {name}: {result['status'].upper()}")
            
            if result.get('response_time'):
                print(f"    Response time: {result['response_time']:.3f}s")
            if result.get('error'):
                print(f"    Error: {result['error']}")
        
        healthy_count = sum(1 for r in results.values() if r['status'] == 'healthy')
        total_count = len(results)
        print(f"\nOverall: {healthy_count}/{total_count} services healthy")

if __name__ == "__main__":
    monitor = HealthMonitor()
    results = monitor.check_all_services()
    monitor.print_status(results)
