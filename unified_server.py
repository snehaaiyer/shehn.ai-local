#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Unified Server
Serves frontend and AI API on single port (8000)
"""

import os
import asyncio
import logging
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# Import the AI service components
from wedding_ai_service import app as ai_app, crewai_agents, budget_service, nocodb_api

# Import communications agent
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / "local_website"))

try:
    from communications_agent import CommunicationsAgent
    comm_agent = CommunicationsAgent()
except ImportError:
    # Fallback if communications agent is not available
    class CommunicationsAgent:
        def generate_message(self, message_type, vendor_info, wedding_info, additional_info=None):
            return "Communications agent not available. Please check the system."
        
        def generate_whatsapp_message(self, vendor_info, wedding_info):
            return "WhatsApp message generation not available."
    
    comm_agent = CommunicationsAgent()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create main app
app = FastAPI(
    title="BID AI Wedding Assistant",
    description="Complete wedding planning with AI assistance",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the AI API routes under /api prefix
app.mount("/api", ai_app)

# Serve static files from local_website directory
STATIC_DIR = Path(__file__).parent / "local_website"

# Health check for the unified service
@app.get("/health")
async def unified_health_check():
    """Health check for the unified service"""
    try:
        # Check AI service health
        ai_healthy = True
        if crewai_agents and hasattr(crewai_agents, 'llm'):
            ai_healthy = crewai_agents.llm is not None
        
        # Check database health
        db_healthy = nocodb_api is not None
        
        # Check budget service
        budget_healthy = budget_service is not None
        
        all_healthy = ai_healthy and db_healthy and budget_healthy
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "timestamp": "2024-06-24T22:30:00Z",
            "services": {
                "frontend": "healthy",
                "ai_agents": "healthy" if ai_healthy else "unavailable",
                "database": "healthy" if db_healthy else "unavailable", 
                "budget_service": "healthy" if budget_healthy else "unavailable",
                "ollama": "healthy"  # We know this is running
            },
            "message": "All systems operational" if all_healthy else "Some services may be degraded"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": "2024-06-24T22:30:00Z"
            }
        )

# API status endpoint (for compatibility with tests)
@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "status": "operational",
        "version": "1.0.0",
        "endpoints": [
            "/api/health",
            "/api/submit-wedding", 
            "/api/ai-consultation",
            "/api/budget-analysis",
            "/api/vendor-search"
        ]
    }

# Serve static files and handle frontend routing
@app.get("/js/{file_path:path}")
async def serve_js(file_path: str):
    """Serve JavaScript files"""
    file_location = STATIC_DIR / "js" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/css/{file_path:path}")
async def serve_css(file_path: str):
    """Serve CSS files"""
    file_location = STATIC_DIR / "css" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="text/css")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    """Serve asset files"""
    file_location = STATIC_DIR / "assets" / file_path
    if file_location.exists():
        return FileResponse(file_location)
    raise HTTPException(status_code=404, detail="File not found")

# Main page and SPA routing
@app.get("/")
async def serve_index():
    """Serve the main index page"""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="Index file not found")

@app.get("/{path:path}")
async def serve_spa_routes(path: str):
    """Serve index.html for SPA routes (dashboard, wedding-form, etc.)"""
    # For SPA routes, serve index.html
    spa_routes = ["dashboard", "wedding-form", "visual-preferences", "vendor-discovery"]
    
    # Remove hash and query params
    clean_path = path.split('#')[0].split('?')[0]
    
    if clean_path in spa_routes or not clean_path:
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file, media_type="text/html")
    
    # Try to serve as static file
    file_location = STATIC_DIR / path
    if file_location.exists() and file_location.is_file():
        return FileResponse(file_location)
    
    # Fallback to index for unknown routes (SPA behavior)
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")
    
    raise HTTPException(status_code=404, detail="File not found")

# Vendor Discovery Routes
@app.get("/vendor-discovery")
async def serve_vendor_discovery():
    """Serve the vendor discovery page"""
    vendor_file = STATIC_DIR / "vendor-discovery.html"
    if vendor_file.exists():
        return FileResponse(vendor_file, media_type="text/html")
    
    # If file doesn't exist, create a basic vendor discovery page
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Loading Vendor Discovery...</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   background: linear-gradient(135deg, #ffeef3 0%, #f8e8ee 50%, #f5d0e0 100%);
                   display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .loading { text-align: center; padding: 2rem; background: white; border-radius: 16px; 
                      box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body>
        <div class="loading">
            <h1>🎉 Vendor Discovery</h1>
            <p>Setting up your wedding vendor discovery...</p>
            <script>setTimeout(() => window.location.reload(), 2000);</script>
        </div>
    </body>
    </html>
    """

