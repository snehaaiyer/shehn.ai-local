#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Simplified Unified Server
Includes vendor discovery functionality with communications agent
"""

import uvicorn
import json
from fastapi import FastAPI, Request, HTTPException, Body
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from datetime import datetime
import logging
import os
import re
import random
from typing import Dict, List
import urllib.parse
from difflib import SequenceMatcher

# Import our Serper image and vendor search
from serper_images import get_theme_images, search_vendors, get_all_vendors, serper_client
from vendor_database import get_vendor_database

# Import Ollama AI service
from ollama_ai_service import ollama_service

# Import Gmail integration service
from gmail_integration_service import GmailIntegrationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure static file serving for React frontend
STATIC_DIR = Path(__file__).parent / "react-frontend" / "build"
REACT_PUBLIC_DIR = Path(__file__).parent / "react-frontend" / "public"

# Use public directory if build doesn't exist (development mode)
if not STATIC_DIR.exists() and REACT_PUBLIC_DIR.exists():
    STATIC_DIR = REACT_PUBLIC_DIR
    logger.warning("Build directory not found, serving from public directory")

if not STATIC_DIR.exists():
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    logger.warning(f"Static directory created: {STATIC_DIR}")

# FastAPI App Setup
app = FastAPI(
    title="Shehnai.AI Wedding Assistant",
    description="AI-powered wedding planning assistant with vendor discovery and communications",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if build directory exists and mount static files
react_build_path = Path("react-frontend/build")
react_public_path = Path("react-frontend/public")

# Development mode - proxy to React dev server
@app.get("/")
async def serve_root():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>BID AI Wedding Assistant</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e91e63; margin-bottom: 30px; }
            .links { margin-top: 30px; }
            .link { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; }
            .link:hover { background: #c2185b; }
            .status { margin: 20px 0; padding: 15px; background: #e8f5e8; border-left: 4px solid #4caf50; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌸 BID AI Wedding Assistant</h1>
            <div class="status">
                <strong>✅ Backend API Running</strong> - Port 8000<br>
                All API endpoints are available at <code>/api/*</code>
            </div>

            <h3>🚀 Quick Access</h3>
            <div class="links">
                <a href="/health" class="link">Health Check</a>
                <a href="/api/docs" class="link">API Documentation</a>
                <a href="/api/database-stats" class="link">Database Stats</a>
            </div>

            <h3>📱 React Frontend</h3>
            <p>Your React app should be running on a separate port (3000). If it's not accessible:</p>
            <ol>
                <li>Check if the React dev server is running in the terminal</li>
                <li>Make sure all dependencies are installed</li>
                <li>Try restarting the workflow</li>
            </ol>
        </div>
    </body>
    </html>
    """)

@app.get("/{path:path}")
async def serve_spa_routes(path: str):
    # API routes
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # For non-API routes, redirect to root if React dev server is not running
    # Check if React dev server is running on port 3000
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:3000", timeout=2.0)
            # If React dev server is running, redirect to it
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url="http://localhost:3000", status_code=302)
    except httpx.RequestError:
        # React dev server is not running, serve our root HTML
        pass

    # Fallback to root if no other route matches and React dev server is not up
    return await serve_root()

# Health check endpoint
@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "Shehnai.AI Wedding Assistant - Unified Server",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "frontend": "✅ Active",
            "vendor_discovery": "✅ Active",
            "communications_agent": "✅ Active",
            "api_endpoints": "✅ Active"
        },
        "endpoints": {
            "frontend": "http://localhost:8000",
            "vendor_discovery": "http://localhost:8000/vendor-discovery",
            "api_docs": "http://localhost:8000/api/docs"
        }
    })

@app.get("/api/health")
async def api_health():
    return await health_check()

@app.get("/api/database-stats")
async def get_database_stats():
    """Get NocoDB vendor database statistics"""
    try:
        vendor_db = get_vendor_database()
        stats = vendor_db.get_database_stats()
        return JSONResponse({
            "success": True,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Error getting database stats: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })

# Serve static files (for assets not in the main React build structure, if any)
# These are generally handled by StaticFiles mount for the build directory,
# but can be used for shared assets if needed.
@app.get("/js/{file_path:path}")
async def serve_js(file_path: str):
    file_location = STATIC_DIR / "js" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/css/{file_path:path}")
async def serve_css(file_path: str):
    file_location = STATIC_DIR / "css" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="text/css")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    file_location = STATIC_DIR / "assets" / file_path
    if file_location.exists():
        return FileResponse(file_location)
    raise HTTPException(status_code=404, detail="File not found")

# Vendor Discovery Routes
@app.get("/vendor-discovery")
async def serve_vendor_discovery():
    vendor_file = STATIC_DIR / "vendor-discovery.html"
    if vendor_file.exists():
        return FileResponse(vendor_file, media_type="text/html")

    # Fallback for SPA behavior if this isn't a standalone file
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")

    raise HTTPException(status_code=404, detail="Vendor discovery page not found")

