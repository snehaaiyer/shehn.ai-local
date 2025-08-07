#!/usr/bin/env python3
"""
NocoDB API Test Suite
Comprehensive testing of all NocoDB table operations
"""
import requests
import json
import time
from datetime import datetime
import sys

# NocoDB Configuration (using local instance)
NOCODB_BASE = "http://localhost:8080"
NOCODB_TOKEN = "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk"

# Table IDs (from actual config)
TABLES = {
    "weddings": "mslkrxqymrbe01d",
    "couples": "mcv14lxgtp3rwa5",
    "venues": "m8o47zj6gmkmguz",
    "vendors": "mpw9em3omtlqlsg",
    "preferences": "mx7nrptxiiqbsty"
}

# Test data templates
TEST_DATA = {
    "weddings": {
        "Name": "Test Wedding - NocoDB API Test",
        "Date": "2024-12-31",
        "Budget Total": 500000,
        "Guest Count": 150,
        "Status": "Planning",
        "Wedding Type": "Hindu",
        "Region": "North Indian",
        "City": "Mumbai"
    },
    "couples": {
        "Primary Contact Name": "John Test",
        "Secondary Contact Name": "Jane Test",
        "City": "Mumbai",
        "Account Status": "Active"
    },
    "venues": {
        "Name": "Test Venue",
        "Type": "Banquet Hall",
        "City": "Mumbai",
        "Capacity": 200,
        "Price Range": "Premium",
        "Contact": "9999999999"
    },
    "vendors": {
        "Business Name": "Test Photography Studio",
        "Category": "Photography",
        "City": "Mumbai",
        "Contact Person": "Test Photographer",
        "Phone": "9999999999",
        "Services": "Wedding Photography, Pre-wedding shoots",
        "Rating": 4.5,
        "Status": "Active"
    },
    "preferences": {
        "Style Tags": "Traditional",
        "Form-collected Preferences": "Events: Wedding, Reception; Style: Grand",
        "Cultural Requirements": "Hindu wedding traditions",
        "Location Preferences": "Mumbai"
    },
    "budget": {
        "Category": "Photography",
        "Allocated Amount": 50000,
        "Spent Amount": 0,
        "Status": "Allocated",
        "Priority": "High"
    },
    "tasks": {
        "Task Name": "Book Photography",
        "Description": "Find and book wedding photographer",
        "Status": "Pending",
        "Priority": "High",
        "Due Date": "2024-06-01"
    },
    "communications": {
        "Type": "Email",
        "Subject": "Wedding Photography Inquiry",
        "Content": "Test communication content",
        "Status": "Sent",
        "Direction": "Outbound"
    },
    "ceremonies": {
        "Name": "Wedding Ceremony",
        "Type": "Main Event",
        "Date": "2024-12-31",
        "Duration": "4 hours",
        "Status": "Planned"
    },
    "ai_activities": {
        "Activity Type": "API Test",
        "Description": "Testing NocoDB API integration",
        "AI Response": "Test response from API test",
        "Status": "Completed",
        "Model Used": "test-model"
    }
}

