#!/usr/bin/env python3
"""
Simplified test app for enhanced Serper API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from enhanced_serper_api import EnhancedSerperAPI

app = Flask(__name__)
CORS(app)

# Initialize enhanced Serper API
serper_api = EnhancedSerperAPI()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Enhanced Serper API Test Server",
        "timestamp": "2024-07-19T11:00:00Z"
    })

@app.route('/api/test-vendor-search', methods=['POST'])
def test_vendor_search():
    """Test the enhanced vendor search functionality"""
    try:
        data = request.json
        category = data.get('category', 'venues')
        location = data.get('location', 'Mumbai')
        budget_range = data.get('budget_range', [200000, 800000])
        guest_count = data.get('guest_count', 300)
        wedding_theme = data.get('wedding_theme', 'Royal Palace Wedding')
        max_results = data.get('max_results', 10)
        
        print(f"🔍 Testing vendor search: {category} in {location}")
        
        # Use the enhanced Serper API
        results = serper_api.search_wedding_vendors(
            category=category,
            location=location,
            budget_range=tuple(budget_range),
            guest_count=guest_count,
            wedding_theme=wedding_theme,
            max_results=max_results
        )
        
        return jsonify({
            "success": True,
            "test_type": "enhanced_serper_api",
            "search_params": {
                "category": category,
                "location": location,
                "budget_range": budget_range,
                "guest_count": guest_count,
                "wedding_theme": wedding_theme,
                "max_results": max_results
            },
            "results": results
        })
        
    except Exception as e:
        print(f"❌ Error in test vendor search: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "test_type": "enhanced_serper_api"
        }), 500

@app.route('/api/test-venue-search', methods=['POST'])
def test_venue_search():
    """Test the specialized venue search"""
    try:
        data = request.json
        location = data.get('location', 'Mumbai')
        budget_range = data.get('budget_range', [200000, 1000000])
        guest_count = data.get('guest_count', 300)
        venue_type = data.get('venue_type', 'banquet')
        amenities = data.get('amenities', ['parking', 'accommodation'])
        max_results = data.get('max_results', 15)
        
        print(f"🏰 Testing venue search: {venue_type} in {location}")
        
        # Use the enhanced venue search
        results = serper_api.search_wedding_venues(
            location=location,
            budget_range=tuple(budget_range),
            guest_count=guest_count,
            venue_type=venue_type,
            amenities=amenities,
            max_results=max_results
        )
        
        return jsonify({
            "success": True,
            "test_type": "enhanced_venue_search",
            "search_params": {
                "location": location,
                "budget_range": budget_range,
                "guest_count": guest_count,
                "venue_type": venue_type,
                "amenities": amenities,
                "max_results": max_results
            },
            "results": results
        })
        
    except Exception as e:
        print(f"❌ Error in test venue search: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "test_type": "enhanced_venue_search"
        }), 500

@app.route('/api/test-photography-search', methods=['POST'])
def test_photography_search():
    """Test the specialized photography search"""
    try:
        data = request.json
        location = data.get('location', 'Delhi')
        budget_range = data.get('budget_range', [50000, 200000])
        style_preference = data.get('style_preference', 'candid')
        services_needed = data.get('services_needed', ['pre-wedding', 'engagement'])
        max_results = data.get('max_results', 10)
        
        print(f"📸 Testing photography search: {style_preference} in {location}")
        
        # Use the enhanced photography search
        results = serper_api.search_wedding_photographers(
            location=location,
            budget_range=tuple(budget_range),
            style_preference=style_preference,
            services_needed=services_needed,
            max_results=max_results
        )
        
        return jsonify({
            "success": True,
            "test_type": "enhanced_photography_search",
            "search_params": {
                "location": location,
                "budget_range": budget_range,
                "style_preference": style_preference,
                "services_needed": services_needed,
                "max_results": max_results
            },
            "results": results
        })
        
    except Exception as e:
        print(f"❌ Error in test photography search: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "test_type": "enhanced_photography_search"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print(f"🚀 Starting Enhanced Serper API Test Server on port {port}")
    print(f"📋 Available endpoints:")
    print(f"   GET  /api/health")
    print(f"   POST /api/test-vendor-search")
    print(f"   POST /api/test-venue-search")
    print(f"   POST /api/test-photography-search")
    app.run(host='0.0.0.0', port=port, debug=True) 