#!/usr/bin/env python3
"""
BID AI Wedding App - NocoDB API Service
Connects the local wedding app to NocoDB database
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# NocoDB Configuration
NOCODB_CONFIG = {
    "BASE_URL": "http://localhost:8080",
    "PROJECT_ID": "p2manqkz6afk3ma",
    "API_TOKEN": "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk",
    "TABLE_IDS": {
        "weddings": "mslkrxqymrbe01d",
        "venues": "m8o47zj6gmkmguz", 
        "vendors": "mpw9em3omtlqlsg",
        "preferences": "mx7nrptxiiqbsty",
        "couples": "mcv14lxgtp3rwa5"
    }
}

HEADERS = {
    "xc-token": NOCODB_CONFIG["API_TOKEN"],
    "Content-Type": "application/json"
}

class NocoDBService:
    """Service for NocoDB operations"""
    
    def __init__(self):
        self.base_url = NOCODB_CONFIG["BASE_URL"]
        self.headers = HEADERS
        self.table_ids = NOCODB_CONFIG["TABLE_IDS"]
        
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to NocoDB API"""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data if data else None,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"NocoDB API Error: {e}")
            return {"error": str(e)}
    
    def get_table_url(self, table_name: str) -> str:
        """Get the API endpoint for a table"""
        if table_name not in self.table_ids:
            raise ValueError(f"Unknown table: {table_name}")
        return f"api/v1/db/data/noco/{NOCODB_CONFIG['PROJECT_ID']}/{self.table_ids[table_name]}"
    
    def create_record(self, table_name: str, data: Dict) -> Dict:
        """Create a new record"""
        try:
            # Add timestamps
            data["Created At"] = datetime.now().isoformat()
            data["Updated At"] = data["Created At"]
            
            endpoint = self.get_table_url(table_name)
            return self._make_request("POST", endpoint, data)
        except Exception as e:
            logger.error(f"Error creating record in {table_name}: {e}")
            return {"error": str(e)}
    
    def get_records(self, table_name: str, limit: int = 100) -> List[Dict]:
        """Get records from a table"""
        try:
            endpoint = f"{self.get_table_url(table_name)}?limit={limit}"
            response = self._make_request("GET", endpoint)
            return response.get("list", [])
        except Exception as e:
            logger.error(f"Error getting records from {table_name}: {e}")
            return []

