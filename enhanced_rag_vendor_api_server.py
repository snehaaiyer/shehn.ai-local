
#!/usr/bin/env python3
"""
Enhanced RAG Vendor API Server
Dedicated server for RAG-enhanced vendor operations on port 5003
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import uvicorn
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_vendor_selection_with_rag import EnhancedVendorSelectionWithRAG
from config.api_config import CORS_ORIGINS

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Enhanced RAG Vendor API",
    description="RAG-enhanced vendor discovery and selection API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG vendor service
try:
    rag_vendor_service = EnhancedVendorSelectionWithRAG()
    logger.info("✅ RAG Vendor Service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize RAG Vendor Service: {e}")
    rag_vendor_service = None

class VendorSearchRequest(BaseModel):
    location: str
    budget_min: float
    budget_max: float
    categories: List[str]
    guest_count: int
    preferences: Optional[Dict[str, Any]] = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Enhanced RAG Vendor API",
        "port": 5003,
        "rag_service_available": rag_vendor_service is not None,
        "endpoints": [
            "/health",
            "/vendor-search",
            "/vendor-recommendations"
        ]
    }

@app.post("/vendor-search")
async def search_vendors(request: VendorSearchRequest):
    """Search vendors using RAG enhancement"""
    if not rag_vendor_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        results = await rag_vendor_service.search_vendors_with_rag(
            location=request.location,
            budget_range=(request.budget_min, request.budget_max),
            categories=request.categories,
            guest_count=request.guest_count,
            preferences=request.preferences
        )
        
        return {
            "success": True,
            "vendors": results,
            "total_count": len(results),
            "location": request.location,
            "categories": request.categories
        }
    except Exception as e:
        logger.error(f"❌ Vendor search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vendor-recommendations")
async def get_vendor_recommendations(
    location: str = Query(...),
    category: str = Query(...),
    budget: float = Query(50000),
    guest_count: int = Query(100)
):
    """Get vendor recommendations"""
    if not rag_vendor_service:
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        recommendations = await rag_vendor_service.get_recommendations(
            location=location,
            category=category,
            budget=budget,
            guest_count=guest_count
        )
        
        return {
            "success": True,
            "recommendations": recommendations,
            "location": location,
            "category": category
        }
    except Exception as e:
        logger.error(f"❌ Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting Enhanced RAG Vendor API on port 5003...")
    print("📊 Health endpoint: http://0.0.0.0:5003/health")
    print("🔗 API docs: http://0.0.0.0:5003/docs")
    uvicorn.run(app, host="0.0.0.0", port=5003, reload=False)
