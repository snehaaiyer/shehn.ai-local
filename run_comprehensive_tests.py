
#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Comprehensive Test Runner
Executes all test suites and generates combined reports
"""

import asyncio
import subprocess
import sys
import time
import json
from datetime import datetime
from pathlib import Path

def run_command(command, description):
    """Run a shell command and return the result"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=300  # 5 minute timeout
        )
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            return True, result.stdout
        else:
            print(f"❌ {description} failed: {result.stderr}")
            return False, result.stderr
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} timed out")
        return False, "Command timed out"
    except Exception as e:
        print(f"💥 {description} error: {str(e)}")
        return False, str(e)

async def main():
    """Run comprehensive test suite"""
    print("🎭 BID AI Wedding Assistant - Comprehensive Test Suite")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    start_time = time.time()
    test_results = {}
    
    # 1. Run React Frontend Tests
    print("\n📱 FRONTEND TESTS")
    print("-" * 30)
    
    frontend_success, frontend_output = run_command(
        "cd react-frontend && npm test -- --watchAll=false --coverage",
        "React Frontend Test Suite"
    )
    test_results["frontend_tests"] = {
        "success": frontend_success,
        "output": frontend_output[:500] if frontend_output else ""
    }
    
    # 2. Run User Journey Tests
    print("\n🛤️ USER JOURNEY TESTS")
    print("-" * 30)
    
    journey_success, journey_output = run_command(
        "python tests/comprehensive_user_journey_tests.py --journey=all",
        "User Journey Test Suite"
    )
    test_results["journey_tests"] = {
        "success": journey_success,
        "output": journey_output[:500] if journey_output else ""
    }
    
    # 3. Run Screen-Specific Tests
    print("\n🖥️ SCREEN-SPECIFIC TESTS")
    print("-" * 30)
    
    screen_success, screen_output = run_command(
        "python tests/screen_specific_test_cases.py",
        "Screen-Specific Test Suite"
    )
    test_results["screen_tests"] = {
        "success": screen_success,
        "output": screen_output[:500] if screen_output else ""
    }
    
    # 4. Run API Tests
    print("\n🔌 API TESTS")
    print("-" * 30)
    
    api_success, api_output = run_command(
        "python tests/test_runner.py --category=api",
        "API Test Suite"
    )
    test_results["api_tests"] = {
        "success": api_success,
        "output": api_output[:500] if api_output else ""
    }
    
    # 5. Run AI Service Tests
    print("\n🤖 AI SERVICE TESTS")
    print("-" * 30)
    
    ai_success, ai_output = run_command(
        "python tests/test_runner.py --category=ai",
        "AI Service Test Suite"
    )
    test_results["ai_tests"] = {
        "success": ai_success,
        "output": ai_output[:500] if ai_output else ""
    }
    
    # 6. Run Performance Tests
    print("\n⚡ PERFORMANCE TESTS")
    print("-" * 30)
    
    perf_success, perf_output = run_command(
        "python tests/test_runner.py --category=performance",
        "Performance Test Suite"
    )
    test_results["performance_tests"] = {
        "success": perf_success,
        "output": perf_output[:500] if perf_output else ""
    }
    
    # Calculate overall results
    total_execution_time = time.time() - start_time
    
    successful_suites = sum(1 for result in test_results.values() if result["success"])
    total_suites = len(test_results)
    overall_success_rate = (successful_suites / total_suites * 100) if total_suites > 0 else 0
    
    # Generate comprehensive report
    comprehensive_report = {
        "test_execution_summary": {
            "timestamp": datetime.now().isoformat(),
            "total_execution_time": f"{total_execution_time:.2f}s",
            "test_suites_run": total_suites,
            "successful_suites": successful_suites,
            "overall_success_rate": f"{overall_success_rate:.1f}%"
        },
        "detailed_results": test_results,
        "recommendations": generate_recommendations(test_results)
    }
    
    # Save comprehensive report
    report_filename = f"comprehensive_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, 'w') as f:
        json.dump(comprehensive_report, f, indent=2)
    
    # Print final summary
    print("\n" + "=" * 60)
    print("🎯 COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    print(f"📊 Overall Success Rate: {overall_success_rate:.1f}%")
    print(f"✅ Successful Suites: {successful_suites}/{total_suites}")
    print(f"⏱️  Total Execution Time: {total_execution_time:.2f}s")
    print(f"📁 Report Saved: {report_filename}")
    print("=" * 60)
    
    # Print individual suite results
    print("\n📋 INDIVIDUAL SUITE RESULTS:")
    for suite_name, result in test_results.items():
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        suite_display_name = suite_name.replace("_", " ").title()
        print(f"  {status} {suite_display_name}")
    
    # Print recommendations if any failures
    if successful_suites < total_suites:
        print("\n🔧 RECOMMENDATIONS:")
        recommendations = generate_recommendations(test_results)
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")
    
    print(f"\n🎉 Test execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Return exit code based on overall success
    return 0 if overall_success_rate >= 80 else 1

def generate_recommendations(test_results):
    """Generate recommendations based on test results"""
    recommendations = []
    
    failed_suites = [name for name, result in test_results.items() if not result["success"]]
    
    if "frontend_tests" in failed_suites:
        recommendations.append("Fix React frontend test failures - check component rendering and logic")
    
    if "journey_tests" in failed_suites:
        recommendations.append("Address user journey test failures - improve user experience flows")
    
    if "screen_tests" in failed_suites:
        recommendations.append("Fix screen-specific test failures - check UI functionality")
    
    if "api_tests" in failed_suites:
        recommendations.append("Resolve API test failures - verify backend service functionality")
    
    if "ai_tests" in failed_suites:
        recommendations.append("Fix AI service test failures - check Gemini API integration")
    
    if "performance_tests" in failed_suites:
        recommendations.append("Address performance issues - optimize application speed")
    
    if not recommendations:
        recommendations.append("All tests passed! Consider adding more edge case coverage")
    
    return recommendations

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
