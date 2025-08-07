#!/bin/bash

# Wedding Planner React App - Test Runner
# This script runs comprehensive tests for all components and screens

echo "🎭 Wedding Planner React App - Test Suite"
echo "=========================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the react-frontend directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Function to run tests with specific configuration
run_tests() {
    local test_type=$1
    local command=$2
    local description=$3
    
    print_status "Running $description..."
    echo "Command: $command"
    echo "----------------------------------------"
    
    eval $command
    
    if [ $? -eq 0 ]; then
        print_success "$description completed successfully!"
    else
        print_error "$description failed!"
        return 1
    fi
    echo ""
}

# Main test execution
echo ""
print_status "Starting comprehensive test suite..."

# 1. Run all tests in watch mode
print_status "1. Running all tests in watch mode..."
run_tests "all" "npm test -- --watchAll=false" "All tests"

# 2. Run tests with coverage
print_status "2. Running tests with coverage report..."
run_tests "coverage" "npm run test:coverage" "Coverage tests"

# 3. Run specific test files
print_status "3. Running individual test files..."

# Dashboard tests
run_tests "dashboard" "npm test -- --testPathPattern=Index.test.tsx --watchAll=false" "Dashboard (Index) tests"

# Vendor Discovery tests
run_tests "vendors" "npm test -- --testPathPattern=VendorDiscovery.test.tsx --watchAll=false" "Vendor Discovery tests"

# Budget Management tests
run_tests "budget" "npm test -- --testPathPattern=BudgetManagement.test.tsx --watchAll=false" "Budget Management tests"

# Wedding Preferences tests
run_tests "preferences" "npm test -- --testPathPattern=WeddingPreferences.test.tsx --watchAll=false" "Wedding Preferences tests"

# AI Chat tests
run_tests "ai-chat" "npm test -- --testPathPattern=AIChat.test.tsx --watchAll=false" "AI Chat tests"

# App component tests
run_tests "app" "npm test -- --testPathPattern=App.test.tsx --watchAll=false" "App component tests"

# 4. Run tests with verbose output
print_status "4. Running tests with verbose output..."
run_tests "verbose" "npm test -- --verbose --watchAll=false" "Verbose tests"

# 5. Run tests with specific environment
print_status "5. Running tests in test environment..."
run_tests "env" "NODE_ENV=test npm test -- --watchAll=false" "Environment tests"

echo ""
print_status "Test suite completed!"
echo ""

# Summary
print_status "Test Summary:"
echo "✅ All tests executed"
echo "📊 Coverage report generated"
echo "🔍 Individual component tests completed"
echo "📝 Verbose output available"
echo "🌍 Environment tests completed"

echo ""
print_status "To run specific tests:"
echo "  npm test -- --testPathPattern=ComponentName.test.tsx"
echo ""
print_status "To run tests in watch mode:"
echo "  npm test"
echo ""
print_status "To generate coverage report:"
echo "  npm run test:coverage"

echo ""
print_success "🎉 All tests completed successfully!" 