#!/usr/bin/env python3
"""
Production Readiness Test Suite - Wedding AI Platform
Comprehensive automated testing for production deployment
"""

import asyncio
import json
import time
import requests
import subprocess
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
from pathlib import Path
import concurrent.futures
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProductionReadinessTestSuite:
    """Comprehensive production readiness test suite"""
    
    def __init__(self):
        self.frontend_url = "http://localhost:3000"
        self.backend_url = "http://localhost:8001"
        self.test_results = []
        self.critical_issues = []
        self.start_time = None
        self.end_time = None
        
    def log_test_result(self, test_id: str, test_name: str, status: str, 
                       details: str = "", duration: float = 0, error: str = "", 
                       category: str = ""):
        """Log test result with comprehensive details"""
        result = {
            "test_id": test_id,
            "test_name": test_name,
            "category": category,
            "status": status,  # PASS, FAIL, CRITICAL, WARNING
            "details": details,
            "duration": f"{duration:.2f}s",
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        # Log critical issues separately
        if status in ["CRITICAL", "FAIL"]:
            self.critical_issues.append(result)
            
        logger.info(f"[{status}] {test_id}: {test_name}")
        if error:
            logger.error(f"Error: {error}")

    # ========================================
    # FRONTEND TESTS
    # ========================================
    
    def test_frontend_accessibility(self) -> Dict:
        """Test if frontend is accessible and loads properly"""
        start_time = time.time()
        try:
            response = requests.get(self.frontend_url, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                # Check if it's actually React app (not just a 200 response)
                content = response.text
                if "react" in content.lower() or "div id=\"root\"" in content:
                    self.log_test_result(
                        "FE_001", "Frontend Accessibility", "PASS",
                        f"Frontend accessible at {self.frontend_url}", duration, "", "Frontend"
                    )
                    return {"status": "PASS", "response_time": duration}
                else:
                    self.log_test_result(
                        "FE_001", "Frontend Accessibility", "WARNING",
                        "Frontend accessible but might not be React app", duration, "", "Frontend"
                    )
                    return {"status": "WARNING", "response_time": duration}
            else:
                self.log_test_result(
                    "FE_001", "Frontend Accessibility", "FAIL",
                    f"HTTP {response.status_code}", duration, response.text, "Frontend"
                )
                return {"status": "FAIL", "response_time": duration}
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "FE_001", "Frontend Accessibility", "CRITICAL",
                "Frontend server not responding", duration, str(e), "Frontend"
            )
            return {"status": "CRITICAL", "error": str(e)}

    def test_frontend_performance(self) -> Dict:
        """Test frontend response times and performance"""
        start_time = time.time()
        try:
            # Test multiple requests to check consistency
            response_times = []
            for i in range(5):
                req_start = time.time()
                response = requests.get(self.frontend_url, timeout=10)
                req_duration = time.time() - req_start
                response_times.append(req_duration)
                
                if response.status_code != 200:
                    self.log_test_result(
                        "FE_002", "Frontend Performance", "FAIL",
                        f"Request {i+1} failed with HTTP {response.status_code}", 
                        time.time() - start_time, response.text, "Frontend"
                    )
                    return {"status": "FAIL"}
            
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            
            # Performance thresholds
            if avg_response_time < 1.0:  # Under 1 second average
                status = "PASS"
            elif avg_response_time < 3.0:  # Under 3 seconds average
                status = "WARNING"
            else:
                status = "FAIL"
                
            self.log_test_result(
                "FE_002", "Frontend Performance", status,
                f"Avg: {avg_response_time:.2f}s, Max: {max_response_time:.2f}s",
                time.time() - start_time, "", "Frontend"
            )
            
            return {
                "status": status,
                "avg_response_time": avg_response_time,
                "max_response_time": max_response_time,
                "all_response_times": response_times
            }
            
        except Exception as e:
            self.log_test_result(
                "FE_002", "Frontend Performance", "CRITICAL",
                "Performance test failed", time.time() - start_time, str(e), "Frontend"
            )
            return {"status": "CRITICAL", "error": str(e)}

    def test_frontend_routes(self) -> Dict:
        """Test if all main frontend routes are accessible"""
        routes = [
            "/",
            "/preferences", 
            "/budget",
            "/vendors",
            "/vendor-communication",
            "/wedding-invites",
            "/ai-chat"
        ]
        
        start_time = time.time()
        failed_routes = []
        
        for route in routes:
            try:
                response = requests.get(f"{self.frontend_url}{route}", timeout=10)
                if response.status_code not in [200, 302]:  # Accept redirects
                    failed_routes.append(f"{route} (HTTP {response.status_code})")
            except Exception as e:
                failed_routes.append(f"{route} (Error: {str(e)})")
        
        duration = time.time() - start_time
        
        if not failed_routes:
            self.log_test_result(
                "FE_003", "Frontend Routes", "PASS",
                f"All {len(routes)} routes accessible", duration, "", "Frontend"
            )
            return {"status": "PASS", "routes_tested": len(routes)}
        else:
            self.log_test_result(
                "FE_003", "Frontend Routes", "FAIL",
                f"{len(failed_routes)} routes failed", duration, 
                "; ".join(failed_routes), "Frontend"
            )
            return {"status": "FAIL", "failed_routes": failed_routes}

    # ========================================
    # BACKEND TESTS
    # ========================================
    
    def test_backend_health(self) -> Dict:
        """Test backend health and service status"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                services_count = len(data.get('features', []))
                
                self.log_test_result(
                    "BE_001", "Backend Health Check", "PASS",
                    f"Backend healthy with {services_count} features", duration, "", "Backend"
                )
                return {"status": "PASS", "services_count": services_count, "data": data}
            else:
                self.log_test_result(
                    "BE_001", "Backend Health Check", "FAIL",
                    f"HTTP {response.status_code}", duration, response.text, "Backend"
                )
                return {"status": "FAIL", "status_code": response.status_code}
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "BE_001", "Backend Health Check", "CRITICAL",
                "Backend server not responding", duration, str(e), "Backend"
            )
            return {"status": "CRITICAL", "error": str(e)}

    def test_backend_api_endpoints(self) -> Dict:
        """Test all critical backend API endpoints"""
        endpoints = [
            {"method": "GET", "path": "/", "expected": 200},
            {"method": "GET", "path": "/health", "expected": 200},
            {"method": "POST", "path": "/submit-wedding", "expected": [200, 422], "data": self._get_sample_wedding_data()},
            {"method": "POST", "path": "/ai-consultation", "expected": [200, 422], "data": self._get_sample_wedding_data()},
            {"method": "POST", "path": "/budget-analysis", "expected": [200, 422], "data": self._get_sample_budget_data()},
            {"method": "POST", "path": "/vendor-search", "expected": [200, 422], "data": {"city": "Mumbai", "category": "venue"}},
        ]
        
        start_time = time.time()
        failed_endpoints = []
        passed_endpoints = 0
        
        for endpoint in endpoints:
            try:
                method = endpoint["method"]
                path = endpoint["path"]
                expected_codes = endpoint["expected"] if isinstance(endpoint["expected"], list) else [endpoint["expected"]]
                
                if method == "GET":
                    response = requests.get(f"{self.backend_url}{path}", timeout=30)
                elif method == "POST":
                    response = requests.post(
                        f"{self.backend_url}{path}", 
                        json=endpoint.get("data", {}),
                        timeout=30
                    )
                
                if response.status_code in expected_codes:
                    passed_endpoints += 1
                else:
                    failed_endpoints.append(f"{method} {path} (HTTP {response.status_code})")
                    
            except Exception as e:
                failed_endpoints.append(f"{method} {path} (Error: {str(e)})")
        
        duration = time.time() - start_time
        
        if not failed_endpoints:
            self.log_test_result(
                "BE_002", "Backend API Endpoints", "PASS",
                f"All {len(endpoints)} endpoints working", duration, "", "Backend"
            )
            return {"status": "PASS", "endpoints_tested": len(endpoints)}
        else:
            status = "CRITICAL" if len(failed_endpoints) > len(endpoints) / 2 else "FAIL"
            self.log_test_result(
                "BE_002", "Backend API Endpoints", status,
                f"{len(failed_endpoints)} endpoints failed", duration,
                "; ".join(failed_endpoints), "Backend"
            )
            return {"status": status, "failed_endpoints": failed_endpoints}

    def test_ai_services(self) -> Dict:
        """Test AI services functionality"""
        start_time = time.time()
        
        try:
            # Test AI consultation
            consultation_data = self._get_sample_wedding_data()
            
            response = requests.post(
                f"{self.backend_url}/ai-consultation",
                json=consultation_data,
                timeout=60  # AI services can take longer
            )
            
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "recommendations" in data or "advice" in data:
                    self.log_test_result(
                        "BE_003", "AI Services", "PASS",
                        "AI consultation working correctly", duration, "", "Backend"
                    )
                    return {"status": "PASS", "response": data}
                else:
                    self.log_test_result(
                        "BE_003", "AI Services", "WARNING",
                        "AI response format unexpected", duration, "", "Backend"
                    )
                    return {"status": "WARNING", "response": data}
            else:
                self.log_test_result(
                    "BE_003", "AI Services", "FAIL",
                    f"AI consultation failed: HTTP {response.status_code}", duration,
                    response.text, "Backend"
                )
                return {"status": "FAIL", "status_code": response.status_code}
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "BE_003", "AI Services", "CRITICAL",
                "AI services not responding", duration, str(e), "Backend"
            )
            return {"status": "CRITICAL", "error": str(e)}

    # ========================================
    # LOAD TESTING
    # ========================================
    
    def test_concurrent_load(self, concurrent_users: int = 10) -> Dict:
        """Test system under concurrent load"""
        start_time = time.time()
        
        def make_request(user_id):
            try:
                # Simulate user journey
                requests.get(self.frontend_url, timeout=10)
                requests.get(f"{self.backend_url}/health", timeout=10)
                return {"user_id": user_id, "status": "success"}
            except Exception as e:
                return {"user_id": user_id, "status": "failed", "error": str(e)}
        
        try:
            # Use ThreadPoolExecutor for concurrent requests
            with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
                futures = [executor.submit(make_request, i) for i in range(concurrent_users)]
                results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            duration = time.time() - start_time
            
            successful_requests = len([r for r in results if r["status"] == "success"])
            failed_requests = len([r for r in results if r["status"] == "failed"])
            
            success_rate = (successful_requests / concurrent_users) * 100
            
            if success_rate >= 95:
                status = "PASS"
            elif success_rate >= 80:
                status = "WARNING"
            else:
                status = "FAIL"
                
            self.log_test_result(
                "LOAD_001", "Concurrent Load Test", status,
                f"{success_rate:.1f}% success rate with {concurrent_users} users",
                duration, "", "Load Testing"
            )
            
            return {
                "status": status,
                "concurrent_users": concurrent_users,
                "success_rate": success_rate,
                "successful_requests": successful_requests,
                "failed_requests": failed_requests,
                "duration": duration
            }
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "LOAD_001", "Concurrent Load Test", "CRITICAL",
                "Load test failed to execute", duration, str(e), "Load Testing"
            )
            return {"status": "CRITICAL", "error": str(e)}

    # ========================================
    # SECURITY TESTS
    # ========================================
    
    def test_security_basics(self) -> Dict:
        """Test basic security measures"""
        start_time = time.time()
        security_issues = []
        
        try:
            # Test for common security headers
            response = requests.get(self.frontend_url, timeout=10)
            headers = response.headers
            
            # Check for security headers
            security_headers = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': None  # HTTPS only
            }
            
            for header, expected in security_headers.items():
                if header not in headers:
                    security_issues.append(f"Missing security header: {header}")
                elif expected and headers[header] not in (expected if isinstance(expected, list) else [expected]):
                    security_issues.append(f"Incorrect {header}: {headers[header]}")
            
            # Test for information disclosure
            if "server" in headers and any(server in headers["server"].lower() for server in ["apache", "nginx", "iis"]):
                security_issues.append(f"Server information disclosed: {headers['server']}")
            
            # Test API endpoints for authentication
            api_endpoints = ["/submit-wedding", "/ai-consultation"]
            for endpoint in api_endpoints:
                try:
                    response = requests.post(f"{self.backend_url}{endpoint}", json={}, timeout=10)
                    # If we get 200 instead of 401/403, there might be missing auth
                    if response.status_code == 200:
                        security_issues.append(f"Endpoint {endpoint} lacks authentication")
                except:
                    pass
            
            duration = time.time() - start_time
            
            if not security_issues:
                self.log_test_result(
                    "SEC_001", "Security Basics", "PASS",
                    "Basic security checks passed", duration, "", "Security"
                )
                return {"status": "PASS"}
            else:
                status = "CRITICAL" if len(security_issues) > 3 else "WARNING"
                self.log_test_result(
                    "SEC_001", "Security Basics", status,
                    f"{len(security_issues)} security issues found", duration,
                    "; ".join(security_issues), "Security"
                )
                return {"status": status, "issues": security_issues}
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "SEC_001", "Security Basics", "CRITICAL",
                "Security test failed", duration, str(e), "Security"
            )
            return {"status": "CRITICAL", "error": str(e)}

    # ========================================
    # SYSTEM RESOURCE TESTS
    # ========================================
    
    def test_system_resources(self) -> Dict:
        """Test system resource usage"""
        start_time = time.time()
        
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            issues = []
            
            # Check resource usage thresholds
            if cpu_percent > 80:
                issues.append(f"High CPU usage: {cpu_percent}%")
            if memory.percent > 85:
                issues.append(f"High memory usage: {memory.percent}%")
            if disk.percent > 90:
                issues.append(f"High disk usage: {disk.percent}%")
            
            # Check available memory (should have at least 2GB free)
            available_gb = memory.available / (1024**3)
            if available_gb < 2:
                issues.append(f"Low available memory: {available_gb:.1f}GB")
            
            duration = time.time() - start_time
            
            if not issues:
                status = "PASS"
            elif len(issues) == 1:
                status = "WARNING"
            else:
                status = "CRITICAL"
                
            self.log_test_result(
                "SYS_001", "System Resources", status,
                f"CPU: {cpu_percent}%, RAM: {memory.percent}%, Disk: {disk.percent}%",
                duration, "; ".join(issues) if issues else "", "System"
            )
            
            return {
                "status": status,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "available_memory_gb": available_gb,
                "issues": issues
            }
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result(
                "SYS_001", "System Resources", "CRITICAL",
                "System resource check failed", duration, str(e), "System"
            )
            return {"status": "CRITICAL", "error": str(e)}

    # ========================================
    # UTILITY METHODS
    # ========================================
    
    def _get_sample_wedding_data(self):
        """Get sample wedding data for testing"""
        return {
            "yourName": "Test User",
            "partnerName": "Test Partner",
            "city": "Mumbai",
            "weddingDate": "2024-12-25",
            "budget": "10-15 lakhs",
            "guestCount": 150,
            "weddingType": "Indian Traditional",
            "duration": "3 days",
            "events": ["mehendi", "sangeet", "wedding", "reception"],
            "priorities": ["venue", "catering", "photography"],
            "specialRequirements": "None"
        }
    
    def _get_sample_budget_data(self):
        """Get sample budget data for testing"""
        return {
            "budget_range": "₹10-20 Lakhs",
            "priorities": ["venue", "catering", "photography"],
            "guest_count": 150,
            "wedding_style": "Traditional"
        }

    # ========================================
    # MAIN TEST EXECUTION
    # ========================================
    
    def run_all_tests(self) -> Dict:
        """Run all production readiness tests"""
        self.start_time = datetime.now()
        logger.info("🧪 Starting Production Readiness Test Suite")
        logger.info("=" * 60)
        
        # Frontend Tests
        logger.info("🎨 Testing Frontend Components...")
        self.test_frontend_accessibility()
        self.test_frontend_performance()
        self.test_frontend_routes()
        
        # Backend Tests
        logger.info("🔧 Testing Backend Services...")
        self.test_backend_health()
        self.test_backend_api_endpoints()
        self.test_ai_services()
        
        # Load Testing
        logger.info("⚡ Testing System Load...")
        self.test_concurrent_load(10)  # Test with 10 concurrent users
        
        # Security Testing
        logger.info("🔒 Testing Security...")
        self.test_security_basics()
        
        # System Resources
        logger.info("💻 Testing System Resources...")
        self.test_system_resources()
        
        self.end_time = datetime.now()
        
        # Generate summary report
        return self._generate_summary_report()
    
    def _generate_summary_report(self) -> Dict:
        """Generate comprehensive test summary report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        critical_tests = len([r for r in self.test_results if r["status"] == "CRITICAL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARNING"])
        
        # Determine overall status
        if critical_tests > 0:
            overall_status = "CRITICAL - NOT PRODUCTION READY"
        elif failed_tests > total_tests * 0.2:  # More than 20% failures
            overall_status = "FAIL - MAJOR ISSUES"
        elif failed_tests > 0 or warning_tests > total_tests * 0.3:
            overall_status = "WARNING - MINOR ISSUES"
        else:
            overall_status = "PASS - PRODUCTION READY"
        
        duration = (self.end_time - self.start_time).total_seconds()
        
        summary = {
            "overall_status": overall_status,
            "test_execution": {
                "start_time": self.start_time.isoformat(),
                "end_time": self.end_time.isoformat(),
                "duration_seconds": duration,
                "total_tests": total_tests
            },
            "test_results_summary": {
                "passed": passed_tests,
                "failed": failed_tests,
                "critical": critical_tests,
                "warnings": warning_tests,
                "success_rate": f"{(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "0%"
            },
            "critical_issues": self.critical_issues,
            "detailed_results": self.test_results,
            "production_readiness": {
                "database_ready": critical_tests == 0,
                "security_ready": len([r for r in self.test_results if r["category"] == "Security" and r["status"] == "CRITICAL"]) == 0,
                "performance_ready": len([r for r in self.test_results if "Performance" in r["test_name"] and r["status"] in ["FAIL", "CRITICAL"]]) == 0,
                "load_ready": len([r for r in self.test_results if "Load" in r["test_name"] and r["status"] in ["FAIL", "CRITICAL"]]) == 0
            }
        }
        
        return summary
    
    def save_report(self, summary: Dict, filename: str = None):
        """Save test report to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"production_readiness_report_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"📊 Test report saved to: {filename}")
        return filename

def main():
    """Main execution function"""
    logger.info("🌸 Wedding AI Platform - Production Readiness Test Suite")
    logger.info("=" * 60)
    
    # Initialize test suite
    test_suite = ProductionReadinessTestSuite()
    
    # Run all tests
    summary = test_suite.run_all_tests()
    
    # Save report
    report_file = test_suite.save_report(summary)
    
    # Print summary
    logger.info("=" * 60)
    logger.info("📊 PRODUCTION READINESS SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Overall Status: {summary['overall_status']}")
    logger.info(f"Tests Executed: {summary['test_execution']['total_tests']}")
    logger.info(f"Success Rate: {summary['test_results_summary']['success_rate']}")
    logger.info(f"Critical Issues: {summary['test_results_summary']['critical']}")
    logger.info(f"Failed Tests: {summary['test_results_summary']['failed']}")
    logger.info(f"Warning Tests: {summary['test_results_summary']['warnings']}")
    
    if summary['critical_issues']:
        logger.info("🚨 CRITICAL ISSUES FOUND:")
        for issue in summary['critical_issues']:
            logger.error(f"  - {issue['test_name']}: {issue['details']}")
    
    logger.info(f"📊 Detailed report: {report_file}")
    logger.info("=" * 60)
    
    # Exit with appropriate code
    if "CRITICAL" in summary['overall_status']:
        sys.exit(1)
    elif "FAIL" in summary['overall_status']:
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
