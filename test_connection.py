"""
Test Connection Script
Tests connections to various services and APIs
"""

import requests
import json
from typing import Dict, Any
import os
from config.api_config import (
    NOCODB_API_TOKEN,
    TABLE_IDS,
    NOCODB_HEADERS,
    get_nocodb_url
)

def test_nocodb_connection() -> Dict[str, Any]:
    """Test connection to NocoDB"""
    try:
        url = f"{get_nocodb_url()}/tables"
        response = requests.get(
            url,
            headers=NOCODB_HEADERS
        )
        response.raise_for_status()
        return {
            "status": "success",
            "message": "Successfully connected to NocoDB",
            "details": response.json()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to connect to NocoDB: {str(e)}",
            "details": None
        }

def test_api_endpoints() -> Dict[str, Any]:
    """Test all API endpoints"""
    results = {
        "nocodb": test_nocodb_connection()
    }
    
    # Add more endpoint tests as needed
    
    return results

def main():
    """Main test function"""
    print("Testing connections...")
    results = test_api_endpoints()
    
    # Print results
    for service, result in results.items():
        print(f"\n{service.upper()} Test:")
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")
        if result['details']:
            print("Details:", json.dumps(result['details'], indent=2))

if __name__ == "__main__":
    main() 