
#!/usr/bin/env python3
"""
RAG-Enhanced Vendor Search API
Integrates wedding preferences with vector database for intelligent vendor matching
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Import our enhanced systems
from enhanced_vendor_search import EnhancedVendorSearch, VendorCategory, SearchCriteria
from rag_vector_database import VectorRAGDatabase, EnhancedRAGVendorExtractor
from vendor_database import get_vendor_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG-Enhanced Vendor Search API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
vendor_search = EnhancedVendorSearch()
rag_extractor = EnhancedRAGVendorExtractor()
vendor_db = get_vendor_database()

@app.post("/api/store-wedding-preferences")
async def store_wedding_preferences(request: Request):
    """Store wedding preferences for RAG system"""
    try:
        data = await request.json()
        logger.info(f"Storing wedding preferences for RAG: {data}")
        
        # Store in database
        result = vendor_db.store_couple_data({
            **data.get('couple_data', {}),
            **data.get('preferences', {}),
            'created_at': datetime.now().isoformat()
        })
        
        if result.get('success'):
            # Update vector database with preferences
            try:
                from rag_vector_database import VendorDocument
                preferences_doc = VendorDocument(
                    vendor_id=f"preferences_{result.get('id')}",
                    content=f"Wedding preferences: {json.dumps(data.get('preferences', {}))}",
                    metadata={
                        **data.get('preferences', {}),
                        'type': 'wedding_preferences',
                        'couple_id': result.get('id'),
                        'timestamp': datetime.now().isoformat()
                    }
                )
                rag_extractor.vector_db.add_vendor_documents([preferences_doc])
                logger.info("✅ Wedding preferences added to vector database")
            except Exception as e:
                logger.error(f"Error adding to vector database: {e}")
            
            return JSONResponse({
                'success': True,
                'message': 'Wedding preferences stored successfully',
                'record_id': result.get('id')
            })
        else:
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to store preferences')
            }, status_code=500)
            
    except Exception as e:
        logger.error(f"Error storing wedding preferences: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

@app.post("/api/enhanced-vendor-search")
async def enhanced_vendor_search(request: Request):
    """Enhanced vendor search with RAG integration"""
    try:
        data = await request.json()
        logger.info(f"🔍 RAG-Enhanced vendor search request: {data}")
        
        # Extract search parameters
        category = data.get('category', '')
        location = data.get('location', 'Mumbai')
        budget_range_str = data.get('budgetRange', '₹20-30 Lakhs')
        guest_count = int(data.get('guestCount', 200))
        wedding_style = data.get('weddingStyle', 'Traditional')
        search_context = data.get('searchContext', {})
        
        # Parse budget range
        budget_range = parse_budget_range(budget_range_str)
        
        # Map category to enum
        category_enum = VendorCategory.VENUES
        if category:
            category_mapping = {
                'venues': VendorCategory.VENUES,
                'photography': VendorCategory.PHOTOGRAPHY,
                'catering': VendorCategory.CATERING,
                'decoration': VendorCategory.DECORATION,
                'makeup': VendorCategory.MAKEUP
            }
            category_enum = category_mapping.get(category.lower(), VendorCategory.VENUES)
        
        # Create search criteria
        criteria = SearchCriteria(
            category=category_enum,
            location=location,
            budget_range=budget_range,
            guest_count=guest_count,
            wedding_theme=wedding_style,
            preferred_style=data.get('photographyStyle', ''),
            special_requirements=data.get('specialRequirements', '').split(',') if data.get('specialRequirements') else []
        )
        
        # Perform enhanced vendor search
        logger.info(f"🔍 Searching vendors with criteria: {criteria}")
        vendors = vendor_search.search_vendors(criteria, max_results=20)
        
        # RAG Enhancement
        rag_enhanced_vendors = []
        rag_context = {}
        
        if search_context.get('useRAG', False) and search_context.get('ragQuery'):
            try:
                # Search similar vendors in vector database
                rag_query = search_context['ragQuery']
                similar_vendors = rag_extractor.vector_db.search_similar_vendors(
                    query=rag_query,
                    category=category,
                    location=location,
                    top_k=10
                )
                
                # Enhance vendor data with RAG insights
                for vendor in vendors:
                    enhanced_vendor = rag_extractor.extract_enhanced_vendor_info_with_vectors(
                        {
                            'name': vendor.name,
                            'category': vendor.category.value,
                            'location': vendor.location,
                            'rating': vendor.rating,
                            'price_range': vendor.price_range,
                            'description': vendor.description
                        },
                        {
                            'location': location,
                            'budget_range': budget_range_str,
                            'guest_count': guest_count,
                            'wedding_style': wedding_style
                        }
                    )
                    rag_enhanced_vendors.append(enhanced_vendor)
                
                rag_context = {
                    'query': rag_query,
                    'similar_vendors_found': len(similar_vendors),
                    'enhancement_applied': True
                }
                
                logger.info(f"✅ RAG enhancement applied to {len(rag_enhanced_vendors)} vendors")
                
            except Exception as e:
                logger.error(f"RAG enhancement failed: {e}")
                rag_context = {'enhancement_applied': False, 'error': str(e)}
        
        # Convert vendors to serializable format
        vendor_list = []
        for vendor in vendors:
            vendor_dict = {
                'id': vendor.id,
                'name': vendor.name,
                'category': vendor.category.value,
                'location': vendor.location,
                'description': vendor.description,
                'website': vendor.website,
                'phone': vendor.phone,
                'email': vendor.email,
                'rating': vendor.rating,
                'price_range': f"₹{vendor.price_range[0]:,} - ₹{vendor.price_range[1]:,}" if vendor.price_range else '',
                'specialties': vendor.specialties,
                'verified': vendor.verified,
                'experience_years': vendor.experience_years,
                'search_score': vendor.search_score
            }
            vendor_list.append(vendor_dict)
        
        logger.info(f"✅ RAG-Enhanced search completed: {len(vendor_list)} vendors found")
        
        return JSONResponse({
            'success': True,
            'vendors': vendor_list,
            'ragEnhancedVendors': rag_enhanced_vendors,
            'ragContext': rag_context,
            'searchCriteria': {
                'category': category,
                'location': location,
                'budget_range': budget_range_str,
                'guest_count': guest_count,
                'wedding_style': wedding_style
            },
            'totalCount': len(vendor_list)
        })
        
    except Exception as e:
        logger.error(f"❌ Error in RAG-enhanced vendor search: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

def parse_budget_range(budget_str: str) -> tuple:
    """Parse budget range string into tuple"""
    try:
        if '₹' in budget_str and 'Lakh' in budget_str:
            # Extract numbers from string like "₹20-30 Lakhs"
            numbers = []
            parts = budget_str.replace('₹', '').replace('Lakhs', '').replace('Lakh', '').strip()
            if '-' in parts:
                range_parts = parts.split('-')
                min_val = int(range_parts[0].strip()) * 100000  # Convert lakhs to rupees
                max_val = int(range_parts[1].strip()) * 100000
                return (min_val, max_val)
        
        # Default budget range
        return (500000, 2000000)  # ₹5-20 Lakhs
        
    except Exception:
        return (500000, 2000000)  # Default fallback

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting RAG-Enhanced Vendor Search API...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
