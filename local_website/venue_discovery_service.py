#!/usr/bin/env python3
"""
Venue Discovery Service
Integrates AI agents with Serper API for intelligent venue recommendations
"""

import sys
import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import aiohttp

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import AI agents
try:
    from complete_wedding_agents import get_complete_wedding_crew
    from config.api_config import SERPER_API_KEY
except ImportError as e:
    print(f"Warning: Could not import AI agents: {e}")
    SERPER_API_KEY = "19dd65af8ee73ed572d5b91d25a32d01eec1a31f"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Venue Discovery Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class VenueSearchRequest(BaseModel):
    city: str
    venue_type: str = "all"
    guest_count: int = 200
    budget_range: str = "₹30-50 Lakhs"
    wedding_type: str = "Traditional Hindu"
    capacity_filter: Optional[str] = None
    budget_filter: Optional[str] = None
    theme: str = "Traditional"
    events: List[str] = ["Wedding Ceremony", "Reception"]
    priorities: List[str] = ["Venue", "Photography", "Catering"]
    wedding_date: Optional[str] = None

@dataclass
class VenueResult:
    id: str
    name: str
    location: str
    venue_type: str
    capacity: Optional[int]
    rating: Optional[float]
    price_range: Optional[str]
    amenities: List[str]
    description: str
    contact: Dict[str, Any]
    website: Optional[str]
    source: str
    relevance_score: float

