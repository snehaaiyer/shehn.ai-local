
#!/usr/bin/env python3
"""
Comprehensive System Test for Wedding Planning Platform
End-to-end validation with detailed RCA reporting
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import subprocess
import sys

class ComprehensiveSystemTester:
    def __init__(self):
        self.unified_server_url = 'http://0.0.0.0:8001'
        self.test_results = []
        self.critical_issues = []
        
    def test_unified_server_health(self) -> Dict:
        """Test unified server health and capabilities"""
        try:
            response = requests.get(f'{self.unified_server_url}/health', timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'status': 'PASS',
                    'details': f"Server healthy with {len(data.get('features', {}))} features",
                    'response_data': data
                }
            else:
                return {
                    'status': 'FAIL',
                    'details': f"HTTP {response.status_code}",
                    'error': response.text
                }
        except Exception as e:
            self.critical_issues.append("Unified server not responding")
            return {
                'status': 'CRITICAL',
                'details': 'Server unreachable',
                'error': str(e)
            }
    
    def test_frontend_serving(self) -> Dict:
        """Test if React frontend is served correctly"""
        try:
            response = requests.get(f'{self.unified_server_url}/', timeout=10)
            if response.status_code == 200 and ('wedding' in response.text.lower() or 'shehnai' in response.text.lower()):
                return {
                    'status': 'PASS',
                    'details': 'Frontend served correctly from unified server'
                }
            else:
                return {
                    'status': 'FAIL',
                    'details': f"Frontend not served properly - HTTP {response.status_code}"
                }
        except Exception as e:
            return {
                'status': 'FAIL',
                'details': 'Frontend not accessible',
                'error': str(e)
            }
    
    def test_api_endpoints(self) -> Dict:
        """Test critical API endpoints"""
        endpoints = [
            ('/api/health', 'API Health'),
            ('/api/theme-images', 'Theme Images'),
            ('/api/vendor-data/venues', 'Vendor Discovery')
        ]
        
        results = {}
        for endpoint, name in endpoints:
            try:
                response = requests.get(f'{self.unified_server_url}{endpoint}', timeout=10)
                if response.status_code == 200:
                    results[name] = 'PASS'
                else:
                    results[name] = f'FAIL (HTTP {response.status_code})'
            except Exception as e:
                results[name] = f'ERROR ({str(e)})'
        
        passed = sum(1 for v in results.values() if v == 'PASS')
        total = len(results)
        
        return {
            'status': 'PASS' if passed == total else 'PARTIAL' if passed > 0 else 'FAIL',
            'details': f'{passed}/{total} API endpoints working',
            'endpoint_results': results
        }
    
    def test_vendor_discovery_flow(self) -> Dict:
        """Test end-to-end vendor discovery"""
        try:
            # Test vendor search for venues in Mumbai
            response = requests.post(
                f'{self.unified_server_url}/api/vendor-data/venues',
                json={
                    'city': 'Mumbai',
                    'budget': '₹20-30 Lakhs',
                    'guestCount': 200
                },
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('vendors'):
                    vendor_count = len(data['vendors'])
                    return {
                        'status': 'PASS',
                        'details': f'Found {vendor_count} vendors',
                        'source': data.get('source', 'unknown')
                    }
                else:
                    return {
                        'status': 'FAIL',
                        'details': 'No vendors returned',
                        'response': data
                    }
            else:
                return {
                    'status': 'FAIL',
                    'details': f'HTTP {response.status_code}',
                    'error': response.text
                }
        except Exception as e:
            return {
                'status': 'FAIL',
                'details': 'Vendor discovery failed',
                'error': str(e)
            }
    
    def test_ai_services(self) -> Dict:
        """Test AI chat functionality"""
        try:
            response = requests.post(
                f'{self.unified_server_url}/api/ai/chat',
                json={
                    'message': 'Help me plan my wedding',
                    'context': {'location': 'Mumbai'}
                },
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('response'):
                    return {
                        'status': 'PASS',
                        'details': 'AI chat responding',
                        'source': data.get('source', 'unknown')
                    }
                else:
                    return {
                        'status': 'FAIL',
                        'details': 'AI not responding properly',
                        'response': data
                    }
            else:
                return {
                    'status': 'FAIL',
                    'details': f'HTTP {response.status_code}'
                }
        except Exception as e:
            return {
                'status': 'FAIL',
                'details': 'AI service failed',
                'error': str(e)
            }
    
    def check_external_dependencies(self) -> Dict:
        """Check external service dependencies"""
        dependencies = {
            'NocoDB': 'http://localhost:8080/api/v1/db/meta/projects/',
            'Ollama': 'http://localhost:11434/api/version'
        }
        
        results = {}
        for service, url in dependencies.items():
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    results[service] = 'AVAILABLE'
                else:
                    results[service] = f'UNAVAILABLE (HTTP {response.status_code})'
            except Exception:
                results[service] = 'UNAVAILABLE (Connection Failed)'
        
        available = sum(1 for v in results.values() if v == 'AVAILABLE')
        total = len(results)
        
        return {
            'status': 'PASS' if available == total else 'PARTIAL' if available > 0 else 'FAIL',
            'details': f'{available}/{total} external services available',
            'service_results': results
        }
    
    def run_comprehensive_test(self) -> Dict:
        """Run all tests and generate comprehensive report"""
        print("🔍 Starting Comprehensive System Test...")
        print("=" * 60)
        
        tests = [
            ('Unified Server Health', self.test_unified_server_health),
            ('Frontend Serving', self.test_frontend_serving),
            ('API Endpoints', self.test_api_endpoints),
            ('Vendor Discovery Flow', self.test_vendor_discovery_flow),
            ('AI Services', self.test_ai_services),
            ('External Dependencies', self.check_external_dependencies)
        ]
        
        results = {}
        overall_status = True
        
        for test_name, test_func in tests:
            print(f"🧪 Testing {test_name}...")
            result = test_func()
            results[test_name] = result
            
            status_icon = "✅" if result['status'] == 'PASS' else "⚠️" if result['status'] == 'PARTIAL' else "❌"
            print(f"{status_icon} {test_name}: {result['status']} - {result['details']}")
            
            if result['status'] in ['FAIL', 'CRITICAL']:
                overall_status = False
        
        # Generate recommendations
        recommendations = self.generate_recommendations(results)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'PASS' if overall_status else 'FAIL',
            'test_results': results,
            'critical_issues': self.critical_issues,
            'recommendations': recommendations,
            'summary': self.generate_summary(results)
        }
        
        self.print_summary(report)
        return report
    
    def generate_recommendations(self, results: Dict) -> List[str]:
        """Generate specific recommendations based on test results"""
        recommendations = []
        
        if results.get('Unified Server Health', {}).get('status') in ['FAIL', 'CRITICAL']:
            recommendations.append("CRITICAL: Start unified server - python unified_wedding_server.py")
        
        if results.get('API Endpoints', {}).get('status') != 'PASS':
            recommendations.append("Fix API endpoint routing in unified server")
        
        if results.get('Vendor Discovery Flow', {}).get('status') != 'PASS':
            recommendations.append("Debug vendor discovery service and database connections")
        
        if results.get('External Dependencies', {}).get('status') != 'PASS':
            dependencies = results.get('External Dependencies', {}).get('service_results', {})
            if dependencies.get('NocoDB') != 'AVAILABLE':
                recommendations.append("Start NocoDB service or fix database configuration")
            if dependencies.get('Ollama') != 'AVAILABLE':
                recommendations.append("Start Ollama service for AI functionality")
        
        if not recommendations:
            recommendations.append("System is healthy! Consider load testing and performance optimization")
        
        return recommendations
    
    def generate_summary(self, results: Dict) -> Dict:
        """Generate test summary statistics"""
        total_tests = len(results)
        passed_tests = sum(1 for r in results.values() if r['status'] == 'PASS')
        partial_tests = sum(1 for r in results.values() if r['status'] == 'PARTIAL')
        failed_tests = sum(1 for r in results.values() if r['status'] in ['FAIL', 'CRITICAL'])
        
        return {
            'total_tests': total_tests,
            'passed': passed_tests,
            'partial': partial_tests,
            'failed': failed_tests,
            'pass_rate': f"{(passed_tests/total_tests)*100:.1f}%"
        }
    
    def print_summary(self, report: Dict):
        """Print formatted test summary"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        summary = report['summary']
        print(f"Overall Status: {'✅ PASS' if report['overall_status'] == 'PASS' else '❌ FAIL'}")
        print(f"Tests Passed: {summary['passed']}/{summary['total_tests']} ({summary['pass_rate']})")
        
        if report['critical_issues']:
            print("\n🚨 CRITICAL ISSUES:")
            for issue in report['critical_issues']:
                print(f"   • {issue}")
        
        print("\n💡 RECOMMENDATIONS:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"   {i}. {rec}")
        
        print("=" * 60)

if __name__ == "__main__":
    tester = ComprehensiveSystemTester()
    report = tester.run_comprehensive_test()
    
    # Save detailed report
    with open(f'comprehensive_system_test_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
        json.dump(report, f, indent=2)
