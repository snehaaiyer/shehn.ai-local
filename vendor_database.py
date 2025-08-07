#!/usr/bin/env python3
"""
Vendor Database System for Wedding Platform
Stores vendor results in NocoDB for quick querying and deduplication
"""

import json
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher
import requests
import os
from field_mapping_service import FieldMappingService
from config.nocodb_config import NOCODB_CONFIG
from nocodb_schemas.preferences_extended_table import get_preferences_extended_table_schema
from nocodb_schemas.vendor_selections_table import get_vendor_selections_table_schema
from nocodb_schemas.budget_allocations_table import get_budget_allocations_table_schema

logger = logging.getLogger(__name__)

@dataclass
class VendorRecord:
    """Database record for vendor data"""
    id: Optional[int] = None
    name: str = ""
    category: str = ""
    location: str = ""
    description: str = ""
    rating: float = 0.0
    price_range: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    google_maps: str = ""
    instagram: str = ""
    whatsapp: str = ""
    specialties: str = ""  # JSON string
    verified: bool = False
    source: str = ""
    primary_image: str = ""
    thumbnail_image: str = ""
    images: str = ""  # JSON string
    justifications: str = ""  # JSON string
    highlights: str = ""  # JSON string
    sentiment_analysis: str = ""  # JSON string
    match_score: float = 0.0
    search_query: str = ""
    created_at: str = ""
    updated_at: str = ""
    last_searched: str = ""
    search_count: int = 0