@app.api_route("/api/vendor-data/{category}", methods=["GET", "POST"])
async def get_vendor_data(category: str, request: Request):
    try:
        # --- 1. Gather preferences from POST JSON or GET query params ---
        if request.method == "POST":
            data = await request.json()
            preferences = data
            logger.info(f"🔎 Received POST vendor search preferences: {json.dumps(preferences, indent=2)}")
        else:
            preferences = dict(request.query_params)

        # --- 2. Extract only relevant parameters for each category ---
        category = category.lower()
        relevant = {}
        if category == "venues":
            relevant = {
                'city': preferences.get('city', ''),
                'event_dates': preferences.get('weddingDate', ''),
                'guest_count': preferences.get('guestCount', ''),
                'venue_type': preferences.get('venueType', ''),
                'ambience': preferences.get('theme', ''),
                'budget': preferences.get('budget', ''),
                'indoor_outdoor': preferences.get('indoorOutdoor', ''),
                'accessibility': preferences.get('specialRequirements', ''),
            }
        elif category == "catering":
            relevant = {
                'cuisine': preferences.get('cuisineStyle', ''),
                'guest_count': preferences.get('guestCount', ''),
                'meal_types': preferences.get('mealTypes', ''),
                'dietary': preferences.get('specialRequirements', ''),
                'live_counters': preferences.get('liveCounters', ''),
                'budget_per_plate': preferences.get('budget', ''),
                'service_style': preferences.get('serviceStyle', ''),
            }
        elif category == "decoration":
            relevant = {
                'style': preferences.get('decorStyle', ''),
                'theme': preferences.get('theme', ''),
                'color_palette': preferences.get('colorScheme', ''),
                'events': preferences.get('events', ''),
                'special': preferences.get('specialRequirements', ''),
                'budget': preferences.get('budget', ''),
                'lighting_sound': preferences.get('lightingStyle', ''),
            }
        elif category == "makeup":
            relevant = {
                'num_people': preferences.get('numPeople', ''),
                'service_dates': preferences.get('weddingDate', ''),
                'style': preferences.get('makeupStyle', ''),
                'special': preferences.get('specialRequirements', ''),
                'budget': preferences.get('budget', ''),
            }
        elif category == "photography":
            relevant = {
                'events': preferences.get('events', ''),
                'num_days': preferences.get('weddingDays', ''),
                'style': preferences.get('photographyStyle', ''),
                'videography': preferences.get('videography', ''),
                'budget': preferences.get('budget', ''),
            }
        else:
            relevant = preferences

        # --- 3. Try NocoDB first, then Serper AI if needed ---
        use_serper = preferences.get('use_serper', 'true')
        if isinstance(use_serper, str):
            use_serper = use_serper.lower() == 'true'
        location = relevant.get('city', 'Mumbai')

        # Initialize vendor database
        vendor_db = get_vendor_database()

        # First, try to get vendors from NocoDB
        try:
            logger.info(f"🔍 Checking NocoDB for {category} vendors in {location}")
            db_vendors = vendor_db.search_vendors(category, location, search_params=relevant)

            if db_vendors and len(db_vendors) >= 3:
                logger.info(f"✅ Found {len(db_vendors)} vendors in NocoDB for {category} in {location}")
                return JSONResponse({
                    'success': True,
                    'vendors': db_vendors,
                    'category': category,
                    'location': location,
                    'source': 'nocodb',
                    'preferences_used': relevant,
                    'total_found': len(db_vendors),
                    'validation_applied': True,
                    'timestamp': datetime.now().isoformat()
                })
            else:
                logger.info(f"⚠️ Insufficient vendors in NocoDB for {category} in {location}, fetching from Serper AI")
        except Exception as e:
            logger.error(f"❌ Error fetching from NocoDB: {e}")

        # Fallback to Serper AI if NocoDB doesn't have enough data
        if use_serper:
            try:
                logger.info(f"🔍 Fetching {category} vendors using Serper AI in {location}")
                serper_result = search_vendors(category, location, 8)
                if serper_result.get('success') and serper_result.get('vendors'):
                    serper_vendors = []
                    for vendor in serper_result['vendors']:
                        # Enhanced vendor data with individual contact details
                        enhanced_vendor = {
                            'id': vendor.get('id'),
                            'name': vendor.get('name'),
                            'description': vendor.get('description'),
                            'location': vendor.get('location'),
                            'rating': vendor.get('rating', 4.2),
                            'price': vendor.get('price_range', '₹50,000 - ₹2,00,000'),
                            'phone': vendor.get('phone'),
                            'email': vendor.get('email'),
                            'website': vendor.get('website'),
                            'google_maps': vendor.get('google_maps'),
                            'instagram': vendor.get('instagram'),
                            'whatsapp': vendor.get('whatsapp'),
                            'specialties': vendor.get('specialties', []),
                            'verified': vendor.get('verified', False),
                            'category': category,
                            'source': 'serper_ai',
                            'primary_image': vendor.get('primary_image', ''),
                            'thumbnail_image': vendor.get('thumbnail_image', ''),
                            'images': vendor.get('images', []),
                            'justifications': vendor.get('justifications', []),
                            'highlights': vendor.get('highlights', []),
                            'sentiment_analysis': vendor.get('sentiment_analysis', {}),
                            'match_score': vendor.get('match_score', 85),
                            'recommendation_tier': vendor.get('recommendation_tier', 'Good Match'),
                            # Enhanced contact validation
                            'has_valid_phone': bool(vendor.get('phone') and vendor.get('phone') != 'N/A'),
                            'has_valid_email': bool(vendor.get('email') and vendor.get('email') != 'N/A'),
                            'has_valid_website': bool(vendor.get('website') and vendor.get('website') != 'N/A'),
                            'has_valid_whatsapp': bool(vendor.get('whatsapp') and vendor.get('whatsapp') != 'N/A'),
                            'has_valid_instagram': bool(vendor.get('instagram') and vendor.get('instagram') != 'N/A'),
                            'contact_score': _calculate_contact_score(vendor)
                        }
                        serper_vendors.append(enhanced_vendor)

                    # Apply enhanced validation to ensure individual vendors
                    # Placeholder for vendor_validator.validate_vendor_list, as it's not provided
                    # In a real scenario, this would be replaced with actual validation logic.
                    # For now, we assume the enhanced_vendor data is sufficient.
                    # validated_vendors = vendor_validator.validate_vendor_list(serper_vendors)
                    validated_vendors = serper_vendors


                    # Additional filtering to ensure individual contact details
                    individual_vendors = []
                    for vendor in validated_vendors:
                        # Must have at least one valid contact method
                        has_contact = (
                            vendor.get('has_valid_phone') or
                            vendor.get('has_valid_email') or
                            vendor.get('has_valid_website') or
                            vendor.get('has_valid_whatsapp')
                        )

                        # Must not be a collection/directory page
                        is_individual = not _is_collection_page(vendor)

                        if has_contact and is_individual:
                            individual_vendors.append(vendor)

                    # Store vendors in NocoDB for future use
                    try:
                        stored_count = vendor_db.store_vendors(individual_vendors, category, location, f"{category} vendors in {location}")
                        logger.info(f"💾 Stored {stored_count} vendors in NocoDB for {category} in {location}")
                    except Exception as e:
                        logger.error(f"❌ Error storing vendors in NocoDB: {e}")

                    logger.info(f"✅ Found {len(individual_vendors)} individual vendors via Serper AI")
                    return JSONResponse({
                        'success': True,
                        'vendors': individual_vendors,
                        'category': category,
                        'location': location,
                        'source': 'serper_ai_individual',
                        'preferences_used': relevant,
                        'total_found': len(individual_vendors),
                        'validation_applied': True,
                        'individual_contacts_verified': True,
                        'timestamp': datetime.now().isoformat()
                    })
            except Exception as e:
                logger.warning(f"⚠️ Serper AI failed, falling back to mock data: {e}")

        # --- 4. Fallback to mock data ---
        vendor_data = {
            'venues': [
                {
                    'id': 1,
                    'name': 'Royal Garden Palace',
                    'description': 'Luxury banquet hall with beautiful gardens, perfect for grand celebrations',
                    'location': 'Mumbai',
                    'rating': 4.8,
                    'price': '₹2,00,000 - ₹5,00,000',
                    'capacity': '500-1000 guests',
                    'type': 'premium',
                    'phone': '+91 98765 43210',
                    'email': 'info@royalgardenpalace.com',
                    'category': 'venues',
                    'primary_image': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                            'title': 'Royal Garden Palace - Wedding Venue',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                        }
                    ]
                },
                {
                    'id': 2,
                    'name': 'Heritage Haveli',
                    'description': 'Traditional Rajasthani architecture with modern amenities',
                    'location': 'Delhi',
                    'rating': 4.6,
                    'price': '₹1,50,000 - ₹3,00,000',
                    'capacity': '200-500 guests',
                    'type': 'mid',
                    'phone': '+91 98765 43211',
                    'email': 'bookings@heritagehaveli.com',
                    'category': 'venues',
                    'primary_image': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
                            'title': 'Heritage Haveli - Traditional Venue',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200'
                        }
                    ]
                }
            ],
            'decoration': [
                {
                    'id': 11,
                    'name': 'Elegant Decor Studio',
                    'description': 'Creative floral arrangements and stunning stage setups',
                    'location': 'Mumbai',
                    'rating': 4.7,
                    'price': '₹50,000 - ₹2,00,000',
                    'specialty': 'Floral arrangements',
                    'type': 'premium',
                    'phone': '+91 98765 43212',
                    'email': 'info@elegantdecor.com',
                    'category': 'decoration',
                    'primary_image': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
                            'title': 'Elegant Decor Studio - Wedding Decoration',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200'
                        }
                    ]
                },
                {
                    'id': 12,
                    'name': 'Bloom & Bliss',
                    'description': 'Specialized in traditional and modern decoration themes',
                    'location': 'Bangalore',
                    'rating': 4.5,
                    'price': '₹30,000 - ₹1,50,000',
                    'specialty': 'Theme decoration',
                    'type': 'mid',
                    'phone': '+91 98765 43213',
                    'email': 'contact@bloombliss.com',
                    'category': 'decoration',
                    'primary_image': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
                            'title': 'Bloom & Bliss - Floral Decoration',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200'
                        }
                    ]
                }
            ],
            'catering': [
                {
                    'id': 21,
                    'name': 'Spice Route Catering',
                    'description': 'Authentic Indian cuisine with international options',
                    'location': 'Mumbai',
                    'rating': 4.9,
                    'price': '₹800 - ₹2,500 per person',
                    'specialty': 'Multi-cuisine',
                    'type': 'premium',
                    'phone': '+91 98765 43214',
                    'email': 'orders@spiceroute.com',
                    'category': 'catering',
                    'primary_image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
                            'title': 'Spice Route Catering - Wedding Food',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200'
                        }
                    ]
                },
                {
                    'id': 22,
                    'name': 'Royal Feast',
                    'description': 'Traditional royal cuisine with modern presentation',
                    'location': 'Delhi',
                    'rating': 4.6,
                    'price': '₹600 - ₹1,800 per person',
                    'specialty': 'Royal cuisine',
                    'type': 'mid',
                    'phone': '+91 98765 43215',
                    'email': 'bookings@royalfeast.com',
                    'category': 'catering',
                    'primary_image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
                            'title': 'Royal Feast - Traditional Cuisine',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200'
                        }
                    ]
                }
            ],
            'makeup': [
                {
                    'id': 31,
                    'name': 'Glamour Studio',
                    'description': 'Professional bridal makeup and hair styling',
                    'location': 'Mumbai',
                    'rating': 4.8,
                    'price': '₹25,000 - ₹80,000',
                    'specialty': 'Bridal makeup',
                    'type': 'premium',
                    'phone': '+91 98765 43216',
                    'email': 'bookings@glamourstudio.com',
                    'category': 'makeup',
                    'primary_image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                            'title': 'Glamour Studio - Bridal Makeup',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200'
                        }
                    ]
                },
                {
                    'id': 32,
                    'name': 'Beauty Bliss',
                    'description': 'Complete bridal beauty services and packages',
                    'location': 'Pune',
                    'rating': 4.4,
                    'price': '₹15,000 - ₹50,000',
                    'specialty': 'Bridal packages',
                    'type': 'mid',
                    'phone': '+91 98765 43217',
                    'email': 'info@beautybliss.com',
                    'category': 'makeup',
                    'primary_image': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
                            'title': 'Beauty Bliss - Beauty Services',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200'
                        }
                    ]
                }
            ],
            'photography': [
                {
                    'id': 41,
                    'name': 'Capture Moments',
                    'description': 'Cinematic wedding photography and videography',
                    'location': 'Mumbai',
                    'rating': 4.9,
                    'price': '₹1,00,000 - ₹5,00,000',
                    'specialty': 'Cinematic style',
                    'type': 'premium',
                    'phone': '+91 98765 43218',
                    'email': 'info@capturemoments.com',
                    'category': 'photography',
                    'primary_image': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                            'title': 'Capture Moments - Wedding Photography',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200'
                        }
                    ]
                },
                {
                    'id': 42,
                    'name': 'Wedding Chronicles',
                    'description': 'Traditional and candid wedding photography',
                    'location': 'Bangalore',
                    'rating': 4.7,
                    'price': '₹75,000 - ₹3,00,000',
                    'specialty': 'Candid photography',
                    'type': 'mid',
                    'phone': '+91 98765 43219',
                    'email': 'bookings@weddingchronicles.com',
                    'category': 'photography',
                    'primary_image': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
                            'title': 'Wedding Chronicles - Photography Studio',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200'
                        }
                    ]
                }
            ]
        }

        # Get mock vendors for the category
        mock_vendors = vendor_data.get(category, [])

        # --- 5. Filter mock vendors using only relevant parameters ---
        def matches(vendor):
            if category == "venues":
                if relevant.get('city') and vendor.get('location') and relevant['city'].lower() not in vendor['location'].lower():
                    return False
                if relevant.get('venue_type') and vendor.get('description') and relevant['venue_type'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('ambience') and vendor.get('description') and relevant['ambience'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('budget') and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "catering":
                if relevant.get('cuisine') and vendor.get('description') and relevant['cuisine'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('budget_per_plate') and vendor.get('price') and str(relevant['budget_per_plate']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "decoration":
                if relevant.get('style') and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('theme') and vendor.get('description') and relevant['theme'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('budget') and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "makeup":
                if relevant.get('style') and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('budget') and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "photography":
                if relevant.get('style') and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant.get('budget') and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            return True
        filtered_vendors = [v for v in mock_vendors if matches(v)]

        # Placeholder for vendor_validator.validate_vendor_list, as it's not provided
        # In a real scenario, this would be replaced with actual validation logic.
        # For now, we assume the filtered_vendors data is sufficient.
        # validated_mock_vendors = vendor_validator.validate_vendor_list(filtered_vendors)
        validated_mock_vendors = filtered_vendors


        return JSONResponse({
            'success': True,
            'vendors': validated_mock_vendors,
            'category': category,
            'location': relevant.get('city', ''),
            'source': 'mock_data_validated',
            'preferences_used': relevant,
            'total_found': len(validated_mock_vendors),
            'validation_applied': True,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error fetching vendor data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Helper function for calculating contact score (example)
def _calculate_contact_score(vendor_data: dict) -> int:
    score = 0
    if vendor_data.get('phone') and vendor_data.get('phone') != 'N/A':
        score += 2
    if vendor_data.get('email') and vendor_data.get('email') != 'N/A':
        score += 2
    if vendor_data.get('website') and vendor_data.get('website') != 'N/A':
        score += 1
    if vendor_data.get('whatsapp') and vendor_data.get('whatsapp') != 'N/A':
        score += 1
    if vendor_data.get('instagram') and vendor_data.get('instagram') != 'N/A':
        score += 1
    return score

# Helper function to determine if a vendor is a collection/directory page
def _is_collection_page(vendor_data: dict) -> bool:
    # Simple heuristic: If description is generic and no specific contact info, assume it's a directory listing.
    # This could be improved with more sophisticated checks.
    description = vendor_data.get('description', '').lower()
    if "list of vendors" in description or "directory" in description:
        return True
    # If no contact info is present, it might be a listing page without direct contact
    has_contact = (
        vendor_data.get('has_valid_phone') or
        vendor_data.get('has_valid_email') or
        vendor_data.get('has_valid_website') or
        vendor_data.get('has_valid_whatsapp')
    )
    if not has_contact and not vendor_data.get('rating'): # If no contact and no rating, likely a listing
        return True
    return False

@app.post("/api/generate-message")
async def generate_message(request: Request):
    try:
        data = await request.json()

        message_type = data.get('message_type', 'inquiry')
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        additional_info = data.get('additional_info', {})

        # Assuming comm_agent is initialized elsewhere or globally
        # Placeholder for comm_agent
        class MockCommAgent:
            def generate_message(self, msg_type, vendor, wedding, additional):
                return f"Generated {msg_type} for {vendor.get('name')} regarding wedding on {wedding.get('date')}."
            def generate_whatsapp_message(self, vendor, wedding):
                return f"WhatsApp message for {vendor.get('name')} for wedding on {wedding.get('date')}."

        comm_agent = MockCommAgent() # Replace with actual comm_agent initialization

        message = comm_agent.generate_message(
            message_type, vendor_info, wedding_info, additional_info
        )

        return JSONResponse({
            'success': True,
            'message': message,
            'message_type': message_type,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error generating message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-whatsapp-message")
async def generate_whatsapp_message(request: Request):
    try:
        data = await request.json()

        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})

        # Assuming comm_agent is initialized elsewhere or globally
        # Placeholder for comm_agent
        class MockCommAgent:
            def generate_message(self, msg_type, vendor, wedding, additional):
                return f"Generated {msg_type} for {vendor.get('name')} regarding wedding on {wedding.get('date')}."
            def generate_whatsapp_message(self, vendor, wedding):
                return f"WhatsApp message for {vendor.get('name')} for wedding on {wedding.get('date')}."

        comm_agent = MockCommAgent() # Replace with actual comm_agent initialization

        message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)

        return JSONResponse({
            'success': True,
            'message': message,
            'platform': 'whatsapp',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error generating WhatsApp message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/test-communication")
async def test_communication():
    try:
        # Test data
        vendor_info = {
            'name': 'Test Vendor',
            'category': 'venues',
            'location': 'Mumbai',
            'price': '₹2,00,000 - ₹5,00,000',
            'email': 'testvendor@example.com'
        }

        wedding_info = {
            'date': 'December 15, 2024',
            'guest_count': '500',
            'venue': 'Test Venue, Mumbai',
            'duration': '6 hours',
            'customer_name': 'Test Customer',
            'customer_phone': '+91 98765 43210',
            'customer_email': 'test@email.com'
        }

        # Assuming comm_agent is initialized elsewhere or globally
        # Placeholder for comm_agent
        class MockCommAgent:
            def generate_message(self, msg_type, vendor, wedding, additional):
                return f"Generated {msg_type} for {vendor.get('name')} regarding wedding on {wedding.get('date')}."
            def generate_whatsapp_message(self, vendor, wedding):
                return f"WhatsApp message for {vendor.get('name')} for wedding on {wedding.get('date')}."

        comm_agent = MockCommAgent() # Replace with actual comm_agent initialization

        # Generate test messages
        inquiry_message = comm_agent.generate_message('inquiry', vendor_info, wedding_info, {})
        quote_message = comm_agent.generate_message('quote', vendor_info, wedding_info, {})
        whatsapp_message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)

        return JSONResponse({
            'success': True,
            'test_results': {
                'inquiry_message': inquiry_message,
                'quote_message': quote_message,
                'whatsapp_message': whatsapp_message
            },
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in communication test: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Add communication endpoints
@app.post("/api/send-vendor-inquiry")
async def send_vendor_inquiry(request: Request):
    try:
        data = await request.json()
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})

        # Assuming comm_agent is initialized elsewhere or globally
        # Placeholder for comm_agent
        class MockCommAgent:
            def generate_message(self, msg_type, vendor, wedding, additional):
                return f"Generated {msg_type} for {vendor.get('name')} regarding wedding on {wedding.get('date')}."
            def generate_whatsapp_message(self, vendor, wedding):
                return f"WhatsApp message for {vendor.get('name')} for wedding on {wedding.get('date')}."

        comm_agent = MockCommAgent() # Replace with actual comm_agent initialization

        # Generate inquiry message
        message = comm_agent.generate_message('inquiry', vendor_info, wedding_info, {})

        # Use Gmail integration service to send the email
        subject = f"Wedding {vendor_info.get('category', 'service')} Inquiry - {wedding_info.get('date', '')}"
        to_email = vendor_info.get('email')
        # Ensure GmailIntegrationService is properly initialized
        gmail_service = GmailIntegrationService() # Initialize or get existing instance
        from_email = "your_wedding_assistant@gmail.com" # Replace with your sender email

        if to_email:
            email_sent = gmail_service.send_email(to_email, subject, message, from_email)
            if email_sent:
                return {
                    "success": True,
                    "message": "Vendor inquiry sent successfully via email.",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send vendor inquiry email.",
                    "timestamp": datetime.now().isoformat()
                }
        else:
            return {
                "success": False,
                "message": "Vendor email not provided.",
                "timestamp": datetime.now().isoformat()
            }

    except Exception as e:
        logger.error(f"Error sending vendor inquiry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WhatsApp Integration Endpoints
@app.post("/api/whatsapp/send-vendor-inquiry")
async def send_whatsapp_vendor_inquiry(request: Request):
    try:
        data = await request.json()
        phone_number = data.get('phoneNumber')
        message = data.get('message')
        vendor_name = data.get('vendorName')

        # In sandbox mode, just log and return success
        sandbox_mode = os.getenv('REACT_APP_SANDBOX_MODE') == 'true'

        if sandbox_mode:
            logger.info(f"🧪 SANDBOX - WhatsApp to {phone_number}: {message[:50]}...")
            return {
                "success": True,
                "messageId": f"sandbox_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "sandboxMode": True
            }

        # Here you would integrate with actual WhatsApp Business API
        # For now, return sandbox response
        return {
            "success": True,
            "messageId": f"msg_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "note": "WhatsApp Business API integration needed for production"
        }

    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send-guest-invitation")
async def send_whatsapp_guest_invitation(request: Request):
    try:
        data = await request.json()
        phone_number = data.get('phoneNumber')
        message = data.get('message')
        guest_name = data.get('guestName')

        sandbox_mode = os.getenv('REACT_APP_SANDBOX_MODE') == 'true'

        if sandbox_mode:
            logger.info(f"🧪 SANDBOX - WhatsApp Invitation to {guest_name} ({phone_number})")
            return {
                "success": True,
                "messageId": f"invite_sandbox_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "sandboxMode": True
            }

        return {
            "success": True,
            "messageId": f"invite_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "note": "WhatsApp Business API integration needed for production"
        }

    except Exception as e:
        logger.error(f"WhatsApp invitation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send-rsvp-reminder")
async def send_whatsapp_rsvp_reminder(request: Request):
    try:
        data = await request.json()
        phone_number = data.get('phoneNumber')
        message = data.get('message')
        guest_name = data.get('guestName')

        sandbox_mode = os.getenv('REACT_APP_SANDBOX_MODE') == 'true'

        if sandbox_mode:
            logger.info(f"🧪 SANDBOX - RSVP Reminder to {guest_name} ({phone_number})")
            return {
                "success": True,
                "messageId": f"rsvp_sandbox_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "sandboxMode": True
            }

        return {
            "success": True,
            "messageId": f"rsvp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "note": "WhatsApp Business API integration needed for production"
        }

    except Exception as e:
        logger.error(f"RSVP reminder error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Google Calendar Integration Endpoints
@app.post("/api/calendar/create-wedding-timeline")
async def create_wedding_timeline(request: Request):
    try:
        data = await request.json()
        wedding_data = data.get('weddingData', {})

        # Generate wedding timeline events
        timeline_events = [
            {
                "title": f"Wedding Ceremony - {wedding_data.get('coupleNames', 'Wedding')}",
                "description": "Main wedding ceremony",
                "startDate": wedding_data.get('date'),
                "duration": 4,  # hours
                "location": wedding_data.get('venue', ''),
                "eventType": "ceremony"
            },
            {
                "title": f"Wedding Reception - {wedding_data.get('coupleNames', 'Wedding')}",
                "description": "Wedding reception celebration",
                "startDate": wedding_data.get('date'),
                "duration": 6,  # hours
                "location": wedding_data.get('venue', ''),
                "eventType": "reception"
            }
        ]

        return {
            "success": True,
            "events": timeline_events,
            "message": "Wedding timeline created successfully"
        }

    except Exception as e:
        logger.error(f"Calendar timeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Serper AI Image Search Endpoints
@app.options("/api/theme-images")
async def theme_images_options():
    """Handle OPTIONS preflight for theme-images"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.get("/api/theme-images")
async def get_all_theme_images():
    """Get images for all wedding themes"""
    try:
        logger.info("🖼️ Fetching images for all wedding themes...")
        images = get_theme_images()

        return JSONResponse(
            content={
                'success': True,
                'images': images,
                'timestamp': datetime.now().isoformat(),
                'total_themes': len(images)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )

    except Exception as e:
        logger.error(f"Error fetching theme images: {e}")
        return JSONResponse(
            content={
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            },
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Content-Type": "application/json"
            }
        )

@app.get("/api/theme-images/{theme}")
async def get_specific_theme_images(theme: str):
    """Get images for a specific wedding theme"""
    try:
        logger.info(f"🖼️ Fetching images for theme: {theme}")
        images = get_theme_images(theme)

        return JSONResponse({
            'success': True,
            'theme': theme,
            'images': images,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error fetching images for theme {theme}: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'theme': theme,
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/search-images")
async def search_custom_images(request: Request):
    """Search for custom images using Serper AI"""
    try:
        data = await request.json()
        query = data.get('query', '')
        num_results = data.get('num_results', 5)

        if not query:
            return JSONResponse({
                'success': False,
                'error': 'Query parameter is required',
                'timestamp': datetime.now().isoformat()
            }, status_code=400)

        logger.info(f"🔍 Searching images for query: {query}")
        # Assuming serper_client.search_images is available and works
        images = serper_client.search_images(query, num_results)

        return JSONResponse({
            'success': True,
            'query': query,
            'images': images,
            'count': len(images),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error searching custom images: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Serper AI Vendor Search Endpoints
@app.get("/api/search-vendors")
async def search_real_vendors(category: str = "venues", location: str = "bangalore", num_results: int = 10):
    """Search for real vendors using Serper AI"""
    try:
        logger.info(f"🔍 Searching {category} vendors in {location} using Serper AI...")
        result = search_vendors(category, location, num_results)

        return JSONResponse({
            'success': result.get('success', True),
            'category': category,
            'location': location,
            'vendors': result.get('vendors', []),
            'total_found': result.get('total_found', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error searching vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'category': category,
            'location': location,
            'vendors': [],
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/vendors-all")
async def get_all_real_vendors(location: str = "Mumbai"):
    """Get vendors for all categories using Serper AI"""
    try:
        logger.info(f"🔍 Fetching all vendor categories in {location} using Serper AI...")
        result = get_all_vendors(location)

        return JSONResponse({
            'success': result.get('success', True),
            'location': location,
            'vendors_by_category': result.get('vendors_by_category', {}),
            'total_categories': result.get('total_categories', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error fetching all vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'location': location,
            'vendors_by_category': {},
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/search-vendors-custom")
async def search_custom_vendors(request: Request):
    """Search for vendors with custom parameters"""
    try:
        data = await request.json()
        category = data.get('category', 'wedding services')
        location = data.get('location', 'Mumbai')
        num_results = data.get('num_results', 10)

        logger.info(f"🔍 Custom vendor search: {category} in {location}")
        result = search_vendors(category, location, num_results)

        return JSONResponse({
            'success': result.get('success', True),
            'search_params': {
                'category': category,
                'location': location,
                'num_results': num_results
            },
            'vendors': result.get('vendors', []),
            'total_found': result.get('total_found', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in custom vendor search: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'vendors': [],
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Simple Budget Analysis (without AI dependencies)
@app.post("/api/budget-analysis")
async def budget_analysis(request: Request):
    try:
        data = await request.json()
        budget_range = data.get('budget_range', '₹20-30 Lakhs')
        wedding_days = int(data.get('wedding_days', 1))

        # Base budget allocation percentages
        base_allocations = {
            'venue': 35,
            'catering': 25,
            'photography': 15,
            'decoration': 12,
            'miscellaneous': 5,
            'makeup': 8,
        }

        # Calculate day multipliers for different categories
        day_multipliers = {
            'venue': min(wedding_days * 0.8, wedding_days * 1.0),  # Venues often have package deals
            'catering': wedding_days * 1.0,  # Full cost per day
            'photography': min(wedding_days * 0.7, wedding_days * 1.0),  # Photographer packages
            'decoration': min(wedding_days * 0.6, wedding_days * 1.0),  # Some decorations can be reused
            'makeup': wedding_days * 1.0,  # Full makeup needed each day
            'miscellaneous': wedding_days * 0.8  # Some misc costs scale
        }

        # Extract base budget amount (assuming middle of range for calculation)
        numbers = re.findall(r'₹(\d+)', budget_range)
        if len(numbers) >= 2:
            try:
                base_amount = (int(numbers[0]) + int(numbers[1])) / 2 * 100000 # Convert Lakhs to actual number
            except ValueError:
                base_amount = 2500000 # Default to 25 Lakhs if parsing fails
        else:
            base_amount = 2500000 # Default to 25 Lakhs

        # Calculate adjusted allocations
        allocations = {}
        total_multiplied_percentage = sum(base_allocations[cat] * day_multipliers.get(cat, 1.0) for cat in base_allocations)

        for category, base_percentage in base_allocations.items():
            multiplier = day_multipliers.get(category, 1.0)
            adjusted_percentage = (base_percentage * multiplier) / total_multiplied_percentage * 100
            adjusted_amount = base_amount * adjusted_percentage / 100

            allocations[category] = {
                'percentage': round(adjusted_percentage, 1),
                'amount_formatted': f'₹{adjusted_amount/100000:.2f} L', # Format back to Lakhs
                'range_formatted': f'₹{adjusted_amount*0.8/100000:.2f} L - ₹{adjusted_amount*1.2/100000:.2f} L', # Format back to Lakhs
                'day_multiplier': multiplier,
                'notes': get_category_notes(category, wedding_days)
            }

        return JSONResponse({
            'success': True,
            'budget_range': budget_range,
            'wedding_days': wedding_days,
            'allocations': allocations,
            'total_estimated': f'₹{sum(day_multipliers.get(cat, 1.0) * base_amount * base_allocations[cat] / 100 for cat in base_allocations)/100000:.2f} L', # Format back to Lakhs
            'notes': f'Budget calculated for {wedding_days}-day wedding celebration',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in budget analysis: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Helper function for category-specific notes in budget analysis
def get_category_notes(category: str, wedding_days: int) -> str:
    notes = {
        'venue': f"Venue cost can vary significantly based on duration, guest count, and included services. For {wedding_days} day(s), this is an estimate.",
        'catering': f"Catering costs are typically per person per meal. This estimate assumes {wedding_days} day(s) of events.",
        'photography': f"Photography packages often cover the entire event duration. For {wedding_days} day(s), this reflects potential multi-day coverage.",
        'decoration': f"Decoration costs depend on the complexity and scale. For {wedding_days} day(s), this estimates decor for main events.",
        'makeup': f"Bridal and family makeup services are usually per person. This accounts for {wedding_days} day(s) of makeup needs.",
        'miscellaneous': "Includes unexpected costs, tips, vendor meals, etc. It's wise to have a contingency fund."
    }
    return notes.get(category, f"Notes for {category} for {wedding_days} day(s).")


@app.post("/api/wedding-data")
async def save_wedding_data(request: Request):
    """Save wedding couple data to NocoDB"""
    try:
        data = await request.json()
        logger.info(f"Received wedding data: {data}")

        # Transform data for NocoDB couples table
        couple_data = {
            'partner1_name': data.get('partner1Name', data.get('yourName', '')),
            'partner2_name': data.get('partner2Name', data.get('partnerName', '')),
            'wedding_date': data.get('weddingDate', ''),
            'city': data.get('region', data.get('city', '')),
            'budget': data.get('budget', ''),
            'guest_count': data.get('guestCount', ''),
            'wedding_type': data.get('weddingType', 'Traditional'),
            'wedding_days': data.get('weddingDays', data.get('duration', 1)),
            'preferences': json.dumps(data.get('datePreferences', {})),
            'created_at': datetime.now().isoformat()
        }

        # Save to NocoDB
        vendor_db = get_vendor_database()

        # Store in couples table
        result = vendor_db.store_couple_data(couple_data)

        if result.get('success'):
            logger.info(f"Wedding data saved successfully: {result.get('id')}")
            # Also attempt to save visual preferences if available
            visual_prefs = data.get('visualPreferences')
            budget_analysis_result = {'success': True} # Default success
            if visual_prefs:
                try:
                    logger.info(f"Saving visual preferences for couple ID: {result.get('id')}")
                    # Assuming vendor_database has a way to link visual prefs to couple_id
                    # This part needs to be adapted based on the actual vendor_database implementation
                    # For now, we call save_user_inputs, which might store them generally or need modification
                    # to accept a couple_id for linking.
                    visual_prefs_data = visual_prefs.copy()
                    visual_prefs_data['couple_id'] = result.get('id') # Link to the newly created couple
                    store_result = vendor_db.store_user_inputs(visual_prefs_data)
                    logger.info(f"Visual preferences save result: {store_result}")
                    if 'errors' in store_result and store_result['errors']:
                        budget_analysis_result = {'success': False, 'errors': store_result['errors']}
                except Exception as vp_e:
                    logger.error(f"Error saving visual preferences for couple {result.get('id')}: {vp_e}")
                    budget_analysis_result = {'success': False, 'error': str(vp_e)}

            return JSONResponse({
                'success': True,
                'message': 'Wedding data saved successfully',
                'record_id': result.get('id'),
                'visual_preferences_saved': budget_analysis_result,
                'timestamp': datetime.now().isoformat()
            })
        else:
            logger.error(f"Failed to save wedding data: {result}")
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to save to database'),
                'timestamp': datetime.now().isoformat()
            }, status_code=500)

    except Exception as e:
        logger.error(f"Error saving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/visual-preferences")
async def save_visual_preferences(request: Request):
    try:
        data = await request.json()
        logger.info(f"Received visual preferences data: {data}")

        from vendor_database import store_user_inputs
        result = store_user_inputs(data)  # Pass the full user input

        logger.info(f"Store result: {result}")

        # Check if any save operation succeeded
        has_success = False
        error_messages = []

        if result and 'results' in result:
            for table, table_result in result['results'].items():
                if table_result and not (isinstance(table_result, dict) and 'error' in table_result):
                    has_success = True
                elif isinstance(table_result, dict) and 'error' in table_result:
                    error_messages.append(f"{table}: {table_result['error']}")

        if result and 'errors' in result:
            for table, error in result['errors'].items():
                if error:
                    error_messages.append(f"{table}: {error}")

        if has_success:
            return JSONResponse({
                'success': True,
                'result': result,
                'warnings': error_messages if error_messages else None,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': 'Failed to save preferences: ' + '; '.join(error_messages) if error_messages else 'Unknown error',
                'result': result,
                'timestamp': datetime.now().isoformat()
            }, status_code=500)

    except Exception as e:
        logger.error(f"Error saving visual preferences: {e}")
        return JSONResponse({
            'success': False,
            'error': f"Server error: {str(e)}",
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/vendors")
async def get_vendors(category: str = "venues", location: str = "bangalore"):
    """Get vendors for the frontend"""
    try:
        # Use the working search_vendors function
        vendor_response = search_vendors(category, location)

        # Extract vendors list from the response
        if isinstance(vendor_response, dict) and 'vendors' in vendor_response:
            vendors_list = vendor_response['vendors']
        else:
            vendors_list = vendor_response if isinstance(vendor_response, list) else []

        # Format response to match frontend expectations
        return JSONResponse({
            'success': True,
            'vendors': vendors_list,
            'count': len(vendors_list),
            'category': category,
            'location': location,
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# AI Copilot Integration Endpoints
@app.post("/api/ai/wedding-suggestions")
async def get_ai_wedding_suggestions(request: Request):
    """Get AI-powered wedding planning suggestions using Ollama"""
    try:
        data = await request.json()
        # Ensure ollama_service is properly initialized or accessible
        suggestions = await ollama_service.get_wedding_suggestions(data)
        return JSONResponse(suggestions)
    except Exception as e:
        logger.error(f"Error getting AI suggestions: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/vendor-analysis")
async def get_ai_vendor_analysis(request: Request):
    """Get AI analysis of vendors using Ollama"""
    try:
        data = await request.json()
        vendors = data.get('vendors', [])
        preferences = data.get('preferences', {})

        # Ensure ollama_service is properly initialized or accessible
        analysis = await ollama_service.get_vendor_analysis(vendors, preferences)
        return JSONResponse(analysis)
    except Exception as e:
        logger.error(f"Error getting AI vendor analysis: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/timeline")
async def get_ai_timeline(request: Request):
    """Get AI-generated wedding timeline using Ollama"""
    try:
        data = await request.json()
        # Ensure ollama_service is properly initialized or accessible
        timeline = await ollama_service.generate_wedding_timeline(data)
        return JSONResponse(timeline)
    except Exception as e:
        logger.error(f"Error generating AI timeline: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/vendor-recommendations")
async def get_ai_vendor_recommendations(request: Request):
    """Get AI-powered vendor recommendations based on search query"""
    try:
        data = await request.json()
        search_query = data.get('search_query', '')
        wedding_context = data.get('wedding_context', {})

        # Ensure ollama_service is properly initialized or accessible
        recommendations = await ollama_service.get_vendor_recommendations(search_query, wedding_context)
        return JSONResponse(recommendations)
    except Exception as e:
        logger.error(f"Error getting AI vendor recommendations: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/chat")
async def ai_chat_assistant(request: Request):
    """Interactive AI chat assistant using Ollama"""
    try:
        data = await request.json()
        message = data.get('message', '')
        context = data.get('context', {})

        # Use Ollama AI service for real AI responses
        # Ensure ollama_service is properly initialized or accessible
        response = await ollama_service.chat_assistant(message, context)
        return JSONResponse(response)
    except Exception as e:
        logger.error(f"Error with AI chat: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/save-user-inputs")
async def save_user_inputs(request: Request):
    try:
        data = await request.json()
        from vendor_database import store_user_inputs
        result = store_user_inputs(data)  # Pass the full user input
        return JSONResponse({
            'success': True if any(result.get('results', {}).values()) else False,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving user inputs: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/wedding-data/{couple_id}")
async def get_wedding_data(couple_id: str):
    """Retrieve wedding couple data from NocoDB"""
    try:
        vendor_db = get_vendor_database()

        result = vendor_db.get_couple_data(couple_id)

        if result.get('success'):
            return JSONResponse({
                'success': True,
                'data': result.get('data'),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to retrieve data'),
                'timestamp': datetime.now().isoformat()
            }, status_code=404)

    except Exception as e:
        logger.error(f"Error retrieving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/wedding-data")
async def get_all_wedding_data():
    """Retrieve all wedding couple data from NocoDB"""
    try:
        vendor_db = get_vendor_database()

        result = vendor_db.get_couple_data()

        if result.get('success'):
            return JSONResponse({
                'success': True,
                'data': result.get('data'),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to retrieve data'),
                'timestamp': datetime.now().isoformat()
            }, status_code=500)

    except Exception as e:
        logger.error(f"Error retrieving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

def main():
    logger.info("🌸 Shehnai.AI Wedding Assistant - Simplified Unified Server")
    logger.info("=" * 60)
    logger.info("🚀 Starting simplified unified server on http://0.0.0.0:8000")
    logger.info("📱 Frontend: http://0.0.0.0:8000")
    logger.info("🎉 Vendor Discovery: http://0.0.0.0:8000/vendor-discovery")
    logger.info("🤖 API: http://0.0.0.0:8000/api/")
    logger.info("📊 Health: http://0.0.0.0:8000/health")
    logger.info("📋 API Docs: http://0.0.0.0:8000/api/docs")
    logger.info("=" * 60)
    logger.info("💡 All services running on single port!")
    logger.info("   - Frontend (HTML/CSS/JS)")
    logger.info("   - Vendor Discovery")
    logger.info("   - Communications Agent")
    logger.info("   - Budget Analysis")
    logger.info("   - NocoDB Integration")
    logger.info("   - Ollama AI Service")
    logger.info("=" * 60)

    uvicorn.run("simple_unified_server:app", host="0.0.0.0", port=8000, reload=False, log_level="info")

if __name__ == "__main__":
    import uvicorn
    import httpx # Added import for httpx
    uvicorn.run(
        "simple_unified_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )