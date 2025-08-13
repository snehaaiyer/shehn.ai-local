
#!/usr/bin/env python3
"""
RAG-Enhanced Vendor Search API
Replaces keyword-based filtering with semantic vector search and intelligent matching
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import asyncio
import aiohttp

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

@dataclass
class VendorEmbeddingProfile:
    """Vendor profile with embeddings for different attributes"""
    vendor_id: str
    name: str
    category: str
    location: str
    description: str
    specialties: List[str]
    style_embedding: List[float]
    service_embedding: List[float]
    cultural_embedding: List[float]
    budget_tier: str
    capacity_range: Tuple[int, int]
    rating: float
    contact_info: Dict[str, Any]
    metadata: Dict[str, Any]

@dataclass
class UserPreferenceEmbeddings:
    """User preferences converted to embeddings"""
    style_embedding: List[float]
    cultural_embedding: List[float]
    service_embedding: List[float]
    practical_embedding: List[float]
    preference_weights: Dict[str, float]

class RAGVendorSearchEngine:
    """RAG-powered vendor search engine with semantic matching"""
    
    def __init__(self):
        # Initialize embedding models
        self.style_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.semantic_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # Initialize vector database
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_wedding_vendors",
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Create collections for different embedding types
        self.style_collection = self.chroma_client.get_or_create_collection(
            name="vendor_styles",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.service_collection = self.chroma_client.get_or_create_collection(
            name="vendor_services", 
            metadata={"hnsw:space": "cosine"}
        )
        
        self.cultural_collection = self.chroma_client.get_or_create_collection(
            name="vendor_cultural",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Initialize with sample data
        self.populate_vendor_embeddings()
        
        logger.info("✅ RAG Vendor Search Engine initialized")
    
    def populate_vendor_embeddings(self):
        """Populate vector database with enhanced vendor data"""
        try:
            # Enhanced vendor dataset with detailed profiles
            sample_vendors = [
                {
                    "vendor_id": "venue_mumbai_001",
                    "name": "Taj Palace Hotel Mumbai",
                    "category": "venues",
                    "location": "Mumbai",
                    "description": "Luxury 5-star heritage hotel with grand ballrooms, royal architecture, premium catering, and world-class amenities for extravagant weddings",
                    "specialties": ["luxury weddings", "royal themes", "heritage architecture", "premium service", "international standards"],
                    "style_profile": "royal luxury heritage premium grand opulent sophisticated elegant traditional modern fusion",
                    "service_profile": "full service catering accommodation valet parking event planning luxury amenities spa services",
                    "cultural_profile": "multi-cultural traditional indian international western fusion ceremonies religious accommodating",
                    "budget_tier": "ultra_luxury",
                    "capacity_range": (200, 800),
                    "rating": 4.9,
                    "contact_info": {
                        "phone": "+91 98765 43210",
                        "email": "events@tajpalace.com",
                        "website": "www.tajpalace.com"
                    }
                },
                {
                    "vendor_id": "venue_mumbai_002", 
                    "name": "Garden Paradise Resort",
                    "category": "venues",
                    "location": "Mumbai",
                    "description": "Beautiful outdoor resort with lush gardens, natural settings, eco-friendly facilities, and scenic views perfect for intimate garden weddings",
                    "specialties": ["garden weddings", "outdoor ceremonies", "eco-friendly", "natural settings", "intimate celebrations"],
                    "style_profile": "garden outdoor natural rustic boho eco-friendly intimate scenic floral peaceful",
                    "service_profile": "outdoor catering garden setup natural lighting accommodation basic amenities eco facilities",
                    "cultural_profile": "flexible cultural accommodating outdoor ceremonies nature-based spiritual peaceful",
                    "budget_tier": "mid_range",
                    "capacity_range": (50, 300),
                    "rating": 4.6,
                    "contact_info": {
                        "phone": "+91 87654 32109",
                        "email": "weddings@gardenparadise.com", 
                        "website": "www.gardenparadise.com"
                    }
                },
                {
                    "vendor_id": "photo_mumbai_001",
                    "name": "Elite Wedding Photography",
                    "category": "photography", 
                    "location": "Mumbai",
                    "description": "Award-winning photography studio specializing in artistic cinematic wedding photography with creative compositions and storytelling approach",
                    "specialties": ["artistic photography", "cinematic videos", "candid moments", "creative compositions", "storytelling"],
                    "style_profile": "artistic cinematic creative candid documentary photojournalistic contemporary modern stylish",
                    "service_profile": "full day coverage pre-wedding shoots drone photography video production album design editing",
                    "cultural_profile": "traditional indian modern western cultural ceremonies religious diverse inclusive",
                    "budget_tier": "premium",
                    "capacity_range": (1, 1),
                    "rating": 4.8,
                    "contact_info": {
                        "phone": "+91 98765 54321",
                        "email": "hello@elitephotography.com",
                        "website": "www.elitephotography.com"
                    }
                },
                {
                    "vendor_id": "catering_mumbai_001",
                    "name": "Royal Feast Catering",
                    "category": "catering",
                    "location": "Mumbai", 
                    "description": "Premium catering service offering authentic Indian cuisine, international dishes, and customized menus with live cooking stations",
                    "specialties": ["indian cuisine", "international dishes", "live cooking", "custom menus", "premium ingredients"],
                    "style_profile": "traditional indian contemporary international fusion authentic gourmet premium quality",
                    "service_profile": "multi-cuisine catering live stations custom menus dietary accommodations presentation service",
                    "cultural_profile": "traditional indian regional cuisines international fusion dietary restrictions religious compliant",
                    "budget_tier": "premium", 
                    "capacity_range": (50, 1000),
                    "rating": 4.7,
                    "contact_info": {
                        "phone": "+91 98765 67890",
                        "email": "feast@royalcatering.com",
                        "website": "www.royalcatering.com"
                    }
                },
                {
                    "vendor_id": "decor_mumbai_001",
                    "name": "Elegant Decorations Studio",
                    "category": "decoration",
                    "location": "Mumbai",
                    "description": "Creative decoration studio specializing in floral arrangements, theme-based setups, and customized wedding décor with attention to detail",
                    "specialties": ["floral arrangements", "theme decorations", "custom setups", "lighting design", "creative concepts"],
                    "style_profile": "elegant sophisticated floral themed creative contemporary traditional fusion artistic beautiful",
                    "service_profile": "decoration design floral arrangements lighting setup theme creation custom concepts",
                    "cultural_profile": "traditional indian contemporary fusion cultural themes religious decorations festival setups",
                    "budget_tier": "mid_range",
                    "capacity_range": (50, 500),
                    "rating": 4.5,
                    "contact_info": {
                        "phone": "+91 98765 13579",
                        "email": "decor@elegantstudio.com",
                        "website": "www.elegantstudio.com"
                    }
                }
            ]
            
            # Generate embeddings and populate collections
            for vendor in sample_vendors:
                # Generate different types of embeddings
                style_embedding = self.style_model.encode(vendor["style_profile"]).tolist()
                service_embedding = self.semantic_model.encode(vendor["service_profile"]).tolist()
                cultural_embedding = self.semantic_model.encode(vendor["cultural_profile"]).tolist()
                
                # Prepare metadata
                metadata = {
                    "vendor_id": vendor["vendor_id"],
                    "name": vendor["name"],
                    "category": vendor["category"],
                    "location": vendor["location"],
                    "budget_tier": vendor["budget_tier"],
                    "capacity_min": vendor["capacity_range"][0],
                    "capacity_max": vendor["capacity_range"][1],
                    "rating": vendor["rating"],
                    "contact_phone": vendor["contact_info"]["phone"],
                    "contact_email": vendor["contact_info"]["email"],
                    "contact_website": vendor["contact_info"]["website"]
                }
                
                # Add to style collection
                self.style_collection.add(
                    ids=[f"style_{vendor['vendor_id']}"],
                    documents=[vendor["style_profile"]],
                    embeddings=[style_embedding],
                    metadatas=[{**metadata, "profile_type": "style"}]
                )
                
                # Add to service collection
                self.service_collection.add(
                    ids=[f"service_{vendor['vendor_id']}"],
                    documents=[vendor["service_profile"]],
                    embeddings=[service_embedding],
                    metadatas=[{**metadata, "profile_type": "service"}]
                )
                
                # Add to cultural collection
                self.cultural_collection.add(
                    ids=[f"cultural_{vendor['vendor_id']}"],
                    documents=[vendor["cultural_profile"]],
                    embeddings=[cultural_embedding],
                    metadatas=[{**metadata, "profile_type": "cultural"}]
                )
            
            logger.info(f"✅ Populated vector database with {len(sample_vendors)} vendors")
            
        except Exception as e:
            logger.error(f"❌ Error populating vendor embeddings: {e}")
    
    def generate_user_preference_embeddings(self, wedding_preferences: Dict[str, Any]) -> UserPreferenceEmbeddings:
        """Convert user preferences to embeddings for semantic search"""
        try:
            # Extract and construct preference profiles
            style_elements = []
            cultural_elements = []
            service_elements = []
            practical_elements = []
            
            # Style preferences
            if wedding_preferences.get('weddingTheme'):
                style_elements.append(wedding_preferences['weddingTheme'])
            if wedding_preferences.get('decorStyle'):
                style_elements.append(wedding_preferences['decorStyle'])
            if wedding_preferences.get('colorTheme'):
                style_elements.append(wedding_preferences['colorTheme'])
            if wedding_preferences.get('venueStyle'):
                style_elements.append(wedding_preferences['venueStyle'])
            
            # Cultural preferences
            if wedding_preferences.get('culturalRequirements'):
                cultural_elements.extend(wedding_preferences['culturalRequirements'])
            if wedding_preferences.get('cuisineStyle'):
                cultural_elements.append(wedding_preferences['cuisineStyle'])
            if wedding_preferences.get('traditionalElements'):
                cultural_elements.extend(wedding_preferences['traditionalElements'])
            
            # Service preferences
            if wedding_preferences.get('photographyStyle'):
                service_elements.append(wedding_preferences['photographyStyle'])
            if wedding_preferences.get('cateringStyle'):
                service_elements.append(wedding_preferences['cateringStyle'])
            if wedding_preferences.get('entertainmentType'):
                service_elements.append(wedding_preferences['entertainmentType'])
            
            # Practical preferences
            if wedding_preferences.get('budgetRange'):
                practical_elements.append(wedding_preferences['budgetRange'])
            if wedding_preferences.get('guestCount'):
                practical_elements.append(f"guest capacity {wedding_preferences['guestCount']}")
            if wedding_preferences.get('city'):
                practical_elements.append(wedding_preferences['city'])
            if wedding_preferences.get('indoorOutdoor'):
                practical_elements.append(wedding_preferences['indoorOutdoor'])
            
            # Create preference profiles
            style_profile = ' '.join(style_elements) if style_elements else 'general style'
            cultural_profile = ' '.join(cultural_elements) if cultural_elements else 'flexible cultural'
            service_profile = ' '.join(service_elements) if service_elements else 'standard service'
            practical_profile = ' '.join(practical_elements) if practical_elements else 'flexible practical'
            
            # Generate embeddings
            style_embedding = self.style_model.encode(style_profile).tolist()
            cultural_embedding = self.semantic_model.encode(cultural_profile).tolist()
            service_embedding = self.semantic_model.encode(service_profile).tolist()
            practical_embedding = self.semantic_model.encode(practical_profile).tolist()
            
            # Calculate preference weights based on user priorities
            priorities = wedding_preferences.get('priorities', ['venue', 'photography', 'catering'])
            weights = {
                'style': 0.3 if 'venue' in priorities[:2] else 0.2,
                'cultural': 0.2 if 'catering' in priorities[:2] else 0.15,
                'service': 0.3 if 'photography' in priorities[:2] else 0.25,
                'practical': 0.2,
                'budget': 0.25 if wedding_preferences.get('budgetPriority', 'medium') == 'high' else 0.15
            }
            
            return UserPreferenceEmbeddings(
                style_embedding=style_embedding,
                cultural_embedding=cultural_embedding,
                service_embedding=service_embedding,
                practical_embedding=practical_embedding,
                preference_weights=weights
            )
            
        except Exception as e:
            logger.error(f"❌ Error generating preference embeddings: {e}")
            # Return default embeddings
            default_text = "general wedding preferences"
            default_embedding = self.semantic_model.encode(default_text).tolist()
            return UserPreferenceEmbeddings(
                style_embedding=default_embedding,
                cultural_embedding=default_embedding,
                service_embedding=default_embedding,
                practical_embedding=default_embedding,
                preference_weights={'style': 0.25, 'cultural': 0.2, 'service': 0.3, 'practical': 0.25}
            )
    
    async def semantic_vendor_search(self, 
                                   user_preferences: UserPreferenceEmbeddings,
                                   search_filters: Dict[str, Any],
                                   top_k: int = 20) -> List[Dict[str, Any]]:
        """Perform semantic search across all vendor collections"""
        try:
            # Search across different collections
            style_results = self.style_collection.query(
                query_embeddings=[user_preferences.style_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            service_results = self.service_collection.query(
                query_embeddings=[user_preferences.service_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            cultural_results = self.cultural_collection.query(
                query_embeddings=[user_preferences.cultural_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # Combine and score results
            vendor_scores = {}
            
            # Process style results
            if style_results['ids'][0]:
                for i, vendor_id in enumerate(style_results['ids'][0]):
                    base_id = vendor_id.replace('style_', '')
                    similarity_score = 1 - style_results['distances'][0][i]
                    vendor_scores[base_id] = vendor_scores.get(base_id, {})
                    vendor_scores[base_id]['style_score'] = similarity_score * user_preferences.preference_weights['style']
                    vendor_scores[base_id]['metadata'] = style_results['metadatas'][0][i]
            
            # Process service results
            if service_results['ids'][0]:
                for i, vendor_id in enumerate(service_results['ids'][0]):
                    base_id = vendor_id.replace('service_', '')
                    similarity_score = 1 - service_results['distances'][0][i]
                    if base_id not in vendor_scores:
                        vendor_scores[base_id] = {}
                    vendor_scores[base_id]['service_score'] = similarity_score * user_preferences.preference_weights['service']
                    if 'metadata' not in vendor_scores[base_id]:
                        vendor_scores[base_id]['metadata'] = service_results['metadatas'][0][i]
            
            # Process cultural results
            if cultural_results['ids'][0]:
                for i, vendor_id in enumerate(cultural_results['ids'][0]):
                    base_id = vendor_id.replace('cultural_', '')
                    similarity_score = 1 - cultural_results['distances'][0][i]
                    if base_id not in vendor_scores:
                        vendor_scores[base_id] = {}
                    vendor_scores[base_id]['cultural_score'] = similarity_score * user_preferences.preference_weights['cultural']
                    if 'metadata' not in vendor_scores[base_id]:
                        vendor_scores[base_id]['metadata'] = cultural_results['metadatas'][0][i]
            
            # Calculate composite scores and apply filters
            final_vendors = []
            
            for vendor_id, scores in vendor_scores.items():
                if 'metadata' not in scores:
                    continue
                
                metadata = scores['metadata']
                
                # Apply hard filters
                if not self.passes_filters(metadata, search_filters):
                    continue
                
                # Calculate composite RAG score
                composite_score = (
                    scores.get('style_score', 0) +
                    scores.get('service_score', 0) +
                    scores.get('cultural_score', 0)
                )
                
                # Apply business logic bonuses
                business_score = self.calculate_business_logic_score(metadata, search_filters)
                final_score = composite_score + (business_score * 0.2)
                
                vendor_info = {
                    'id': vendor_id,
                    'name': metadata['name'],
                    'category': metadata['category'],
                    'location': metadata['location'],
                    'rating': metadata['rating'],
                    'budget_tier': metadata['budget_tier'],
                    'capacity_range': f"{metadata['capacity_min']}-{metadata['capacity_max']}",
                    'contact': {
                        'phone': metadata['contact_phone'],
                        'email': metadata['contact_email'],
                        'website': metadata['contact_website']
                    },
                    'rag_scores': {
                        'style_score': round(scores.get('style_score', 0), 3),
                        'service_score': round(scores.get('service_score', 0), 3),
                        'cultural_score': round(scores.get('cultural_score', 0), 3),
                        'composite_score': round(composite_score, 3),
                        'business_score': round(business_score, 3),
                        'final_score': round(final_score, 3)
                    }
                }
                
                final_vendors.append(vendor_info)
            
            # Sort by final score
            final_vendors.sort(key=lambda x: x['rag_scores']['final_score'], reverse=True)
            
            logger.info(f"✅ RAG search completed: {len(final_vendors)} vendors found")
            return final_vendors[:top_k]
            
        except Exception as e:
            logger.error(f"❌ Error in semantic vendor search: {e}")
            return []
    
    def passes_filters(self, metadata: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Apply hard filters to vendor results"""
        try:
            # Category filter
            if filters.get('category') and filters['category'] != 'all':
                if metadata['category'] != filters['category']:
                    return False
            
            # Location filter
            if filters.get('location'):
                if filters['location'].lower() not in metadata['location'].lower():
                    return False
            
            # Guest count filter
            if filters.get('guestCount'):
                guest_count = int(filters['guestCount'])
                if not (metadata['capacity_min'] <= guest_count <= metadata['capacity_max']):
                    return False
            
            # Budget tier filter
            if filters.get('budgetTier'):
                budget_mapping = {
                    'budget': ['budget', 'affordable'],
                    'mid_range': ['mid_range', 'standard'],
                    'premium': ['premium', 'luxury'],
                    'ultra_luxury': ['ultra_luxury', 'exclusive']
                }
                
                user_budget = filters['budgetTier'].lower()
                if user_budget in budget_mapping:
                    if metadata['budget_tier'] not in budget_mapping[user_budget]:
                        return False
            
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ Filter application error: {e}")
            return True
    
    def calculate_business_logic_score(self, metadata: Dict[str, Any], filters: Dict[str, Any]) -> float:
        """Calculate business logic score for ranking"""
        score = 0
        
        try:
            # Rating boost
            if metadata.get('rating'):
                score += (metadata['rating'] - 4.0) * 0.2  # Boost for ratings above 4.0
            
            # Location exact match boost
            if filters.get('location'):
                if filters['location'].lower() == metadata['location'].lower():
                    score += 0.1
            
            # Capacity perfect match boost
            if filters.get('guestCount'):
                guest_count = int(filters['guestCount'])
                capacity_mid = (metadata['capacity_min'] + metadata['capacity_max']) / 2
                capacity_match = 1 - abs(guest_count - capacity_mid) / capacity_mid
                score += capacity_match * 0.1
            
            return max(0, min(1, score))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.warning(f"⚠️ Business logic scoring error: {e}")
            return 0

# Global search engine instance
rag_search_engine = RAGVendorSearchEngine()

@app.post("/api/rag-vendor-search")
async def rag_enhanced_vendor_search(request: Request):
    """Main RAG-enhanced vendor search endpoint"""
    try:
        data = await request.json()
        logger.info(f"🔍 RAG vendor search request received")
        
        # Extract wedding preferences and search parameters
        wedding_data = data.get('weddingData', {})
        search_params = data.get('searchParams', {})
        category_filter = data.get('filterCategory')
        top_k = data.get('maxResults', 20)
        
        # Combine preferences for RAG processing
        combined_preferences = {**wedding_data, **search_params}
        if category_filter:
            combined_preferences['category'] = category_filter
        
        logger.info(f"📊 Processing preferences: Theme={combined_preferences.get('weddingTheme')}, "
                   f"Budget={combined_preferences.get('budgetRange')}, "
                   f"Guests={combined_preferences.get('guestCount')}")
        
        # Generate user preference embeddings
        user_embeddings = rag_search_engine.generate_user_preference_embeddings(combined_preferences)
        
        # Perform semantic search
        search_results = await rag_search_engine.semantic_vendor_search(
            user_embeddings, 
            combined_preferences, 
            top_k
        )
        
        # Organize results by category
        categorized_results = {}
        for vendor in search_results:
            category = vendor['category']
            if category not in categorized_results:
                categorized_results[category] = []
            categorized_results[category].append(vendor)
        
        # Calculate analytics
        avg_composite_score = np.mean([v['rag_scores']['composite_score'] for v in search_results]) if search_results else 0
        avg_final_score = np.mean([v['rag_scores']['final_score'] for v in search_results]) if search_results else 0
        
        response_data = {
            'success': True,
            'vendors': search_results,
            'categorized_vendors': categorized_results,
            'total_found': len(search_results),
            'rag_analytics': {
                'search_method': 'semantic_embedding_search',
                'embedding_models_used': ['all-MiniLM-L6-v2', 'paraphrase-multilingual-MiniLM-L12-v2'],
                'average_composite_score': round(avg_composite_score, 3),
                'average_final_score': round(avg_final_score, 3),
                'preference_weights': user_embeddings.preference_weights,
                'search_timestamp': datetime.now().isoformat()
            },
            'search_context': {
                'user_preferences_processed': len([k for k, v in combined_preferences.items() if v]),
                'filters_applied': combined_preferences,
                'semantic_matching_enabled': True
            }
        }
        
        logger.info(f"✅ RAG search successful: {len(search_results)} vendors, "
                   f"avg score: {avg_final_score:.3f}")
        
        return JSONResponse(response_data)
        
    except Exception as e:
        logger.error(f"❌ RAG vendor search error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'fallback_message': 'RAG search failed, consider using fallback search method',
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/preference-similarity-analysis")
async def analyze_preference_similarity(request: Request):
    """Analyze similarity between user preferences and vendor profiles"""
    try:
        data = await request.json()
        wedding_preferences = data.get('preferences', {})
        vendor_id = data.get('vendorId')
        
        # Generate user embeddings
        user_embeddings = rag_search_engine.generate_user_preference_embeddings(wedding_preferences)
        
        # Analyze similarity with specific vendor or all vendors
        if vendor_id:
            # Analyze specific vendor
            vendor_analysis = await analyze_vendor_similarity(user_embeddings, vendor_id)
            return JSONResponse({
                'success': True,
                'vendor_analysis': vendor_analysis
            })
        else:
            # General analysis
            return JSONResponse({
                'success': True,
                'preference_profile': {
                    'style_elements_processed': len([k for k, v in wedding_preferences.items() if 'style' in k.lower() and v]),
                    'cultural_elements_processed': len([k for k, v in wedding_preferences.items() if 'cultural' in k.lower() and v]),
                    'service_elements_processed': len([k for k, v in wedding_preferences.items() if 'service' in k.lower() and v]),
                    'preference_weights': user_embeddings.preference_weights
                }
            })
        
    except Exception as e:
        logger.error(f"❌ Preference similarity analysis error: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e)
        }, status_code=500)