class NocoDBTester:
    def __init__(self):
        self.headers = {
            "content-type": "application/json",
            "xc-token": NOCODB_TOKEN
        }
        self.test_records = {}
        self.passed_tests = 0
        self.total_tests = 0
        
    def log_test(self, test_name, status, details=""):
        """Log test result"""
        self.total_tests += 1
        if status:
            self.passed_tests += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
    def test_connection(self):
        """Test basic NocoDB connection"""
                 try:
             # Test connection with a simple GET request
             response = requests.get(
                 f"{NOCODB_BASE}/tables/{TABLES['weddings']}/records?limit=1",
                 headers=self.headers,
                 timeout=10
             )
            success = response.status_code == 200
            self.log_test("NocoDB Connection", success, 
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("NocoDB Connection", False, str(e))
            return False
    
    def test_table_access(self, table_name, table_id):
        """Test if we can access a specific table"""
                 try:
             response = requests.get(
                 f"{NOCODB_BASE}/tables/{table_id}/records?limit=1",
                 headers=self.headers,
                 timeout=10
             )
            success = response.status_code == 200
            self.log_test(f"Table Access - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Table Access - {table_name}", False, str(e))
            return False
    
    def test_create_record(self, table_name, table_id, data):
        """Test creating a record in a table"""
        try:
                         response = requests.post(
                 f"{NOCODB_BASE}/tables/{table_id}/records",
                 headers=self.headers,
                 json=data,
                 timeout=15
             )
            success = response.status_code in [200, 201]
            if success:
                result = response.json()
                # Store the created record ID for cleanup
                if isinstance(result, dict) and 'Id' in result:
                    self.test_records[table_name] = result['Id']
                elif isinstance(result, list) and len(result) > 0 and 'Id' in result[0]:
                    self.test_records[table_name] = result[0]['Id']
                    
            self.log_test(f"Create Record - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Create Record - {table_name}", False, str(e))
            return False
    
    def test_read_record(self, table_name, table_id):
        """Test reading records from a table"""
        try:
                         response = requests.get(
                 f"{NOCODB_BASE}/tables/{table_id}/records?limit=5",
                 headers=self.headers,
                 timeout=10
             )
            success = response.status_code == 200
            if success:
                data = response.json()
                record_count = len(data.get('list', [])) if isinstance(data, dict) else len(data)
                self.log_test(f"Read Records - {table_name}", success,
                             f"Found {record_count} records")
            else:
                self.log_test(f"Read Records - {table_name}", success,
                             f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Read Records - {table_name}", False, str(e))
            return False
    
    def test_update_record(self, table_name, table_id):
        """Test updating a record"""
        if table_name not in self.test_records:
            self.log_test(f"Update Record - {table_name}", False, "No test record to update")
            return False
            
        try:
            record_id = self.test_records[table_name]
            update_data = {"Status": "Updated via API Test"}
            
                         response = requests.patch(
                 f"{NOCODB_BASE}/tables/{table_id}/records",
                 headers=self.headers,
                 json=[{"Id": record_id, **update_data}],
                 timeout=15
             )
            success = response.status_code in [200, 201]
            self.log_test(f"Update Record - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Update Record - {table_name}", False, str(e))
            return False
    
    def test_delete_record(self, table_name, table_id):
        """Test deleting a record"""
        if table_name not in self.test_records:
            self.log_test(f"Delete Record - {table_name}", False, "No test record to delete")
            return False
            
        try:
            record_id = self.test_records[table_name]
                         response = requests.delete(
                 f"{NOCODB_BASE}/tables/{table_id}/records",
                 headers=self.headers,
                 json=[record_id],
                 timeout=15
             )
            success = response.status_code in [200, 201, 204]
            self.log_test(f"Delete Record - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Delete Record - {table_name}", False, str(e))
            return False
    
    def test_table_schema(self, table_name, table_id):
        """Test getting table schema/metadata"""
        try:
            # Try to get table info - this might not work with all NocoDB versions
                         response = requests.get(
                 f"{NOCODB_BASE}/tables/{table_id}",
                 headers=self.headers,
                 timeout=10
             )
            success = response.status_code == 200
            self.log_test(f"Table Schema - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            # Schema endpoint might not be available, so let's just test a basic query
            try:
                                 response = requests.get(
                     f"{NOCODB_BASE}/tables/{table_id}/records?limit=0",  
                     headers=self.headers,
                     timeout=10
                 )
                success = response.status_code == 200
                self.log_test(f"Table Schema - {table_name}", success, "Basic query test")
                return success
            except:
                self.log_test(f"Table Schema - {table_name}", False, str(e))
                return False
    
    def test_search_functionality(self, table_name, table_id):
        """Test search/filter functionality"""
        try:
            # Test with a simple where condition
                         response = requests.get(
                 f"{NOCODB_BASE}/tables/{table_id}/records?where=(Status,eq,Active)",
                 headers=self.headers,
                 timeout=10
             )
            success = response.status_code == 200
            self.log_test(f"Search/Filter - {table_name}", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"Search/Filter - {table_name}", False, str(e))
            return False
    
    def run_comprehensive_test(self):
        """Run all tests for all tables"""
        print("🧪 NocoDB API Comprehensive Test Suite")
        print("=" * 50)
        
        # Test basic connection first
        if not self.test_connection():
            print("❌ Basic connection failed. Aborting tests.")
            return 0.0
        
        print("\n📊 Testing Individual Tables:")
        print("-" * 30)
        
        for table_name, table_id in TABLES.items():
            print(f"\n🔍 Testing {table_name.upper()} table:")
            
            # Basic table access
            self.test_table_access(table_name, table_id)
            
            # Schema test
            self.test_table_schema(table_name, table_id)
            
            # Read test
            self.test_read_record(table_name, table_id)
            
            # Create test (if we have test data)
            if table_name in TEST_DATA:
                if self.test_create_record(table_name, table_id, TEST_DATA[table_name]):
                    time.sleep(1)  # Brief pause between operations
                    
                    # Update test
                    self.test_update_record(table_name, table_id)
                    time.sleep(1)
                    
                    # Delete test (cleanup)
                    self.test_delete_record(table_name, table_id)
            
            # Search test
            self.test_search_functionality(table_name, table_id)
            
            time.sleep(0.5)  # Brief pause between tables
        
        # Summary
        print("\n" + "=" * 50)
        print("📈 NocoDB API Test Results:")
        print(f"✅ Passed: {self.passed_tests}/{self.total_tests}")
        print(f"📊 Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        
        if self.passed_tests == self.total_tests:
            print("🎉 All NocoDB API tests passed!")
        else:
            print(f"⚠️  {self.total_tests - self.passed_tests} tests failed")
        
        return self.passed_tests / self.total_tests

def main():
    """Run the NocoDB test suite"""
    tester = NocoDBTester()
    
    try:
        success_rate = tester.run_comprehensive_test()
        
        if success_rate >= 0.8:  # 80% or higher
            print("\n✅ NocoDB integration is working well!")
            sys.exit(0)
        else:
            print("\n❌ NocoDB integration has issues that need attention")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Test suite crashed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 