class NocoDBVendorDatabase:
    """NocoDB database for storing and querying vendor data"""
    
    def __init__(self):
        # Get NocoDB configuration from config
        self.base_url = NOCODB_CONFIG["BASE_URL"]
        self.auth_token = NOCODB_CONFIG["API_TOKEN"]
        self.project_id = NOCODB_CONFIG["PROJECT_ID"]
        self.table_ids = NOCODB_CONFIG["TABLE_IDS"]
        
        # API endpoints (use table IDs)
        self.vendors_table = self.table_ids["vendors"]
        self.search_cache_table = "search_cache"  # If you have a table ID for this, add it
        
        # Initialize headers
        self.headers = {
            'Content-Type': 'application/json',
            'xc-token': self.auth_token
        } if self.auth_token else {'Content-Type': 'application/json'}
        
        logger.info(f"✅ NocoDB Vendor Database initialized: {self.base_url}")
    
    def _get_api_url(self, table: str) -> str:
        """Generate NocoDB API URL for a table using table ID (v2 API)"""
        table_id = self.table_ids.get(table, table)
        return f"{self.base_url}/api/v2/tables/{table_id}/records"
    
    def init_database(self):
        """Initialize the database with required tables (NocoDB handles this automatically)"""
        try:
            # Test connection
            response = requests.get(f"{self.base_url}/api/v1/{self.project_id}/tables", headers=self.headers)
            if response.status_code == 200:
                logger.info(f"✅ NocoDB connection successful")
                return True
            else:
                logger.warning(f"⚠️ NocoDB connection test failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ NocoDB connection failed: {e}")
            return False
    
    def store_vendors(self, vendors: List[Dict], category: str, location: str, search_query: str = "") -> int:
        """
        Store vendor data in NocoDB with deduplication
        
        Args:
            vendors: List of vendor dictionaries
            category: Vendor category
            location: Search location
            search_query: Original search query
            
        Returns:
            Number of vendors stored
        """
        try:
            stored_count = 0
            current_time = datetime.now().isoformat()
            
            for vendor_data in vendors:
                try:
                    # Prepare vendor record for NocoDB
                    vendor_record = {
                        "name": vendor_data.get('name', ''),
                        "category": category,
                        "location": location,
                        "description": vendor_data.get('description', ''),
                        "rating": float(vendor_data.get('rating', 0.0)),
                        "price_range": vendor_data.get('price', ''),
                        "phone": vendor_data.get('phone', ''),
                        "email": vendor_data.get('email', ''),
                        "website": vendor_data.get('website', ''),
                        "google_maps": vendor_data.get('google_maps', ''),
                        "instagram": vendor_data.get('instagram', ''),
                        "whatsapp": vendor_data.get('whatsapp', ''),
                        "specialties": json.dumps(vendor_data.get('specialties', [])),
                        "verified": vendor_data.get('verified', False),
                        "source": vendor_data.get('source', ''),
                        "primary_image": vendor_data.get('primary_image', ''),
                        "thumbnail_image": vendor_data.get('thumbnail_image', ''),
                        "images": json.dumps(vendor_data.get('images', [])),
                        "justifications": json.dumps(vendor_data.get('justifications', [])),
                        "highlights": json.dumps(vendor_data.get('highlights', [])),
                        "sentiment_analysis": json.dumps(vendor_data.get('sentiment_analysis', {})),
                        "match_score": float(vendor_data.get('match_score', 0.0)),
                        "search_query": search_query,
                        "created_at": current_time,
                        "updated_at": current_time,
                        "last_searched": current_time,
                        "search_count": 1
                    }
                    
                    # Check if vendor already exists (by name, category, location)
                    existing_vendor = self._find_existing_vendor(
                        vendor_record["name"], category, location
                    )
                    
                    if existing_vendor:
                        # Update existing vendor
                        vendor_id = existing_vendor["Id"]
                        update_url = f"{self._get_api_url(self.vendors_table)}/{vendor_id}"
                        
                        # Update search count and last searched
                        vendor_record["search_count"] = existing_vendor.get("search_count", 0) + 1
                        vendor_record["updated_at"] = current_time
                        
                        response = requests.patch(update_url, headers=self.headers, json=vendor_record)
                        if response.status_code == 200:
                            stored_count += 1
                            logger.debug(f"Updated vendor: {vendor_record['name']}")
                    else:
                        # Create new vendor
                        create_url = self._get_api_url(self.vendors_table)
                        response = requests.post(create_url, headers=self.headers, json=vendor_record)
                        if response.status_code == 200:
                            stored_count += 1
                            logger.debug(f"Created vendor: {vendor_record['name']}")
                    
                except Exception as e:
                    logger.error(f"Error storing vendor {vendor_data.get('name', 'Unknown')}: {e}")
                    continue
            
            # Store search cache entry
            self._store_search_cache(category, location, search_query, stored_count)
            
            logger.info(f"✅ Stored {stored_count} vendors for {category} in {location}")
            return stored_count
            
        except Exception as e:
            logger.error(f"❌ Error storing vendors: {e}")
            return 0
    
    def _find_existing_vendor(self, name: str, category: str, location: str) -> Optional[Dict]:
        """Find existing vendor by name, category, and location"""
        try:
            # Create filter for exact match
            filter_query = f"(name,eq,{name})~and(category,eq,{category})~and(location,eq,{location})"
            url = f"{self._get_api_url(self.vendors_table)}?where={filter_query}&limit=1"
            
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("list") and len(data["list"]) > 0:
                    return data["list"][0]
            return None
        except Exception as e:
            logger.error(f"Error finding existing vendor: {e}")
            return None
    
    def _store_search_cache(self, category: str, location: str, search_query: str, results_count: int):
        """Store search cache entry"""
        try:
            query_hash = self._generate_query_hash(category, location, search_query)
            current_time = datetime.now().isoformat()
            
            cache_record = {
                "query_hash": query_hash,
                "category": category,
                "location": location,
                "search_params": json.dumps({"query": search_query}),
                "results_count": results_count,
                "created_at": current_time,
                "last_accessed": current_time,
                "access_count": 1
            }
            
            # Check if cache entry exists
            filter_query = f"(query_hash,eq,{query_hash})"
            url = f"{self._get_api_url(self.search_cache_table)}?where={filter_query}&limit=1"
            
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("list") and len(data["list"]) > 0:
                    # Update existing cache entry
                    cache_id = data["list"][0]["Id"]
                    update_url = f"{self._get_api_url(self.search_cache_table)}/{cache_id}"
                    cache_record["access_count"] = data["list"][0].get("access_count", 0) + 1
                    requests.patch(update_url, headers=self.headers, json=cache_record)
                else:
                    # Create new cache entry
                    create_url = self._get_api_url(self.search_cache_table)
                    requests.post(create_url, headers=self.headers, json=cache_record)
                    
        except Exception as e:
            logger.error(f"Error storing search cache: {e}")
    
    def get_vendors(self, category: str, location: str, limit: int = 10, 
                   min_rating: float = 0.0, min_match_score: float = 0.0) -> List[Dict]:
        """
        Retrieve vendors from NocoDB with filtering
        
        Args:
            category: Vendor category
            location: Search location
            limit: Maximum number of results
            min_rating: Minimum rating filter
            min_match_score: Minimum match score filter
            
        Returns:
            List of vendor dictionaries
        """
        try:
            # Build filter query
            filter_parts = [
                f"(category,eq,{category})",
                f"(location,eq,{location})",
                f"(rating,gte,{min_rating})",
                f"(match_score,gte,{min_match_score})"
            ]
            filter_query = "~and".join(filter_parts)
            
            # Build sort query (match_score desc, rating desc, search_count desc)
            sort_query = "match_score,-rating,-search_count"
            
            url = f"{self._get_api_url(self.vendors_table)}?where={filter_query}&sort={sort_query}&limit={limit}"
            
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                vendors = data.get("list", [])
                
                # Update last_searched and search_count for retrieved vendors
                self._update_vendor_access(vendors)
                
                # Parse JSON fields
                for vendor in vendors:
                    for field in ['specialties', 'images', 'justifications', 'highlights', 'sentiment_analysis']:
                        if vendor.get(field):
                            try:
                                vendor[field] = json.loads(vendor[field])
                            except:
                                vendor[field] = []
                
                logger.info(f"✅ Retrieved {len(vendors)} vendors for {category} in {location}")
                return vendors
            else:
                logger.error(f"❌ Error retrieving vendors: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error retrieving vendors: {e}")
            return []
    
    def _update_vendor_access(self, vendors: List[Dict]):
        """Update last_searched and search_count for vendors"""
        try:
            current_time = datetime.now().isoformat()
            
            for vendor in vendors:
                vendor_id = vendor["Id"]
                update_data = {
                    "last_searched": current_time,
                    "search_count": vendor.get("search_count", 0) + 1
                }
                
                update_url = f"{self._get_api_url(self.vendors_table)}/{vendor_id}"
                requests.patch(update_url, headers=self.headers, json=update_data)
                
        except Exception as e:
            logger.error(f"Error updating vendor access: {e}")
    
    def search_vendors(self, category: str, location: str, search_params: Dict = None) -> List[Dict]:
        """
        Search vendors with intelligent deduplication and filtering
        
        Args:
            category: Vendor category
            location: Search location
            search_params: Additional search parameters
            
        Returns:
            List of unique vendor dictionaries
        """
        try:
            # First, try to get from database
            vendors = self.get_vendors(category, location, limit=20)
            
            if vendors:
                # Apply additional deduplication
                unique_vendors = self._deduplicate_vendors(vendors)
                logger.info(f"✅ Found {len(unique_vendors)} unique vendors in database for {category} in {location}")
                return unique_vendors[:10]  # Return top 10
            
            logger.info(f"⚠️ No vendors found in database for {category} in {location}")
            return []
            
        except Exception as e:
            logger.error(f"❌ Error searching vendors: {e}")
            return []
    
    def _deduplicate_vendors(self, vendors: List[Dict]) -> List[Dict]:
        """Remove duplicate vendors using fuzzy matching"""
        if not vendors:
            return []
        
        seen_names = set()
        seen_phones = set()
        unique_vendors = []
        
        for vendor in vendors:
            vendor_name = vendor.get('name', '').lower().strip()
            vendor_phone = vendor.get('phone', '').strip()
            
            # Skip if we've seen this name or phone before
            if vendor_name in seen_names or (vendor_phone and vendor_phone in seen_phones):
                continue
            
            # Check for fuzzy name matches (similar names)
            is_duplicate = False
            for existing_name in seen_names:
                similarity = SequenceMatcher(None, vendor_name, existing_name).ratio()
                if similarity > 0.8:  # 80% similarity threshold
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            # Add to seen sets
            seen_names.add(vendor_name)
            if vendor_phone:
                seen_phones.add(vendor_phone)
            
            unique_vendors.append(vendor)
        
        return unique_vendors
    
    def _generate_query_hash(self, category: str, location: str, search_query: str = "") -> str:
        """Generate hash for search query caching"""
        query_string = f"{category}_{location}_{search_query}"
        return hashlib.md5(query_string.encode()).hexdigest()
    
    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        try:
            stats = {
                'total_vendors': 0,
                'category_counts': {},
                'location_counts': {},
                'recent_searches': 0
            }
            
            # Get total vendors
            url = f"{self._get_api_url(self.vendors_table)}?limit=1"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                stats['total_vendors'] = data.get('pageInfo', {}).get('totalRows', 0)
            
            # Get category counts
            url = f"{self._get_api_url(self.vendors_table)}?groupby=category"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('list', []):
                    stats['category_counts'][item.get('category', 'Unknown')] = item.get('count', 0)
            
            # Get location counts
            url = f"{self._get_api_url(self.vendors_table)}?groupby=location"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('list', []):
                    stats['location_counts'][item.get('location', 'Unknown')] = item.get('count', 0)
            
            # Get recent searches (last 24 hours)
            cutoff_time = (datetime.now() - timedelta(hours=24)).isoformat()
            filter_query = f"(last_accessed,gte,{cutoff_time})"
            url = f"{self._get_api_url(self.search_cache_table)}?where={filter_query}&limit=1"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                stats['recent_searches'] = data.get('pageInfo', {}).get('totalRows', 0)
            
            return stats
                
        except Exception as e:
            logger.error(f"❌ Error getting database stats: {e}")
            return {}
    
    def clear_old_data(self, days: int = 30):
        """Clear old vendor data and search cache"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            # Clear old vendors
            filter_query = f"(last_searched,lt,{cutoff_date})"
            url = f"{self._get_api_url(self.vendors_table)}?where={filter_query}"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                vendors_to_delete = data.get('list', [])
                
                for vendor in vendors_to_delete:
                    delete_url = f"{self._get_api_url(self.vendors_table)}/{vendor['Id']}"
                    requests.delete(delete_url, headers=self.headers)
                
                logger.info(f"✅ Cleared {len(vendors_to_delete)} old vendors")
            
            # Clear old search cache
            filter_query = f"(last_accessed,lt,{cutoff_date})"
            url = f"{self._get_api_url(self.search_cache_table)}?where={filter_query}"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                cache_to_delete = data.get('list', [])
                
                for cache_entry in cache_to_delete:
                    delete_url = f"{self._get_api_url(self.search_cache_table)}/{cache_entry['Id']}"
                    requests.delete(delete_url, headers=self.headers)
                
                logger.info(f"✅ Cleared {len(cache_to_delete)} old cache entries")
                
        except Exception as e:
            logger.error(f"❌ Error clearing old data: {e}")

    def store_couple_details(self, couple_data: Dict) -> Optional[Dict]:
        """Store couple details in NocoDB (table: couples)"""
        try:
            create_url = self._get_api_url("couples")
            response = requests.post(create_url, headers=self.headers, json=couple_data)
            if response.status_code == 200:
                logger.info(f"✅ Stored couple details for {couple_data.get('yourName', '')} & {couple_data.get('partnerName', '')}")
                return response.json()
            else:
                logger.error(f"❌ Error storing couple details: {response.status_code} {response.text}")
                return {"error": response.text, "status_code": response.status_code}
        except Exception as e:
            logger.error(f"❌ Exception storing couple details: {e}")
            return {"error": str(e)}

    def store_preferences(self, preferences_data: Dict) -> Optional[Dict]:
        """Store preferences in NocoDB (table: preferences)"""
        try:
            # First test connection
            test_response = requests.get(f"{self.base_url}/api/v1/db/meta/projects/", headers=self.headers, timeout=5)
            if test_response.status_code != 200:
                logger.error(f"❌ NocoDB connection failed: {test_response.status_code}")
                return {"error": "Database connection failed", "status": test_response.status_code}
            
            create_url = self._get_api_url("preferences")
            logger.info(f"Storing preferences to: {create_url}")
            logger.info(f"Data: {preferences_data}")
            
            response = requests.post(create_url, headers=self.headers, json=preferences_data, timeout=10)
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response text: {response.text}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"✅ Stored preferences successfully: {result}")
                return result
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ Error storing preferences: {error_msg}")
                return {"error": error_msg, "status": response.status_code}
                
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error - NocoDB may not be running: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"error": error_msg}
        except requests.exceptions.Timeout as e:
            error_msg = f"Request timeout - NocoDB not responding: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"error": error_msg}
        except Exception as e:
            error_msg = f"Exception storing preferences: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"error": error_msg}

    def store_couple_data(self, couple_data):
        """Store couple data in NocoDB couples table"""
        try:
            # First test connection
            test_response = requests.get(f"{self.base_url}/api/v1/db/meta/projects/", headers=self.headers, timeout=5)
            if test_response.status_code != 200:
                logger.error(f"❌ NocoDB connection failed: {test_response.status_code}")
                return {"success": False, "error": "Database connection failed", "status": test_response.status_code}
            
            # Map data to correct NocoDB field names
            nocodb_data = {
                "Partner1 Name": couple_data.get('partner1_name', ''),
                "Partner2 Name": couple_data.get('partner2_name', ''),
                "Wedding Date": couple_data.get('wedding_date', ''),
                "City": couple_data.get('city', ''),
                "Budget": couple_data.get('budget', ''),
                "Guest Count": couple_data.get('guest_count', ''),
                "Wedding Type": couple_data.get('wedding_type', 'Traditional'),
                "Wedding Days": couple_data.get('wedding_days', 1),
                "Preferences": couple_data.get('preferences', '{}'),
                "Status": "Active",
                "Created At": couple_data.get('created_at', datetime.now().isoformat())
            }
            
            # Create record in couples table
            create_url = self._get_api_url("couples")
            logger.info(f"Storing couple data to: {create_url}")
            logger.info(f"Data: {nocodb_data}")
            
            response = requests.post(create_url, headers=self.headers, json=nocodb_data, timeout=10)
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response text: {response.text}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"Couple data stored successfully: {result}")
                return {"success": True, "id": result.get("Id", result.get("id")), "data": result}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"Failed to store couple data: {error_msg}")
                return {"success": False, "error": error_msg, "status": response.status_code}
                
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error - NocoDB may not be running: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except requests.exceptions.Timeout as e:
            error_msg = f"Request timeout - NocoDB not responding: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Error storing couple data: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}

    def get_couple_data(self, couple_id=None):
        """Retrieve couple data from NocoDB"""
        try:
            get_url = self._get_api_url("couples")
            if couple_id:
                get_url += f"/{couple_id}"
            
            response = requests.get(get_url, headers=self.headers)
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Error retrieving couple data: {e}")
            return {"success": False, "error": str(e)}

    def store_extended_preferences(self, couple_id: int, preferences_data: Dict) -> Dict:
        """Store extended preferences with multi-select support"""
        try:
            # Test connection first
            test_response = requests.get(f"{self.base_url}/api/v1/db/meta/projects/", 
                                       headers=self.headers, timeout=5)
            if test_response.status_code != 200:
                return {"success": False, "error": "NocoDB connection failed"}

            # Map frontend data to database fields
            db_data = {
                "couple_id": couple_id,
                "wedding_theme": preferences_data.get("weddingTheme"),
                "venue_type": preferences_data.get("venueType"),
                "photography_style": preferences_data.get("photographyStyle"),
                "decor_style": preferences_data.get("decorStyle"),
                "cuisine_style": preferences_data.get("cuisineStyle"),
                "floral_styles": json.dumps(preferences_data.get("floral", [])),
                "lighting_styles": json.dumps(preferences_data.get("lighting", [])),
                "furniture_styles": json.dumps(preferences_data.get("furniture", [])),
                "color_themes": json.dumps(preferences_data.get("colors", [])),
                "music_preferences": json.dumps(preferences_data.get("music", [])),
                "entertainment_preferences": json.dumps(preferences_data.get("entertainment", [])),
                "budget_range": preferences_data.get("budgetRange"),
                "guest_count": preferences_data.get("guestCount"),
                "wedding_days": preferences_data.get("weddingDays", 1),
                "preferred_city": preferences_data.get("city"),
                "date_flexibility": preferences_data.get("dateFlexibility"),
                "preferred_season": preferences_data.get("season"),
                "special_requirements": preferences_data.get("specialRequirements"),
                "priorities": json.dumps(preferences_data.get("priorities", [])),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

            # Create or update extended preferences
            url = f"{self.base_url}/api/v2/tables/preferences_extended/records"
            response = requests.post(url, headers=self.headers, json=db_data, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"✅ Stored extended preferences for couple {couple_id}")
                return {"success": True, "data": response.json()}
            else:
                logger.error(f"❌ Failed to store extended preferences: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ Error storing extended preferences: {str(e)}")
            return {"success": False, "error": str(e)}

    def store_vendor_selection(self, couple_id: int, vendor_data: Dict) -> Dict:
        """Store vendor selection for a couple"""
        try:
            # Test connection first
            test_response = requests.get(f"{self.base_url}/api/v1/db/meta/projects/", 
                                       headers=self.headers, timeout=5)
            if test_response.status_code != 200:
                return {"success": False, "error": "NocoDB connection failed"}

            db_data = {
                "couple_id": couple_id,
                "vendor_name": vendor_data.get("name"),
                "vendor_category": vendor_data.get("category"),
                "vendor_location": vendor_data.get("location"),
                "vendor_phone": vendor_data.get("phone"),
                "vendor_email": vendor_data.get("email"),
                "vendor_website": vendor_data.get("website"),
                "selection_status": vendor_data.get("status", "interested"),
                "match_score": vendor_data.get("match_score", 0),
                "selection_reason": vendor_data.get("reason"),
                "notes": vendor_data.get("notes"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

            url = f"{self.base_url}/api/v2/tables/vendor_selections/records"
            response = requests.post(url, headers=self.headers, json=db_data, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"✅ Stored vendor selection: {vendor_data.get('name')} for couple {couple_id}")
                return {"success": True, "data": response.json()}
            else:
                logger.error(f"❌ Failed to store vendor selection: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ Error storing vendor selection: {str(e)}")
            return {"success": False, "error": str(e)}

    def store_budget_allocation(self, couple_id: int, budget_data: Dict) -> Dict:
        """Store budget allocation for a couple"""
        try:
            # Test connection first
            test_response = requests.get(f"{self.base_url}/api/v1/db/meta/projects/", 
                                       headers=self.headers, timeout=5)
            if test_response.status_code != 200:
                return {"success": False, "error": "NocoDB connection failed"}

            # First, mark any existing active budget as inactive
            existing_url = f"{self.base_url}/api/v2/tables/budget_allocations/records"
            existing_params = {
                "where": f"(couple_id,eq,{couple_id})~and(is_active,eq,true)"
            }
            existing_response = requests.get(existing_url, headers=self.headers, params=existing_params)
            
            if existing_response.status_code == 200:
                existing_records = existing_response.json().get("list", [])
                for record in existing_records:
                    update_url = f"{self.base_url}/api/v2/tables/budget_allocations/records/{record['Id']}"
                    requests.patch(update_url, headers=self.headers, json={"is_active": False})

            # Create new budget allocation
            categories = budget_data.get("categories", {})
            total_budget = budget_data.get("total", 0)
            
            db_data = {
                "couple_id": couple_id,
                "total_budget": total_budget,
                "budget_tier": budget_data.get("tier", "premium-15-30L"),
                "venue_allocation": categories.get("venue", 0),
                "venue_percentage": (categories.get("venue", 0) / total_budget * 100) if total_budget > 0 else 0,
                "photography_allocation": categories.get("photography", 0),
                "photography_percentage": (categories.get("photography", 0) / total_budget * 100) if total_budget > 0 else 0,
                "catering_allocation": categories.get("catering", 0),
                "catering_percentage": (categories.get("catering", 0) / total_budget * 100) if total_budget > 0 else 0,
                "decor_allocation": categories.get("decor", 0),
                "decor_percentage": (categories.get("decor", 0) / total_budget * 100) if total_budget > 0 else 0,
                "beauty_allocation": categories.get("beauty", 0),
                "beauty_percentage": (categories.get("beauty", 0) / total_budget * 100) if total_budget > 0 else 0,
                "entertainment_allocation": categories.get("entertainment", 0),
                "entertainment_percentage": (categories.get("entertainment", 0) / total_budget * 100) if total_budget > 0 else 0,
                "flowers_allocation": categories.get("flowers", 0),
                "flowers_percentage": (categories.get("flowers", 0) / total_budget * 100) if total_budget > 0 else 0,
                "transport_allocation": categories.get("transport", 0),
                "transport_percentage": (categories.get("transport", 0) / total_budget * 100) if total_budget > 0 else 0,
                "miscellaneous_allocation": categories.get("miscellaneous", 0),
                "miscellaneous_percentage": (categories.get("miscellaneous", 0) / total_budget * 100) if total_budget > 0 else 0,
                "allocation_type": budget_data.get("type", "smart"),
                "confidence_score": budget_data.get("confidence", 75),
                "vendor_count": budget_data.get("vendorCount", 0),
                "allocation_reasoning": json.dumps(budget_data.get("reasoning", {})),
                "is_active": True,
                "version": 1,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

            url = f"{self.base_url}/api/v2/tables/budget_allocations/records"
            response = requests.post(url, headers=self.headers, json=db_data, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"✅ Stored budget allocation for couple {couple_id}")
                return {"success": True, "data": response.json()}
            else:
                logger.error(f"❌ Failed to store budget allocation: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ Error storing budget allocation: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_vendor_selections(self, couple_id: int) -> List[Dict]:
        """Get all vendor selections for a couple"""
        try:
            url = f"{self.base_url}/api/v2/tables/vendor_selections/records"
            params = {
                "where": f"(couple_id,eq,{couple_id})",
                "sort": "vendor_category,priority_rank"
            }
            
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("list", [])
            else:
                logger.error(f"❌ Error getting vendor selections: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting vendor selections: {str(e)}")
            return []

    def get_budget_allocation(self, couple_id: int) -> Optional[Dict]:
        """Get active budget allocation for a couple"""
        try:
            url = f"{self.base_url}/api/v2/tables/budget_allocations/records"
            params = {
                "where": f"(couple_id,eq,{couple_id})~and(is_active,eq,true)",
                "limit": 1
            }
            
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                records = data.get("list", [])
                return records[0] if records else None
            else:
                logger.error(f"❌ Error getting budget allocation: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error getting budget allocation: {str(e)}")
            return None

# Global database instance
vendor_db = NocoDBVendorDatabase()

def get_vendor_database() -> NocoDBVendorDatabase:
    """Get the global vendor database instance"""
    return vendor_db 

def store_user_inputs(user_data: Dict) -> Dict:
    """
    Store user (couple) details and preferences in NocoDB, mapping frontend fields to correct tables.
    Supports: couples, weddings, preferences, design_preferences (if present), etc.
    """
    db = get_vendor_database()
    mapper = FieldMappingService()
    db_records = mapper.transform_frontend_to_db(user_data)
    results = {}
    errors = {}

    # Save each table's record
    for table, record in db_records.items():
        try:
            if table == "couples":
                results[table] = db.store_couple_details(record)
            elif table == "weddings":
                # Add couple_id if available
                couple_id = results.get("couples", {}).get("Id")
                if couple_id:
                    record["couple_id"] = couple_id
                # Use generic create for weddings
                create_url = db._get_api_url("weddings")
                response = requests.post(create_url, headers=db.headers, json=record)
                results[table] = response.json() if response.status_code == 200 else None
            elif table == "preferences":
                # Add couple_id if available
                couple_id = results.get("couples", {}).get("Id")
                if couple_id:
                    record["couple_id"] = couple_id
                results[table] = db.store_preferences(record)
            else:
                # Generic create for any other table
                create_url = db._get_api_url(table)
                response = requests.post(create_url, headers=db.headers, json=record)
                results[table] = response.json() if response.status_code == 200 else None
        except Exception as e:
            errors[table] = str(e)
            results[table] = None
    return {"results": results, "errors": errors} 