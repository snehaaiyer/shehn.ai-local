#!/bin/bash

# BID AI Wedding Assistant - Test Execution Script
# This script runs comprehensive tests for all BID AI functionalities

echo "🌸 BID AI Wedding Assistant - Test Suite Runner"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install required packages for testing
print_status "Installing test dependencies..."
pip install requests asyncio > /dev/null 2>&1

# Check if services are running
print_status "Checking service availability..."

# Check frontend service
if curl -s http://localhost:8000 > /dev/null; then
    print_success "Frontend service is running (http://localhost:8000)"
    FRONTEND_STATUS="✅"
else
    print_warning "Frontend service not detected (http://localhost:8000)"
    FRONTEND_STATUS="⚠️"
fi

# Check AI service
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    print_success "AI service is running (http://localhost:8001)"
    AI_STATUS="✅"
else
    print_warning "AI service not detected (http://localhost:8001)"
    AI_STATUS="⚠️"
fi

# Check Ollama service
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_success "Ollama service is running (http://localhost:11434)"
    OLLAMA_STATUS="✅"
else
    print_warning "Ollama service not detected (http://localhost:11434)"
    OLLAMA_STATUS="⚠️"
fi

echo ""
echo "Service Status Summary:"
echo "  Frontend: $FRONTEND_STATUS"
echo "  AI Service: $AI_STATUS"
echo "  Ollama: $OLLAMA_STATUS"
echo ""

# Parse command line arguments
CATEGORY="all"
VERBOSE=""
BASE_URL="http://localhost:8000"
API_URL="http://localhost:8001"

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--category)
            CATEGORY="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE="--verbose"
            shift
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --category CATEGORY   Test category (all, core, api, ai, nav, theme, performance, error)"
            echo "  -v, --verbose            Enable verbose output"
            echo "  --base-url URL           Frontend URL (default: http://localhost:8000)"
            echo "  --api-url URL            API URL (default: http://localhost:8001)"
            echo "  -h, --help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                       # Run all tests"
            echo "  $0 -c core              # Run only core functionality tests"
            echo "  $0 -c api -v            # Run API tests with verbose output"
            echo ""
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate category
valid_categories="all core api ai nav theme performance error"
if [[ ! " $valid_categories " =~ " $CATEGORY " ]]; then
    print_error "Invalid category: $CATEGORY"
    print_error "Valid categories: $valid_categories"
    exit 1
fi

print_status "Starting test execution..."
print_status "Category: $CATEGORY"
print_status "Frontend URL: $BASE_URL"
print_status "API URL: $API_URL"

# Create test runner script
cat > test_runner_temp.py << 'EOF'
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the test suite
exec(open('bid_ai_test_suite.py').read())
EOF

# Run the tests
echo ""
print_status "🚀 Executing BID AI Test Suite..."
echo "=================================================="

python3 test_runner_temp.py --category "$CATEGORY" --base-url "$BASE_URL" --api-url "$API_URL" $VERBOSE

TEST_EXIT_CODE=$?

# Clean up temporary file
rm -f test_runner_temp.py

echo ""
echo "=================================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Test execution completed successfully!"
else
    print_error "Test execution completed with errors (Exit code: $TEST_EXIT_CODE)"
fi

# Check if test report was generated
LATEST_REPORT=$(ls -t bid_ai_test_report_*.json 2>/dev/null | head -n1)
if [ -n "$LATEST_REPORT" ]; then
    print_success "Test report generated: $LATEST_REPORT"
    
    # Extract and display key metrics from the report
    if command -v jq &> /dev/null; then
        print_status "Test Summary:"
        jq -r '.summary | "  Total Tests: \(.total_tests)\n  Passed: \(.passed)\n  Failed: \(.failed)\n  Pass Rate: \(.pass_rate)\n  Duration: \(.duration)"' "$LATEST_REPORT"
    else
        print_status "Install 'jq' to see detailed test summary"
    fi
else
    print_warning "No test report found"
fi

# Deactivate virtual environment
deactivate

echo ""
print_status "Test execution completed. Check the report for detailed results."

exit $TEST_EXIT_CODE 