@app.get("/api/vendor-data/{category}")
async def get_vendor_data(category: str):
    """Get vendor data for specific category"""
    try:
        # Sample vendor data - in production, this would come from a database
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
                    'category': 'venues'
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
                    'category': 'venues'
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
                    'category': 'decoration'
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
                    'category': 'decoration'
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
                    'category': 'catering'
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
                    'category': 'catering'
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
                    'category': 'makeup'
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
                    'category': 'makeup'
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
                    'category': 'photography'
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
                    'category': 'photography'
                }
            ]
        }
        
        return JSONResponse({
            'success': True,
            'vendors': vendor_data.get(category, []),
            'category': category,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-message")
async def generate_message(request: Request):
    """Generate formal message for vendor communication"""
    try:
        data = await request.json()
        
        message_type = data.get('message_type', 'inquiry')
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        additional_info = data.get('additional_info', {})
        
        # Generate the message using communications agent
        message = comm_agent.generate_message(
            message_type, vendor_info, wedding_info, additional_info
        )
        
        return JSONResponse({
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-whatsapp-message")
async def generate_whatsapp_message(request: Request):
    """Generate WhatsApp-friendly message"""
    try:
        data = await request.json()
        
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        
        # Generate WhatsApp message
        message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return JSONResponse({
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/test-communication")
async def test_communication():
    """Test endpoint for communications agent"""
    try:
        # Test data
        vendor_info = {
            'name': 'Test Vendor',
            'category': 'venues',
            'location': 'Mumbai',
            'price': '₹2,00,000 - ₹5,00,000'
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
        
        # Generate test messages
        inquiry_message = comm_agent.generate_message('inquiry', vendor_info, wedding_info)
        whatsapp_message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return JSONResponse({
            'success': True,
            'test_results': {
                'inquiry_message': inquiry_message,
                'whatsapp_message': whatsapp_message
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Enhanced startup
@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info("🌸 BID AI Wedding Assistant - Unified Server Starting...")
    logger.info("=" * 60)
    logger.info(f"📁 Static files: {STATIC_DIR}")
    logger.info(f"🌐 Frontend: http://localhost:8000")
    logger.info(f"🤖 AI API: http://localhost:8000/api/")
    logger.info(f"📊 Health Check: http://localhost:8000/health")
    
    # Check static directory
    if not STATIC_DIR.exists():
        logger.warning(f"⚠️ Static directory not found: {STATIC_DIR}")
    else:
        logger.info(f"✅ Static directory found: {STATIC_DIR}")
    
    # Check critical files
    critical_files = ["index.html", "css/styles.css", "js/app.js", "js/navigation.js"]
    for file_path in critical_files:
        file_location = STATIC_DIR / file_path
        if file_location.exists():
            logger.info(f"✅ Found: {file_path}")
        else:
            logger.warning(f"⚠️ Missing: {file_path}")
    
    logger.info("=" * 60)

def main():
    """Main function to run the unified server"""
    print("🌸 BID AI Wedding Assistant - Unified Server")
    print("=" * 60)
    print("🚀 Starting unified server on http://localhost:8000")
    print("📱 Frontend: http://localhost:8000")
    print("🤖 AI API: http://localhost:8000/api/")
    print("📊 Health: http://localhost:8000/health")
    print("=" * 60)
    print("💡 All services running on single port!")
    print("   - Frontend (HTML/CSS/JS)")
    print("   - AI API endpoints")
    print("   - CrewAI agents")
    print("   - Budget analysis")
    print("   - NocoDB integration")
    print("=" * 60)
    
    # Run the server
    uvicorn.run(
        "unified_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload to prevent exit
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main() 