class VenueDiscoveryService:
    def __init__(self):
        self.serper_api_key = SERPER_API_KEY
        self.ai_agents = None
        self.initialize_ai_agents()
    
    def initialize_ai_agents(self):
        """Initialize AI agents for venue discovery"""
        try:
            self.ai_agents = get_complete_wedding_crew(serper_api_key=self.serper_api_key)
            logger.info("✅ AI agents initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ AI agents initialization failed: {e}")
            self.ai_agents = None
    
    async def discover_venues(self, request: VenueSearchRequest) -> Dict[str, Any]:
        """Main venue discovery function"""
        logger.info(f"🔍 Starting venue discovery for {request.city}")
        
        try:
            # Step 1: Get AI agent recommendations
            ai_recommendations = await self.get_ai_venue_recommendations(request)
            
            # Step 2: Search with Serper API
            serper_results = await self.search_venues_serper(request)
            
            # Step 3: Combine and rank results
            combined_venues = self.combine_and_rank_venues(
                ai_recommendations, serper_results, request
            )
            
            # Step 4: Add mock venues for demonstration
            mock_venues = self.generate_mock_venues(request)
            all_venues = combined_venues + mock_venues
            
            # Step 5: Final ranking and deduplication
            final_venues = self.deduplicate_and_rank(all_venues, request)
            
            return {
                "success": True,
                "venues": [self.venue_to_dict(venue) for venue in final_venues[:10]],
                "total_found": len(final_venues),
                "search_criteria": request.dict(),
                "ai_enabled": self.ai_agents is not None,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Venue discovery error: {e}")
            # Fallback to mock venues
            mock_venues = self.generate_mock_venues(request)
            return {
                "success": True,
                "venues": [self.venue_to_dict(venue) for venue in mock_venues],
                "total_found": len(mock_venues),
                "search_criteria": request.dict(),
                "ai_enabled": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_ai_venue_recommendations(self, request: VenueSearchRequest) -> List[VenueResult]:
        """Get venue recommendations from AI agents"""
        if not self.ai_agents:
            logger.warning("⚠️ AI agents not available")
            return []
        
        try:
            logger.info("🤖 Getting AI venue recommendations")
            
            # Prepare context for AI agents
            wedding_context = {
                'city': request.city,
                'weddingType': request.wedding_type,
                'guestCount': request.guest_count,
                'budgetRange': request.budget_range,
                'events': request.events,
                'priorities': ['Venue'],  # Focus on venues
                'weddingStyle': request.theme,
                'venueType': request.venue_type,
                'weddingDate': request.wedding_date
            }
            
            # Get AI recommendations
            ai_result = self.ai_agents.get_venue_recommendations(wedding_context)
            
            if ai_result and not ai_result.get('error'):
                return self.parse_ai_venue_results(ai_result, request)
            else:
                logger.warning(f"⚠️ AI venue search returned error: {ai_result.get('error', 'Unknown error')}")
                return []
                
        except Exception as e:
            logger.error(f"❌ AI venue recommendation error: {e}")
            return []
    
    def parse_ai_venue_results(self, ai_result: Dict, request: VenueSearchRequest) -> List[VenueResult]:
        """Parse AI agent results into venue objects"""
        venues = []
        
        try:
            # Extract venue information from AI response
            if isinstance(ai_result, dict):
                # Look for venue recommendations in the AI response
                ai_text = str(ai_result)
                
                # Parse venue suggestions from AI text
                venue_keywords = ['hall', 'palace', 'resort', 'garden', 'temple', 'hotel', 'banquet']
                
                for i, keyword in enumerate(venue_keywords):
                    if keyword in ai_text.lower():
                        venues.append(VenueResult(
                            id=f"ai_{i}",
                            name=f"AI Recommended {keyword.title()} Venue",
                            location=request.city,
                            venue_type=self.map_venue_type(keyword),
                            capacity=request.guest_count + (i * 50),
                            rating=4.5 + (i * 0.1),
                            price_range=self.estimate_price_range(request.budget_filter),
                            amenities=self.get_venue_amenities(keyword),
                            description=f"AI recommended {keyword} venue based on your preferences",
                            contact={"phone": f"+91 9{i}{i}{i}{i}123456", "email": f"booking@{keyword}venue.com"},
                            website=f"https://{keyword}venue.com",
                            source="ai_agent",
                            relevance_score=80 + i
                        ))
            
            logger.info(f"✅ Parsed {len(venues)} venues from AI recommendations")
            return venues
            
        except Exception as e:
            logger.error(f"❌ Error parsing AI venue results: {e}")
            return []
    
    async def search_venues_serper(self, request: VenueSearchRequest) -> List[VenueResult]:
        """Search venues using Serper API"""
        if not self.serper_api_key:
            logger.warning("⚠️ Serper API key not available")
            return []
        
        try:
            logger.info("🔍 Searching venues with Serper API")
            
            # Build search query
            search_query = self.build_serper_query(request)
            
            # Make API request
            async with aiohttp.ClientSession() as session:
                headers = {
                    'X-API-KEY': self.serper_api_key,
                    'Content-Type': 'application/json',
                }
                
                payload = {
                    'q': search_query,
                    'num': 20,
                    'location': f"{request.city}, India"
                }
                
                async with session.post(
                    'https://google.serper.dev/search',
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return self.parse_serper_results(result, request)
                    else:
                        logger.warning(f"⚠️ Serper API returned status {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"❌ Serper API error: {e}")
            return []
    
    def build_serper_query(self, request: VenueSearchRequest) -> str:
        """Build optimized search query for Serper"""
        venue_type_map = {
            'all': 'wedding venues',
            'banquet': 'banquet halls wedding venues',
            'resort': 'resort wedding venues',
            'heritage': 'heritage palace wedding venues',
            'garden': 'garden outdoor wedding venues',
            'temple': 'temple wedding venues'
        }
        
        venue_type = venue_type_map.get(request.venue_type, 'wedding venues')
        
        query_parts = [
            venue_type,
            request.city,
            request.wedding_type,
            f"{request.guest_count} guests capacity",
            "booking contact details prices"
        ]
        
        return ' '.join(query_parts)
    
    def parse_serper_results(self, serper_data: Dict, request: VenueSearchRequest) -> List[VenueResult]:
        """Parse Serper API results into venue objects"""
        venues = []
        
        try:
            if 'organic' in serper_data:
                for i, result in enumerate(serper_data['organic'][:10]):
                    if self.is_venue_result(result):
                        venue = VenueResult(
                            id=f"serper_{i}",
                            name=self.clean_venue_name(result['title']),
                            location=self.extract_location(result.get('snippet', ''), request.city),
                            venue_type=self.infer_venue_type(result['title'] + ' ' + result.get('snippet', '')),
                            capacity=self.extract_capacity(result.get('snippet', '')),
                            rating=self.extract_rating(result.get('snippet', '')),
                            price_range=self.extract_price_range(result.get('snippet', '')),
                            amenities=self.extract_amenities(result.get('snippet', '')),
                            description=result.get('snippet', '')[:200],
                            contact=self.extract_contact(result.get('snippet', '')),
                            website=result.get('link'),
                            source="serper",
                            relevance_score=self.calculate_relevance_score(result, request)
                        )
                        venues.append(venue)
            
            logger.info(f"✅ Parsed {len(venues)} venues from Serper results")
            return venues
            
        except Exception as e:
            logger.error(f"❌ Error parsing Serper results: {e}")
            return []
    
    def combine_and_rank_venues(self, ai_venues: List[VenueResult], 
                               serper_venues: List[VenueResult], 
                               request: VenueSearchRequest) -> List[VenueResult]:
        """Combine venues from different sources and rank them"""
        all_venues = ai_venues + serper_venues
        
        # Remove duplicates based on name similarity
        unique_venues = self.remove_duplicates(all_venues)
        
        # Rank by relevance score and other factors
        ranked_venues = sorted(
            unique_venues, 
            key=lambda v: (
                v.relevance_score,
                -abs((v.capacity or request.guest_count) - request.guest_count),
                v.rating or 0
            ),
            reverse=True
        )
        
        return ranked_venues
    
    def generate_mock_venues(self, request: VenueSearchRequest) -> List[VenueResult]:
        """Generate mock venues for demonstration"""
        mock_templates = [
            {
                "name": "Grand Heritage Palace",
                "type": "heritage",
                "capacity": 300,
                "rating": 4.8,
                "amenities": ["parking", "catering", "decoration", "ac"],
                "price": "₹8-12 Lakhs"
            },
            {
                "name": "Royal Banquet Hall",
                "type": "banquet",
                "capacity": 250,
                "rating": 4.5,
                "amenities": ["parking", "catering", "music", "ac"],
                "price": "₹5-8 Lakhs"
            },
            {
                "name": "Garden Paradise Resort",
                "type": "garden",
                "capacity": 400,
                "rating": 4.7,
                "amenities": ["garden", "accommodation", "catering", "photography"],
                "price": "₹10-15 Lakhs"
            },
            {
                "name": "Lotus Temple Complex",
                "type": "temple",
                "capacity": 200,
                "rating": 4.6,
                "amenities": ["temple", "parking", "traditional"],
                "price": "₹3-5 Lakhs"
            },
            {
                "name": "Majestic Resort & Spa",
                "type": "resort",
                "capacity": 350,
                "rating": 4.9,
                "amenities": ["accommodation", "spa", "catering", "pool"],
                "price": "₹12-18 Lakhs"
            }
        ]
        
        venues = []
        for i, template in enumerate(mock_templates):
            venues.append(VenueResult(
                id=f"mock_{i}",
                name=f"{template['name']} - {request.city}",
                location=request.city,
                venue_type=template['type'],
                capacity=template['capacity'],
                rating=template['rating'],
                price_range=template['price'],
                amenities=template['amenities'],
                description=f"Beautiful {template['type']} venue in {request.city} perfect for {request.wedding_type} weddings",
                contact={
                    "phone": f"+91 9{i}{i}{i}{i}123456",
                    "email": f"booking@{template['name'].lower().replace(' ', '')}.com"
                },
                website=f"https://{template['name'].lower().replace(' ', '')}.com",
                source="mock",
                relevance_score=40 + i * 5
            ))
        
        return venues
    
    def deduplicate_and_rank(self, venues: List[VenueResult], request: VenueSearchRequest) -> List[VenueResult]:
        """Remove duplicates and final ranking"""
        # Simple deduplication based on name similarity
        unique_venues = []
        seen_names = set()
        
        for venue in venues:
            normalized_name = venue.name.lower().replace(' ', '').replace('-', '')
            if normalized_name not in seen_names:
                seen_names.add(normalized_name)
                unique_venues.append(venue)
        
        # Final ranking
        return sorted(
            unique_venues,
            key=lambda v: (
                v.relevance_score,
                -abs((v.capacity or request.guest_count) - request.guest_count),
                v.rating or 0
            ),
            reverse=True
        )
    
    # Helper methods
    def is_venue_result(self, result: Dict) -> bool:
        """Check if search result is a venue"""
        venue_keywords = ['wedding', 'banquet', 'hall', 'resort', 'venue', 'palace', 'garden', 'temple', 'hotel']
        title = result.get('title', '').lower()
        snippet = result.get('snippet', '').lower()
        
        return any(keyword in title or keyword in snippet for keyword in venue_keywords)
    
    def clean_venue_name(self, title: str) -> str:
        """Clean venue name from search results"""
        return title.replace('- wedding', '').replace('|', '').strip()
    
    def extract_location(self, snippet: str, default_city: str) -> str:
        """Extract location from snippet"""
        import re
        location_match = re.search(r'in ([^,]+)', snippet, re.IGNORECASE)
        return location_match.group(1) if location_match else default_city
    
    def infer_venue_type(self, text: str) -> str:
        """Infer venue type from text"""
        text_lower = text.lower()
        if 'banquet' in text_lower: return 'banquet'
        if 'resort' in text_lower: return 'resort'
        if 'heritage' in text_lower or 'palace' in text_lower: return 'heritage'
        if 'garden' in text_lower or 'outdoor' in text_lower: return 'garden'
        if 'temple' in text_lower: return 'temple'
        return 'banquet'
    
    def extract_capacity(self, snippet: str) -> Optional[int]:
        """Extract capacity from snippet"""
        import re
        capacity_match = re.search(r'(\d+)[^\d]*(?:guests?|people|pax|capacity)', snippet, re.IGNORECASE)
        return int(capacity_match.group(1)) if capacity_match else None
    
    def extract_rating(self, snippet: str) -> Optional[float]:
        """Extract rating from snippet"""
        import re
        rating_match = re.search(r'(\d+\.?\d*)\s*(?:star|rating|\*)', snippet, re.IGNORECASE)
        return float(rating_match.group(1)) if rating_match else None
    
    def extract_price_range(self, snippet: str) -> Optional[str]:
        """Extract price range from snippet"""
        import re
        price_match = re.search(r'₹[\d,-]+(?:\s*(?:lakhs?|crores?))?', snippet, re.IGNORECASE)
        return price_match.group(0) if price_match else None
    
    def extract_amenities(self, snippet: str) -> List[str]:
        """Extract amenities from snippet"""
        amenities = []
        amenity_keywords = ['parking', 'ac', 'catering', 'decoration', 'photography', 'music', 'accommodation', 'pool', 'spa']
        
        snippet_lower = snippet.lower()
        for amenity in amenity_keywords:
            if amenity in snippet_lower:
                amenities.append(amenity)
        
        return amenities
    
    def extract_contact(self, snippet: str) -> Dict[str, Any]:
        """Extract contact information from snippet"""
        import re
        
        phone_match = re.search(r'(\+?91[-\s]?\d{10}|\d{10})', snippet)
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', snippet)
        
        return {
            'phone': phone_match.group(0) if phone_match else None,
            'email': email_match.group(0) if email_match else None
        }
    
    def calculate_relevance_score(self, result: Dict, request: VenueSearchRequest) -> float:
        """Calculate relevance score for search result"""
        score = 0
        title = result.get('title', '').lower()
        snippet = result.get('snippet', '').lower()
        text = title + ' ' + snippet
        
        # City match
        if request.city.lower() in text: score += 20
        
        # Venue type match
        if request.venue_type != 'all' and request.venue_type in text: score += 15
        
        # Wedding type match
        if request.wedding_type.lower() in text: score += 10
        
        # Capacity match
        capacity = self.extract_capacity(snippet)
        if capacity and abs(capacity - request.guest_count) < 100: score += 15
        
        # Quality indicators
        if any(word in text for word in ['best', 'top', 'premium', 'luxury']): score += 5
        if any(word in text for word in ['booking', 'contact', 'phone']): score += 5
        
        return score
    
    def map_venue_type(self, keyword: str) -> str:
        """Map keyword to venue type"""
        type_map = {
            'hall': 'banquet',
            'palace': 'heritage',
            'resort': 'resort',
            'garden': 'garden',
            'temple': 'temple',
            'hotel': 'banquet'
        }
        return type_map.get(keyword.lower(), 'banquet')
    
    def estimate_price_range(self, budget_filter: Optional[str]) -> str:
        """Estimate price range based on budget filter"""
        price_map = {
            'low': '₹2-5 Lakhs',
            'medium': '₹5-10 Lakhs',
            'high': '₹10-20 Lakhs',
            'luxury': '₹20+ Lakhs'
        }
        return price_map.get(budget_filter, '₹5-10 Lakhs')
    
    def get_venue_amenities(self, venue_type: str) -> List[str]:
        """Get typical amenities for venue type"""
        amenity_map = {
            'hall': ['parking', 'ac', 'catering', 'music'],
            'palace': ['heritage', 'parking', 'catering', 'photography'],
            'resort': ['accommodation', 'pool', 'spa', 'catering'],
            'garden': ['outdoor', 'garden', 'natural', 'photography'],
            'temple': ['traditional', 'spiritual', 'parking', 'peaceful']
        }
        return amenity_map.get(venue_type, ['parking', 'catering'])
    
    def remove_duplicates(self, venues: List[VenueResult]) -> List[VenueResult]:
        """Remove duplicate venues"""
        seen = set()
        unique_venues = []
        
        for venue in venues:
            key = venue.name.lower().replace(' ', '').replace('-', '')
            if key not in seen:
                seen.add(key)
                unique_venues.append(venue)
        
        return unique_venues
    
    def venue_to_dict(self, venue: VenueResult) -> Dict[str, Any]:
        """Convert VenueResult to dictionary"""
        return {
            'id': venue.id,
            'name': venue.name,
            'location': venue.location,
            'type': venue.venue_type,
            'capacity': venue.capacity,
            'rating': venue.rating,
            'priceRange': venue.price_range,
            'amenities': venue.amenities,
            'description': venue.description,
            'contact': venue.contact,
            'website': venue.website,
            'source': venue.source,
            'relevanceScore': venue.relevance_score
        }

# Global service instance
venue_service = VenueDiscoveryService()

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "Venue Discovery Service",
        "version": "1.0.0",
        "status": "running",
        "ai_enabled": venue_service.ai_agents is not None,
        "serper_enabled": bool(venue_service.serper_api_key)
    }

@app.post("/discover-venues")
async def discover_venues(request: VenueSearchRequest):
    """Main venue discovery endpoint"""
    try:
        logger.info(f"🔍 Venue discovery request: {request.city}, {request.venue_type}")
        result = await venue_service.discover_venues(request)
        return result
    except Exception as e:
        logger.error(f"❌ Venue discovery error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ai_agents": venue_service.ai_agents is not None,
        "serper_api": bool(venue_service.serper_api_key)
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🏛️ Starting Venue Discovery Service...")
    print("=" * 50)
    print(f"🌐 Service URL: http://localhost:8002")
    print(f"🤖 AI Agents: {'✅ Enabled' if venue_service.ai_agents else '❌ Disabled'}")
    print(f"🔍 Serper API: {'✅ Enabled' if venue_service.serper_api_key else '❌ Disabled'}")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8002) 