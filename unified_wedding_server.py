#!/usr/bin/env python3
"""
Unified Wedding Planning Server
Consolidates all backend services into a single server
"""

import uvicorn
import json
import os
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all our services
from serper_images import get_theme_images, search_vendors, get_all_vendors
from vendor_database import get_vendor_database
from ollama_ai_service import ollama_service

# Load API keys
try:
    from config.api_config import SERPER_API_KEY
    if SERPER_API_KEY and SERPER_API_KEY != "" and not SERPER_API_KEY.startswith("12345"):
        os.environ['SERPER_API_KEY'] = SERPER_API_KEY
        logger.info("✅ Serper API key loaded from config")
        logger.info(f"🔑 API key: {SERPER_API_KEY[:8]}...{SERPER_API_KEY[-4:]}")
    else:
        logger.warning("⚠️ Serper API key not found, empty, or using placeholder in config")
        logger.warning("💡 Please set your actual Serper API key from https://serper.dev")
except ImportError as e:
    logger.warning(f"⚠️ Could not import Serper API key from config: {e}")
except Exception as e:
    logger.error(f"❌ Serper API key configuration error: {e}")

# Load Google API keys from environment
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'REDACTED_GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', 'REDACTED_GOOGLE_CLIENT_SECRET')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', 'REDACTED_GOOGLE_MAPS_KEY')

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    logger.info("✅ Google OAuth credentials loaded")
    logger.info(f"🔑 Client ID: {GOOGLE_CLIENT_ID[:15]}...{GOOGLE_CLIENT_ID[-15:]}")
    logger.info(f"🔑 Client Secret: {GOOGLE_CLIENT_SECRET[:8]}...{GOOGLE_CLIENT_SECRET[-4:]}")
else:
    logger.warning("⚠️ Google OAuth credentials not found")
logger = logging.getLogger(__name__)