@app.get("/api/rag-system-health")
async def rag_system_health():
    """Health check for RAG system components"""
    try:
        # Check vector database collections
        style_count = rag_search_engine.style_collection.count()
        service_count = rag_search_engine.service_collection.count()
        cultural_count = rag_search_engine.cultural_collection.count()
        
        # Check embedding models
        test_text = "test embedding generation"
        style_embedding = rag_search_engine.style_model.encode(test_text)
        semantic_embedding = rag_search_engine.semantic_model.encode(test_text)
        
        return JSONResponse({
            'status': 'healthy',
            'rag_components': {
                'vector_database': 'operational',
                'embedding_models': 'operational',
                'style_collection_count': style_count,
                'service_collection_count': service_count,
                'cultural_collection_count': cultural_count,
                'style_embedding_dims': len(style_embedding),
                'semantic_embedding_dims': len(semantic_embedding)
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ RAG system health check error: {e}")
        return JSONResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting RAG-Enhanced Vendor Search API...")
    logger.info("=" * 60)
    logger.info("🧠 AI/ML Components: Sentence Transformers + ChromaDB")
    logger.info("🔍 Search Method: Semantic Vector Embeddings")
    logger.info("📊 Collections: Style, Service, Cultural Profiles")
    logger.info("🌐 API Endpoint: http://0.0.0.0:5003")
    logger.info("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=5003, log_level="info")
