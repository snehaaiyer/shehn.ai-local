#!/usr/bin/env python3
"""
Setup script to initialize NocoDB vendor database
"""

import requests
import json
import os
from datetime import datetime

def setup_nocodb_vendors():
    """Setup NocoDB vendor database tables"""
    
    print("🔧 SETTING UP NOCODB VENDOR DATABASE")
    print("=" * 50)
    
    # NocoDB configuration
    base_url = os.getenv("NOCODB_URL", "http://localhost:8080")
    auth_token = os.getenv("NOCODB_TOKEN", "")
    project_id = os.getenv("NOCODB_PROJECT_ID", "bidai_wedding_platform")
    
    print(f"📍 NocoDB URL: {base_url}")
    print(f"🔑 Auth Token: {'Set' if auth_token else 'Not set'}")
    print(f"📁 Project ID: {project_id}")
    
    # Headers
    headers = {
        'Content-Type': 'application/json',
        'xc-auth': auth_token
    } if auth_token else {'Content-Type': 'application/json'}
    
    # Test connection
    print("\n🔍 Testing NocoDB connection...")
    try:
        response = requests.get(f"{base_url}/api/v1/{project_id}/tables", headers=headers)
        if response.status_code == 200:
            print("✅ NocoDB connection successful")
            tables = response.json().get('list', [])
            print(f"   Found {len(tables)} existing tables")
            for table in tables:
                print(f"   - {table.get('title', 'Unknown')}")
        else:
            print(f"❌ NocoDB connection failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    
    # Create vendors table if it doesn't exist
    print("\n📋 Creating vendors table...")
    vendors_table_exists = any(table.get('title') == 'vendors' for table in tables)
    
    if not vendors_table_exists:
        try:
            vendors_schema = {
                "table_name": "vendors",
                "title": "vendors",
                "columns": [
                    {"column_name": "name", "title": "name", "dt": "varchar", "dtx": "specific", "dtxp": "255"},
                    {"column_name": "category", "title": "category", "dt": "varchar", "dtx": "specific", "dtxp": "100"},
                    {"column_name": "location", "title": "location", "dt": "varchar", "dtx": "specific", "dtxp": "100"},
                    {"column_name": "description", "title": "description", "dt": "text"},
                    {"column_name": "rating", "title": "rating", "dt": "decimal", "dtx": "specific", "dtxp": "3,1"},
                    {"column_name": "price_range", "title": "price_range", "dt": "varchar", "dtx": "specific", "dtxp": "255"},
                    {"column_name": "phone", "title": "phone", "dt": "varchar", "dtx": "specific", "dtxp": "20"},
                    {"column_name": "email", "title": "email", "dt": "varchar", "dtx": "specific", "dtxp": "255"},
                    {"column_name": "website", "title": "website", "dt": "varchar", "dtx": "specific", "dtxp": "255"},
                    {"column_name": "google_maps", "title": "google_maps", "dt": "varchar", "dtx": "specific", "dtxp": "500"},
                    {"column_name": "instagram", "title": "instagram", "dt": "varchar", "dtx": "specific", "dtxp": "100"},
                    {"column_name": "whatsapp", "title": "whatsapp", "dt": "varchar", "dtx": "specific", "dtxp": "20"},
                    {"column_name": "specialties", "title": "specialties", "dt": "text"},
                    {"column_name": "verified", "title": "verified", "dt": "boolean"},
                    {"column_name": "source", "title": "source", "dt": "varchar", "dtx": "specific", "dtxp": "50"},
                    {"column_name": "primary_image", "title": "primary_image", "dt": "varchar", "dtx": "specific", "dtxp": "500"},
                    {"column_name": "thumbnail_image", "title": "thumbnail_image", "dt": "varchar", "dtx": "specific", "dtxp": "500"},
                    {"column_name": "images", "title": "images", "dt": "text"},
                    {"column_name": "justifications", "title": "justifications", "dt": "text"},
                    {"column_name": "highlights", "title": "highlights", "dt": "text"},
                    {"column_name": "sentiment_analysis", "title": "sentiment_analysis", "dt": "text"},
                    {"column_name": "match_score", "title": "match_score", "dt": "decimal", "dtx": "specific", "dtxp": "5,2"},
                    {"column_name": "search_query", "title": "search_query", "dt": "text"},
                    {"column_name": "created_at", "title": "created_at", "dt": "datetime"},
                    {"column_name": "updated_at", "title": "updated_at", "dt": "datetime"},
                    {"column_name": "last_searched", "title": "last_searched", "dt": "datetime"},
                    {"column_name": "search_count", "title": "search_count", "dt": "int"}
                ]
            }
            
            response = requests.post(
                f"{base_url}/api/v1/{project_id}/tables",
                headers=headers,
                json=vendors_schema
            )
            
            if response.status_code == 200:
                print("✅ Vendors table created successfully")
            else:
                print(f"❌ Failed to create vendors table: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating vendors table: {e}")
            return False
    else:
        print("✅ Vendors table already exists")
    
    # Create search_cache table if it doesn't exist
    print("\n📋 Creating search_cache table...")
    cache_table_exists = any(table.get('title') == 'search_cache' for table in tables)
    
    if not cache_table_exists:
        try:
            cache_schema = {
                "table_name": "search_cache",
                "title": "search_cache",
                "columns": [
                    {"column_name": "query_hash", "title": "query_hash", "dt": "varchar", "dtx": "specific", "dtxp": "255"},
                    {"column_name": "category", "title": "category", "dt": "varchar", "dtx": "specific", "dtxp": "100"},
                    {"column_name": "location", "title": "location", "dt": "varchar", "dtx": "specific", "dtxp": "100"},
                    {"column_name": "search_params", "title": "search_params", "dt": "text"},
                    {"column_name": "results_count", "title": "results_count", "dt": "int"},
                    {"column_name": "created_at", "title": "created_at", "dt": "datetime"},
                    {"column_name": "last_accessed", "title": "last_accessed", "dt": "datetime"},
                    {"column_name": "access_count", "title": "access_count", "dt": "int"}
                ]
            }
            
            response = requests.post(
                f"{base_url}/api/v1/{project_id}/tables",
                headers=headers,
                json=cache_schema
            )
            
            if response.status_code == 200:
                print("✅ Search cache table created successfully")
            else:
                print(f"❌ Failed to create search cache table: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating search cache table: {e}")
            return False
    else:
        print("✅ Search cache table already exists")
    
    # Test inserting a sample vendor
    print("\n🧪 Testing vendor insertion...")
    try:
        sample_vendor = {
            "name": "Test Vendor",
            "category": "venues",
            "location": "mumbai",
            "description": "Test vendor for database setup",
            "rating": 4.5,
            "price_range": "₹1,00,000 - ₹3,00,000",
            "phone": "+91 98765 43210",
            "email": "test@vendor.com",
            "website": "https://testvendor.com",
            "google_maps": "https://maps.google.com",
            "instagram": "@testvendor",
            "whatsapp": "+91 98765 43210",
            "specialties": json.dumps(["Wedding Venues", "Corporate Events"]),
            "verified": True,
            "source": "test",
            "primary_image": "https://example.com/image.jpg",
            "thumbnail_image": "https://example.com/thumb.jpg",
            "images": json.dumps([{"url": "https://example.com/image.jpg"}]),
            "justifications": json.dumps(["Great location", "Good reviews"]),
            "highlights": json.dumps(["Premium venue", "Excellent service"]),
            "sentiment_analysis": json.dumps({"positive": 0.8, "negative": 0.1}),
            "match_score": 85.5,
            "search_query": "test query",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "last_searched": datetime.now().isoformat(),
            "search_count": 1
        }
        
        response = requests.post(
            f"{base_url}/api/v1/{project_id}/vendors",
            headers=headers,
            json=sample_vendor
        )
        
        if response.status_code == 200:
            print("✅ Sample vendor inserted successfully")
            
            # Clean up test vendor
            vendor_id = response.json().get('Id')
            if vendor_id:
                delete_response = requests.delete(
                    f"{base_url}/api/v1/{project_id}/vendors/{vendor_id}",
                    headers=headers
                )
                if delete_response.status_code == 200:
                    print("✅ Test vendor cleaned up")
        else:
            print(f"❌ Failed to insert sample vendor: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing vendor insertion: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎯 NOCODB VENDOR DATABASE SETUP COMPLETE")
    print("=" * 50)
    return True

if __name__ == "__main__":
    setup_nocodb_vendors() 