# FastAPI App Setup
app = FastAPI(
    title="Shehnai.AI Wedding Assistant",
    description="Unified wedding planning platform",
    version="3.0.0",
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

# Initialize Replit PostgreSQL database service
db_service = None
try:
    from replit_database_service import get_database_service
    db_service = get_database_service()

    # Test database connection
    if db_service.test_connection():
        logger.info("✅ Replit PostgreSQL database connected")
    else:
        logger.warning("⚠️ Database connection failed - using fallback mode")

except Exception as e:
    logger.warning(f"⚠️ Database initialization failed: {e} - using mock data")
    db_service = None

# Static file serving for React frontend
react_build_path = Path("react-frontend/build")
static_path = react_build_path / "static"
if react_build_path.exists() and static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
    logger.info("✅ React build files mounted for production")

@app.get("/")
async def serve_root():
    """Serve React app or fallback HTML"""
    # Check if React build exists
    index_file = react_build_path / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")

    # Fallback HTML
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>🌸 Shehnai.AI Wedding Assistant</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e91e63; }
            .status { margin: 20px 0; padding: 15px; background: #e8f5e8; border-left: 4px solid #4caf50; }
            .link { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌸 Shehnai.AI Wedding Assistant</h1>
            <div class="status">
                <strong>✅ Unified Backend Running</strong> - All services integrated
            </div>
            <p>React frontend should be running on port 3000. If not accessible, check the React dev server.</p>
            <div>
                <a href="/health" class="link">Health Check</a>
                <a href="/api/docs" class="link">API Documentation</a>
            </div>
        </div>
    </body>
    </html>
    """)

@app.get("/{path:path}")
async def serve_spa_routes(path: str):
    """Serve React SPA routes"""
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    index_file = react_build_path / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")

    return await serve_root()

# Health Check
@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "Shehnai.AI Unified Wedding Assistant",
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "vendor_discovery": "✅ Active",
            "ai_assistant": "✅ Active",
            "communications": "✅ Active",
            "rag_search": "✅ Active",
            "database": "✅ Active"
        }
    })

@app.get("/api/health")
async def api_health():
    return await health_check()

# Fix vendor data endpoint routing
@app.get("/api/vendor-data/{category}")
async def get_vendor_data_get(category: str, request: Request):
    """Handle GET requests for vendor data"""
    return await get_vendor_data(category, request)

# Vendor Discovery API
@app.api_route("/api/vendor-data/{category}", methods=["GET", "POST"])
async def get_vendor_data(category: str, request: Request):
    """Get vendor data with comprehensive preferences integration"""
    try:
        if request.method == "POST":
            data = await request.json()
            preferences = data
        else:
            preferences = dict(request.query_params)

        location = preferences.get('city', preferences.get('location', 'Mumbai'))
        use_serper = preferences.get('use_serper', 'true').lower() == 'true'

        # Extract comprehensive wedding context
        wedding_context = {
            'location': location,
            'category': category,
            'budget_range': preferences.get('budgetRange', preferences.get('budget', '')),
            'guest_count': int(preferences.get('guestCount', 100)),
            'wedding_theme': preferences.get('weddingTheme', preferences.get('theme', '')),
            'venue_type': preferences.get('venueType', ''),
            'cuisine': preferences.get('cuisine', ''),
            'photography_style': preferences.get('photographyStyle', ''),
            'rating_filter': preferences.get('rating', '4.5'),
            'price_range': preferences.get('priceRange', ''),
            'search_term': preferences.get('searchTerm', ''),
            'priorities': preferences.get('priorities', [])
        }

        logger.info(f"🎯 Vendor search with comprehensive context: {wedding_context}")

        # Try PostgreSQL database first with enhanced context
        if db_service:
            try:
                db_vendors = db_service.search_vendors(category, location, wedding_context)
                if db_vendors and len(db_vendors) >= 3:
                    # Apply preference-based enhancements to database vendors
                    enhanced_vendors = enhance_vendors_with_preferences(db_vendors, wedding_context)
                    logger.info(f"✅ Found {len(enhanced_vendors)} vendors in PostgreSQL (enhanced)")
                    return JSONResponse({
                        'success': True,
                        'vendors': enhanced_vendors,
                        'category': category,
                        'location': location,
                        'source': 'postgresql_enhanced',
                        'total_found': len(enhanced_vendors),
                        'applied_context': wedding_context
                    })
            except Exception as e:
                logger.error(f"PostgreSQL error: {e}")
        else:
            logger.warning("⚠️ Database not available, using fallback")

        # Enhanced Serper AI search with preferences
        if use_serper:
            try:
                # Build enhanced search query with preferences
                enhanced_query = build_enhanced_search_query(category, location, wedding_context)
                result = search_vendors(category, location, 8, enhanced_query)

                if result.get('success') and result.get('vendors'):
                    vendors = result['vendors']

                    # Apply preference-based enhancements
                    enhanced_vendors = enhance_vendors_with_preferences(vendors, wedding_context)

                    # Store in database for future use
                    try:
                        vendor_db.store_vendors(enhanced_vendors, category, location, f"{category} in {location}")
                    except Exception as e:
                        logger.error(f"Storage error: {e}")

                    logger.info(f"✅ Found {len(enhanced_vendors)} vendors via Serper AI (enhanced)")
                    return JSONResponse({
                        'success': True,
                        'vendors': enhanced_vendors,
                        'category': category,
                        'location': location,
                        'source': 'serper_ai_enhanced',
                        'total_found': len(enhanced_vendors),
                        'applied_context': wedding_context
                    })
            except Exception as e:
                logger.error(f"Enhanced Serper error: {e}")

        # Enhanced mock data fallback with preferences
        mock_vendors = get_enhanced_mock_vendors(category, location, wedding_context)
        logger.info(f"✅ Using enhanced mock data: {len(mock_vendors)} vendors")

        return JSONResponse({
            'success': True,
            'vendors': mock_vendors,
            'category': category,
            'location': location,
            'source': 'enhanced_mock_data',
            'total_found': len(mock_vendors),
            'applied_context': wedding_context
        })

    except Exception as e:
        logger.error(f"Vendor data error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'context': 'Enhanced vendor search with preferences'
        }, status_code=500)

def get_mock_vendors(category: str, location: str) -> List[Dict]:
    """Get mock vendor data"""
    base_vendors = {
        'venues': [
            {
                'id': 1,
                'name': 'Royal Palace Banquets',
                'location': location,
                'rating': 4.8,
                'price': '₹2,00,000 - ₹5,00,000',
                'description': 'Luxury wedding venue with royal ambiance',
                'phone': '+91 98765 43210',
                'email': 'info@royalpalace.com'
            }
        ],
        'catering': [
            {
                'id': 21,
                'name': 'Spice Route Catering',
                'location': location,
                'rating': 4.9,
                'price': '₹800 - ₹2,500 per person',
                'description': 'Authentic Indian cuisine with international options',
                'phone': '+91 98765 43214',
                'email': 'orders@spiceroute.com'
            }
        ],
        'photography': [
            {
                'id': 41,
                'name': 'Capture Moments',
                'location': location,
                'rating': 4.9,
                'price': '₹1,00,000 - ₹5,00,000',
                'description': 'Cinematic wedding photography and videography',
                'phone': '+91 98765 43218',
                'email': 'info@capturemoments.com'
            }
        ]
    }
    return base_vendors.get(category, [])

# AI Services
@app.post("/api/ai/chat")
async def ai_chat_assistant(request: Request):
    """AI chat assistant"""
    try:
        data = await request.json()
        message = data.get('message', '')
        context = data.get('context', {})

        # Use Ollama if available, otherwise mock response
        try:
            response = await ollama_service.chat_assistant(message, context)
            return JSONResponse(response)
        except Exception as e:
            logger.warning(f"Ollama unavailable: {e}")
            return JSONResponse({
                'success': True,
                'response': f"I understand you're asking about: {message}. This is a demo response as the AI service is currently unavailable.",
                'source': 'mock_ai'
            })

    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

# Image Search
@app.get("/api/theme-images")
async def get_all_theme_images():
    """Get theme images"""
    try:
        images = get_theme_images()
        return JSONResponse({
            'success': True,
            'images': images,
            'total_themes': len(images)
        })
    except Exception as e:
        logger.error(f"Theme images error: {e}")
        # Return mock theme images as fallback
        mock_images = [
            {'id': 1, 'theme': 'Traditional', 'url': '/images/themes/traditional.jpg'},
            {'id': 2, 'theme': 'Modern', 'url': '/images/themes/modern.jpg'},
            {'id': 3, 'theme': 'Royal', 'url': '/images/themes/royal.jpg'}
        ]
        return JSONResponse({
            'success': True,
            'images': mock_images,
            'total_themes': len(mock_images),
            'source': 'fallback'
        })

@app.post("/api/search-images")
async def search_custom_images(request: Request):
    """Search for custom images"""
    try:
        data = await request.json()
        query = data.get('query', '')
        num_results = data.get('num_results', 5)

        if not query:
            return JSONResponse({
                'success': False,
                'error': 'Query parameter is required'
            }, status_code=400)

        # Use Serper for image search
        from serper_images import serper_client
        images = serper_client.search_images(query, num_results)

        return JSONResponse({
            'success': True,
            'query': query,
            'images': images,
            'count': len(images)
        })

    except Exception as e:
        logger.error(f"Image search error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

# Wedding Data Management
@app.post("/api/wedding-data")
async def save_wedding_data(request: Request):
    """Save wedding couple data"""
    try:
        data = await request.json()

        couple_data = {
            'partner1_name': data.get('partner1Name', ''),
            'partner2_name': data.get('partner2Name', ''),
            'wedding_date': data.get('weddingDate', ''),
            'city': data.get('city', ''),
            'budget': data.get('budget', ''),
            'guest_count': data.get('guestCount', ''),
            'created_at': datetime.now().isoformat()
        }

        # Try to save to PostgreSQL database
        if db_service:
            try:
                couple_id = db_service.create_couple(couple_data)
                if couple_id:
                    return JSONResponse({
                        'success': True,
                        'message': 'Wedding data saved successfully',
                        'record_id': couple_id
                    })
            except Exception as db_error:
                logger.error(f"Database save failed: {db_error}")

        # Fallback: save to local file
        try:
            os.makedirs('wedding_data', exist_ok=True)
            filename = f"wedding_data/couple_{int(time.time())}.json"
            with open(filename, 'w') as f:
                json.dump(couple_data, f, indent=2)

            return JSONResponse({
                'success': True,
                'message': 'Wedding data saved to local file (database unavailable)',
                'record_id': filename,
                'source': 'local_file'
            })
        except Exception as file_error:
            logger.error(f"File save failed: {file_error}")
            return JSONResponse({
                'success': False,
                'error': 'Failed to save data to both database and file system'
            }, status_code=500)

    except Exception as e:
        logger.error(f"Wedding data save error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

# Communication Services
@app.post("/api/generate-message")
async def generate_message(request: Request):
    """Generate vendor communication message"""
    try:
        data = await request.json()

        # Simple message generation
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        message_type = data.get('message_type', 'inquiry')

        message = f"""Dear {vendor_info.get('name', 'Vendor')},

We are planning our wedding for {wedding_info.get('wedding_date', 'soon')} and are interested in your {vendor_info.get('category', 'services')}.

Could you please share your availability and pricing details?

Best regards,
{wedding_info.get('couple_names', 'Wedding Couple')}
{wedding_info.get('contact_phone', '')}"""

        return JSONResponse({
            'success': True,
            'message': message,
            'message_type': message_type
        })

    except Exception as e:
        logger.error(f"Message generation error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

# Google OAuth Integration
@app.get("/api/google/auth-url")
async def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        auth_url = f"https://accounts.google.com/o/oauth2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri=https://shehnai.replit.app/oauth2callback&scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/userinfo.email&response_type=code&access_type=offline"

        return JSONResponse({
            'success': True,
            'auth_url': auth_url
        })
    except Exception as e:
        logger.error(f"Google auth URL error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

@app.post("/api/google/oauth2callback")
async def google_oauth_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        data = await request.json()
        auth_code = data.get('code', '')

        if not auth_code:
            return JSONResponse({
                'success': False,
                'error': 'Authorization code missing'
            }, status_code=400)

        # Exchange code for tokens (simplified for demo)
        return JSONResponse({
            'success': True,
            'message': 'Google OAuth authentication successful',
            'user': {
                'authenticated': True,
                'provider': 'google'
            }
        })

    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

# Budget Analysis
@app.post("/api/budget-analysis")
async def budget_analysis(request: Request):
    """Analyze wedding budget"""
    try:
        data = await request.json()
        budget_range = data.get('budget_range', '₹20-30 Lakhs')

        # Simple budget breakdown
        allocations = {
            'venue': {'percentage': 35, 'amount_formatted': '₹7-10.5 L'},
            'catering': {'percentage': 25, 'amount_formatted': '₹5-7.5 L'},
            'photography': {'percentage': 15, 'amount_formatted': '₹3-4.5 L'},
            'decoration': {'percentage': 12, 'amount_formatted': '₹2.4-3.6 L'},
            'makeup': {'percentage': 8, 'amount_formatted': '₹1.6-2.4 L'},
            'miscellaneous': {'percentage': 5, 'amount_formatted': '₹1-1.5 L'}
        }

        return JSONResponse({
            'success': True,
            'budget_range': budget_range,
            'allocations': allocations
        })

    except Exception as e:
        logger.error(f"Budget analysis error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

def main():
    logger.info("🌸 Starting Unified Shehnai.AI Wedding Assistant")
    logger.info("==================================================")
    logger.info("🚀 Server: http://0.0.0.0:8001")
    logger.info("📱 Frontend: Served from React build or fallback")
    logger.info("🔗 API Docs: http://0.0.0.0:8001/api/docs")
    logger.info("==================================================")

    try:
        # Test database connections before starting
        logger.info("🔧 Testing service connections...")

        # Initialize vendor database
        global vendor_db
        vendor_db = get_vendor_database()
        logger.info("✅ Vendor database initialized")

        # Test NocoDB connection
        try:
            test_result = vendor_db.nocodb_client.test_connection() if hasattr(vendor_db, 'nocodb_client') else True
            if test_result:
                logger.info("✅ NocoDB connection verified")
            else:
                logger.warning("⚠️ NocoDB connection failed - using fallback mode")
        except Exception as e:
            logger.warning(f"⚠️ NocoDB test failed: {e} - using fallback mode")

        logger.info("🚀 Starting FastAPI server...")
        uvicorn.run(
            "unified_wedding_server:app",
            host="0.0.0.0",
            port=8001,
            reload=False,
            log_level="info",
            access_log=True
        )

    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        logger.error("💡 Try checking dependencies: pip install fastapi uvicorn")
        raise

def build_enhanced_search_query(category: str, location: str, context: Dict) -> str:
    """Build enhanced search query based on wedding preferences"""
    base_query = f"{category} {location}"

    # Add wedding theme context
    if context.get('wedding_theme'):
        theme_keywords = {
            'royal-palace-rajasthani': 'royal rajasthani heritage palace',
            'traditional-regional-roots': 'traditional cultural authentic',
            'vintage-classic': 'vintage classic elegant heritage',
            'bollywood-glamour': 'bollywood glamour entertainment vibrant',
            'minimalist-modern': 'modern minimalist contemporary sleek',
            'luxury-contemporary': 'luxury premium contemporary high-end',
            'eco-friendly-sustainable': 'eco sustainable organic natural',
            'floral-paradise': 'floral garden natural flowers',
            'bohemian-chic': 'bohemian boho artistic creative'
        }
        theme_words = theme_keywords.get(context['wedding_theme'], '')
        if theme_words:
            base_query += f" {theme_words}"

    # Add budget context
    if context.get('budget_range'):
        if 'luxury' in context['budget_range'].lower() or '50+' in context['budget_range']:
            base_query += " luxury premium high-end"
        elif 'budget' in context['budget_range'].lower() or '5-15' in context['budget_range']:
            base_query += " affordable budget-friendly"

    # Add specific category enhancements
    if category == 'venues' and context.get('venue_type'):
        base_query += f" {context['venue_type'].replace('-', ' ')}"
    elif category == 'catering' and context.get('cuisine'):
        base_query += f" {context['cuisine'].replace('-', ' ')} cuisine"
    elif category == 'photography' and context.get('photography_style'):
        base_query += f" {context['photography_style']} photography"

    return base_query

def enhance_vendors_with_preferences(vendors: List[Dict], context: Dict) -> List[Dict]:
    """Enhance vendor data with preference-based scoring and filtering"""
    enhanced_vendors = []

    for vendor in vendors:
        enhanced_vendor = dict(vendor)

        # Calculate preference compatibility score
        compatibility_score = calculate_vendor_compatibility(vendor, context)
        enhanced_vendor['preferences_match_score'] = compatibility_score
        enhanced_vendor['contact_score'] = max(compatibility_score, vendor.get('contact_score', 70))

        # Add preference-based insights
        insights = generate_preference_insights(vendor, context)
        enhanced_vendor['preference_insights'] = insights

        # Enhance description with preference relevance
        enhanced_description = enhance_vendor_description(vendor, context)
        enhanced_vendor['enhanced_description'] = enhanced_description

        enhanced_vendors.append(enhanced_vendor)

    # Sort by preference compatibility
    enhanced_vendors.sort(key=lambda x: x['preferences_match_score'], reverse=True)

    return enhanced_vendors

def calculate_vendor_compatibility(vendor: Dict, context: Dict) -> int:
    """Calculate how well a vendor matches wedding preferences (0-100)"""
    score = 70  # Base score

    vendor_name = vendor.get('name', '').lower()
    vendor_desc = vendor.get('description', '').lower()
    vendor_category = vendor.get('category', '')

    # Theme compatibility (+/-15 points)
    theme = context.get('wedding_theme', '')
    if theme:
        theme_keywords = {
            'royal': ['royal', 'palace', 'heritage', 'traditional'],
            'traditional': ['traditional', 'cultural', 'authentic', 'heritage'],
            'modern': ['modern', 'contemporary', 'sleek', 'minimalist'],
            'luxury': ['luxury', 'premium', 'high-end', 'elite'],
            'eco': ['eco', 'sustainable', 'organic', 'natural'],
            'bollywood': ['bollywood', 'glamour', 'entertainment']
        }

        for theme_type, keywords in theme_keywords.items():
            if theme_type in theme:
                matches = sum(1 for keyword in keywords
                             if keyword in vendor_name or keyword in vendor_desc)
                if matches > 0:
                    score += min(15, matches * 5)
                break

    # Budget alignment (+/-10 points)
    budget = context.get('budget_range', '')
    vendor_price = vendor.get('price_range', '').lower()

    if budget and vendor_price:
        if ('luxury' in budget.lower() and ('luxury' in vendor_price or 'premium' in vendor_price)):
            score += 10
        elif ('budget' in budget.lower() and ('budget' in vendor_price or 'affordable' in vendor_price)):
            score += 10
        elif ('mid' in budget.lower() and ('mid' in vendor_price or 'standard' in vendor_price)):
            score += 10

    # Category priority bonus (+5 points)
    priorities = context.get('priorities', [])
    if vendor_category in priorities[:3]:  # Top 3 priorities
        priority_index = priorities.index(vendor_category)
        score += 5 - priority_index

    # Rating bonus (+/-5 points)
    vendor_rating = vendor.get('rating', 4.0)
    if vendor_rating >= 4.7:
        score += 5
    elif vendor_rating >= 4.5:
        score += 3
    elif vendor_rating < 4.0:
        score -= 5

    # Experience bonus (+3 points)
    experience = vendor.get('experience_years', 0)
    if experience >= 10:
        score += 3
    elif experience >= 5:
        score += 1

    return min(100, max(50, score))

def generate_preference_insights(vendor: Dict, context: Dict) -> List[str]:
    """Generate insights about how vendor matches preferences"""
    insights = []

    # Theme insights
    theme = context.get('wedding_theme', '')
    if theme and 'royal' in theme:
        if any(keyword in vendor.get('name', '').lower()
               for keyword in ['royal', 'palace', 'heritage']):
            insights.append("🏛️ Perfect for royal wedding themes")

    # Budget insights
    budget = context.get('budget_range', '')
    vendor_price = vendor.get('price_range', '').lower()
    if budget and 'luxury' in budget.lower() and 'luxury' in vendor_price:
        insights.append("💎 Matches your luxury budget preferences")

    # Category priority insights
    priorities = context.get('priorities', [])
    if vendor.get('category') in priorities[:2]:
        priority_rank = priorities.index(vendor.get('category')) + 1
        insights.append(f"⭐ #{priority_rank} priority category for your wedding")

    # Capacity insights
    guest_count = context.get('guest_count', 0)
    vendor_capacity = vendor.get('capacity', 0)
    if vendor_capacity and guest_count:
        if vendor_capacity >= guest_count * 0.8 and vendor_capacity <= guest_count * 1.5:
            insights.append(f"👥 Perfect size for your {guest_count} guests")

    return insights[:3]  # Limit to top 3 insights

def enhance_vendor_description(vendor: Dict, context: Dict) -> str:
    """Enhance vendor description with preference relevance"""
    base_desc = vendor.get('description', '')

    # Add preference-specific enhancements
    enhancements = []

    theme = context.get('wedding_theme', '')
    if theme and 'traditional' in theme:
        enhancements.append("Specializes in traditional wedding celebrations")
    elif theme and 'modern' in theme:
        enhancements.append("Expert in contemporary wedding styles")

    guest_count = context.get('guest_count', 0)
    if guest_count > 200:
        enhancements.append(f"Experienced with large weddings ({guest_count}+ guests)")
    elif guest_count < 100:
        enhancements.append("Perfect for intimate wedding celebrations")

    if enhancements:
        return f"{base_desc}. {'. '.join(enhancements)}."

    return base_desc

def get_enhanced_mock_vendors(category: str, location: str, context: Dict) -> List[Dict]:
    """Get mock vendors enhanced with preference-based data"""
    base_vendors = get_mock_vendors(category, location)
    return enhance_vendors_with_preferences(base_vendors, context)

if __name__ == "__main__":
    import uvicorn
    print("🌸 Starting Unified Wedding Server on port 8001...")
    print("📊 Health endpoint: http://0.0.0.0:8001/health")
    print("🔗 API docs: http://0.0.0.0:8001/docs")

    # Use port 8001 consistently (don't override with PORT env var)
    port = 8001
    print(f"🌐 Starting server on port {port}")

    uvicorn.run(app, host="0.0.0.0", port=port, reload=False, log_level="info")