# Initialize service
nocodb_service = NocoDBService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test NocoDB connection
        test_response = nocodb_service._make_request("GET", f"api/v1/db/data/noco/{NOCODB_CONFIG['PROJECT_ID']}/{NOCODB_CONFIG['TABLE_IDS']['couples']}?limit=1")
        if "error" not in test_response:
            return jsonify({
                "status": "healthy",
                "nocodb": "connected",
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "status": "unhealthy", 
                "nocodb": "disconnected",
                "error": test_response.get("error"),
                "timestamp": datetime.now().isoformat()
            }), 500
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/wedding-data', methods=['POST'])
def save_wedding_data():
    """Save complete wedding form data"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract couple information - using correct NocoDB field names
        couple_data = {
            "Primary Partner": data.get("partner1Name", ""),
            "Secondary Partner": data.get("partner2Name", ""),
            "Ceremony Date": data.get("weddingDate", ""),
            "Primary Email": data.get("email", ""),
            "Primary Phone": data.get("phone", ""),
            "Preferred Communication": data.get("communicationPreference", "Email"),
            "Residence City": data.get("region", ""),
            "Current Status": "Active"
        }
        
        # Save to couples table
        result = nocodb_service.create_record("couples", couple_data)
        
        if "error" not in result:
            return jsonify({
                "success": True,
                "message": "Wedding data saved successfully",
                "record_id": result.get("id") or result.get("Id"),
                "data": result
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 500
            
    except Exception as e:
        logger.error(f"Error saving wedding data: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/visual-preferences', methods=['POST'])
def save_visual_preferences():
    """Save visual preferences data"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract preferences - using correct NocoDB field names
        preferences_data = {
            "Style Preference": data.get("decorationTheme", ""),
            "Design Style": data.get("cuisineStyle", ""),
            "Event Theme": data.get("photographyStyle", ""),
            "Venue Location": data.get("venueType", ""),
            "Color Theme": data.get("colorScheme", [{}])[0] if data.get("colorScheme") else "",
            "Cultural Notes": json.dumps(data.get("additionalPreferences", {})),
            "Special Notes": "Created via API"
        }
        
        # Save to preferences table
        result = nocodb_service.create_record("preferences", preferences_data)
        
        if "error" not in result:
            return jsonify({
                "success": True,
                "message": "Visual preferences saved successfully",
                "record_id": result.get("id") or result.get("Id"),
                "data": result
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 500
            
    except Exception as e:
        logger.error(f"Error saving visual preferences: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/wedding-data', methods=['GET'])
def get_wedding_data():
    """Get all wedding data"""
    try:
        couples = nocodb_service.get_records("couples")
        preferences = nocodb_service.get_records("preferences")
        
        return jsonify({
            "success": True,
            "data": {
                "couples": couples,
                "preferences": preferences
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting wedding data: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/couples', methods=['GET'])
def get_couples():
    """Get all couples"""
    try:
        couples = nocodb_service.get_records("couples")
        return jsonify({
            "success": True,
            "data": couples
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/venues', methods=['GET'])
def get_venues():
    """Get all venues"""
    try:
        venues = nocodb_service.get_records("venues")
        return jsonify({
            "success": True,
            "data": venues
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    """Get all vendors"""
    try:
        vendors = nocodb_service.get_records("vendors")
        return jsonify({
            "success": True,
            "data": vendors
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/discover-venues', methods=['POST'])
def discover_venues():
    """AI-powered venue discovery"""
    try:
        import requests
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No search criteria provided"}), 400
        
        # Forward request to venue discovery service
        venue_service_url = "http://localhost:8002/discover-venues"
        
        venue_request = {
            "city": data.get("city", "Mumbai"),
            "venue_type": data.get("venue_type", "all"),
            "guest_count": int(data.get("guest_count", 200)),
            "budget_range": data.get("budget_range", "₹30-50 Lakhs"),
            "wedding_type": data.get("wedding_type", "Traditional Hindu"),
            "capacity_filter": data.get("capacity_filter"),
            "budget_filter": data.get("budget_filter"),
            "theme": data.get("theme", "Traditional"),
            "events": data.get("events", ["Wedding Ceremony", "Reception"]),
            "priorities": data.get("priorities", ["Venue", "Photography", "Catering"]),
            "wedding_date": data.get("wedding_date")
        }
        
        try:
            response = requests.post(venue_service_url, json=venue_request, timeout=30)
            if response.status_code == 200:
                return jsonify(response.json())
            else:
                # Fallback to mock data if venue service is down
                return jsonify({
                    "success": True,
                    "venues": generate_fallback_venues(venue_request),
                    "total_found": 5,
                    "search_criteria": venue_request,
                    "ai_enabled": False,
                    "fallback": True,
                    "timestamp": datetime.now().isoformat()
                })
        except requests.exceptions.RequestException:
            # Venue discovery service not available, return fallback
            return jsonify({
                "success": True,
                "venues": generate_fallback_venues(venue_request),
                "total_found": 5,
                "search_criteria": venue_request,
                "ai_enabled": False,
                "fallback": True,
                "timestamp": datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"Error in venue discovery: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def generate_fallback_venues(request_data):
    """Generate fallback venue data when AI service is unavailable"""
    city = request_data.get("city", "Mumbai")
    venue_type = request_data.get("venue_type", "all")
    
    venues = [
        {
            "id": "fallback_1",
            "name": f"Grand Heritage Palace - {city}",
            "location": city,
            "type": "heritage",
            "capacity": 300,
            "rating": 4.8,
            "priceRange": "₹8-12 Lakhs",
            "amenities": ["parking", "catering", "decoration", "ac"],
            "description": f"Beautiful heritage venue in {city} perfect for traditional weddings",
            "contact": {"phone": "+91 9999123456", "email": "booking@grandpalace.com"},
            "website": "https://grandpalace.com",
            "source": "fallback",
            "relevanceScore": 85
        },
        {
            "id": "fallback_2", 
            "name": f"Royal Banquet Hall - {city}",
            "location": city,
            "type": "banquet",
            "capacity": 250,
            "rating": 4.5,
            "priceRange": "₹5-8 Lakhs",
            "amenities": ["parking", "catering", "music", "ac"],
            "description": f"Modern banquet hall in {city} with excellent facilities",
            "contact": {"phone": "+91 9999234567", "email": "booking@royalbanquet.com"},
            "website": "https://royalbanquet.com",
            "source": "fallback",
            "relevanceScore": 80
        },
        {
            "id": "fallback_3",
            "name": f"Garden Paradise Resort - {city}",
            "location": city,
            "type": "garden",
            "capacity": 400,
            "rating": 4.7,
            "priceRange": "₹10-15 Lakhs",
            "amenities": ["garden", "accommodation", "catering", "photography"],
            "description": f"Scenic garden resort in {city} perfect for outdoor celebrations",
            "contact": {"phone": "+91 9999345678", "email": "booking@gardenparadise.com"},
            "website": "https://gardenparadise.com",
            "source": "fallback",
            "relevanceScore": 75
        },
        {
            "id": "fallback_4",
            "name": f"Lotus Temple Complex - {city}",
            "location": city,
            "type": "temple",
            "capacity": 200,
            "rating": 4.6,
            "priceRange": "₹3-5 Lakhs",
            "amenities": ["temple", "parking", "traditional"],
            "description": f"Sacred temple venue in {city} for traditional ceremonies",
            "contact": {"phone": "+91 9999456789", "email": "booking@lotustemple.com"},
            "website": "https://lotustemple.com",
            "source": "fallback",
            "relevanceScore": 70
        },
        {
            "id": "fallback_5",
            "name": f"Majestic Resort & Spa - {city}",
            "location": city,
            "type": "resort",
            "capacity": 350,
            "rating": 4.9,
            "priceRange": "₹12-18 Lakhs",
            "amenities": ["accommodation", "spa", "catering", "pool"],
            "description": f"Luxury resort in {city} with world-class amenities",
            "contact": {"phone": "+91 9999567890", "email": "booking@majesticresort.com"},
            "website": "https://majesticresort.com",
            "source": "fallback",
            "relevanceScore": 90
        }
    ]
    
    # Filter by venue type if specified
    if venue_type != "all":
        venues = [v for v in venues if v["type"] == venue_type]
    
    return venues

if __name__ == '__main__':
    print("▶ BID AI Wedding API Service Starting...")
    print("=" * 50)
    print("⌘ API Service URL: http://localhost:5001")
    print("◊ NocoDB URL:     http://localhost:8080")
    print("◈ Frontend URL:   http://localhost:8003")
    print("=" * 50)
    print("● Available Endpoints:")
    print("   GET  /api/health           - Health check")
    print("   POST /api/wedding-data     - Save wedding form")
    print("   POST /api/visual-preferences - Save visual preferences")
    print("   GET  /api/wedding-data     - Get all wedding data")
    print("   GET  /api/couples          - Get couples")
    print("   GET  /api/venues           - Get venues") 
    print("   GET  /api/vendors          - Get vendors")
    print("=" * 50)
    print("▲ Starting API service...")
    
    app.run(debug=True, host='0.0.0.0', port=5001) 