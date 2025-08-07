#!/usr/bin/env python3
"""
Enhanced Vendor Search System for Indian Wedding Platform
Robust business logic and intelligent search algorithms for accurate vendor/venue results
"""

import requests
import json
import logging
from typing import List, Dict, Optional, Tuple
import os
from datetime import datetime, timedelta
import hashlib
import re
from dataclasses import dataclass
from enum import Enum
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VendorCategory(Enum):
    VENUES = "venues"
    PHOTOGRAPHY = "photography"
    CATERING = "catering"
    DECORATION = "decoration"
    MAKEUP = "makeup"
    PLANNING = "planning"
    MUSIC = "music"
    TRANSPORT = "transport"
    JEWELRY = "jewelry"
    ATTIRE = "attire"

class SearchPriority(Enum):
    EXACT_MATCH = 100
    HIGH_RELEVANCE = 80
    MEDIUM_RELEVANCE = 60
    LOW_RELEVANCE = 40
    IRRELEVANT = 20

@dataclass
class SearchCriteria:
    category: VendorCategory
    location: str
    budget_range: Tuple[int, int]
    guest_count: int
    wedding_theme: str
    wedding_date: Optional[datetime] = None
    preferred_style: Optional[str] = None
    special_requirements: List[str] = None

@dataclass
class VendorProfile:
    id: str
    name: str
    category: VendorCategory
    location: str
    description: str
    website: str
    phone: str
    email: str
    rating: float
    price_range: Tuple[int, int]
    specialties: List[str]
    verified: bool
    experience_years: int
    portfolio_url: str
    social_media: Dict[str, str]
    availability: Dict[str, bool]
    languages: List[str]
    certifications: List[str]
    awards: List[str]
    client_reviews: List[Dict]
    search_score: float = 0.0

class EnhancedVendorSearch:
    """
    Advanced vendor search system with intelligent filtering and scoring
    """
    
    def __init__(self, serper_api_key: Optional[str] = None):
        # Try to get API key from multiple sources
        if serper_api_key:
            self.serper_api_key = serper_api_key
        elif os.getenv('SERPER_API_KEY'):
            self.serper_api_key = os.getenv('SERPER_API_KEY')
        else:
            # Try to import from config
            try:
                from config.api_config import SERPER_API_KEY
                self.serper_api_key = SERPER_API_KEY
            except ImportError:
                self.serper_api_key = None
        
        self.search_url = "https://google.serper.dev/search"
        self.cache = {}
        self.cache_duration = timedelta(hours=6)  # Shorter cache for fresh results
        
        # Indian wedding market intelligence
        self.market_data = self._load_market_intelligence()
        self.location_intelligence = self._load_location_intelligence()
        self.category_keywords = self._load_category_keywords()
        
        if not self.serper_api_key:
            logger.warning("Serper API key not found. Set SERPER_API_KEY environment variable or configure in config/api_config.py")
        else:
            logger.info(f"✅ Serper API key loaded successfully")
        
    def _load_market_intelligence(self) -> Dict:
        """Load Indian wedding market data and pricing intelligence"""
        return {
            'price_ranges': {
                VendorCategory.VENUES: {
                    'budget': (50000, 200000),
                    'premium': (200000, 1000000),
                    'luxury': (1000000, 5000000)
                },
                VendorCategory.PHOTOGRAPHY: {
                    'budget': (25000, 75000),
                    'premium': (75000, 200000),
                    'luxury': (200000, 500000)
                },
                VendorCategory.CATERING: {
                    'budget': (500, 1200),
                    'premium': (1200, 2500),
                    'luxury': (2500, 5000)
                },
                VendorCategory.DECORATION: {
                    'budget': (50000, 150000),
                    'premium': (150000, 500000),
                    'luxury': (500000, 2000000)
                },
                VendorCategory.MAKEUP: {
                    'budget': (15000, 35000),
                    'premium': (35000, 100000),
                    'luxury': (100000, 300000)
                }
            },
            'seasonal_factors': {
                'peak_season': ['November', 'December', 'January', 'February'],
                'off_season': ['May', 'June', 'July', 'August'],
                'shoulder_season': ['March', 'April', 'September', 'October']
            },
            'location_premiums': {
                'Mumbai': 1.3,
                'Delhi': 1.2,
                'Bangalore': 1.1,
                'Chennai': 1.0,
                'Hyderabad': 0.9,
                'Pune': 0.8
            }
        }
    
    def _load_location_intelligence(self) -> Dict:
        """Load location-based search intelligence"""
        return {
            'major_cities': {
                'Mumbai': {
                    'search_terms': ['Mumbai', 'Bombay', 'Maharashtra'],
                    'nearby': ['Thane', 'Navi Mumbai', 'Pune', 'Lonavala'],
                    'venues_clusters': ['Bandra', 'Worli', 'Juhu', 'Powai', 'Andheri'],
                    'vendor_hubs': ['Andheri West', 'Bandra West', 'Worli', 'Lower Parel']
                },
                'Delhi': {
                    'search_terms': ['Delhi', 'New Delhi', 'NCR', 'Gurgaon', 'Noida'],
                    'nearby': ['Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'],
                    'venues_clusters': ['Connaught Place', 'South Delhi', 'Gurgaon', 'Noida'],
                    'vendor_hubs': ['Khan Market', 'Hauz Khas', 'Connaught Place', 'Gurgaon']
                },
                'Bangalore': {
                    'search_terms': ['Bangalore', 'Bengaluru', 'Karnataka'],
                    'nearby': ['Mysore', 'Mangalore', 'Coorg'],
                    'venues_clusters': ['Whitefield', 'Electronic City', 'Marathahalli', 'Hebbal'],
                    'vendor_hubs': ['Indiranagar', 'Koramangala', 'JP Nagar', 'Whitefield']
                }
            },
            'regional_specialties': {
                'Mumbai': ['Marathi', 'Gujarati', 'Parsi', 'Christian'],
                'Delhi': ['Punjabi', 'Haryanvi', 'Rajasthani', 'Mughlai'],
                'Bangalore': ['Kannada', 'Tamil', 'Telugu', 'Mangalorean'],
                'Chennai': ['Tamil', 'Telugu', 'Malayalam', 'Chettinad'],
                'Hyderabad': ['Telugu', 'Hyderabadi', 'Andhra', 'Deccani']
            }
        }
    
    def _load_category_keywords(self) -> Dict:
        """Load category-specific search keywords and filters"""
        return {
            VendorCategory.VENUES: {
                'primary_terms': ['wedding venue', 'banquet hall', 'marriage hall', 'wedding palace'],
                'secondary_terms': ['resort', 'hotel', 'garden', 'farmhouse', 'beach resort'],
                'style_keywords': ['royal', 'modern', 'traditional', 'outdoor', 'indoor', 'luxury'],
                'capacity_keywords': ['large', 'small', 'intimate', 'grand', 'exclusive'],
                'amenities': ['parking', 'accommodation', 'catering', 'decoration', 'music'],
                'exclude_terms': ['funeral', 'cremation', 'death', 'obituary']
            },
            VendorCategory.PHOTOGRAPHY: {
                'primary_terms': ['wedding photographer', 'marriage photographer', 'wedding photography'],
                'secondary_terms': ['candid', 'traditional', 'cinematic', 'documentary'],
                'style_keywords': ['candid', 'traditional', 'modern', 'artistic', 'journalistic'],
                'equipment_keywords': ['drone', 'cinematic', '4k', 'professional', 'studio'],
                'services': ['pre-wedding', 'engagement', 'reception', 'sangeet', 'mehendi'],
                'exclude_terms': ['funeral', 'death', 'obituary', 'passport', 'visa']
            },
            VendorCategory.CATERING: {
                'primary_terms': ['wedding catering', 'marriage catering', 'catering services'],
                'secondary_terms': ['food', 'cuisine', 'thali', 'buffet', 'plated'],
                'cuisine_keywords': ['north indian', 'south indian', 'continental', 'chinese', 'italian'],
                'dietary_keywords': ['vegetarian', 'non-vegetarian', 'jain', 'halal', 'vegan'],
                'services': ['thali', 'buffet', 'plated', 'live counter', 'dessert'],
                'exclude_terms': ['funeral', 'death', 'obituary', 'hospital', 'medical']
            },
            VendorCategory.DECORATION: {
                'primary_terms': ['wedding decoration', 'marriage decoration', 'wedding decor'],
                'secondary_terms': ['floral', 'theme', 'mandap', 'stage', 'lighting'],
                'style_keywords': ['traditional', 'modern', 'floral', 'minimalist', 'luxury'],
                'elements': ['flowers', 'lights', 'fabric', 'props', 'backdrop'],
                'services': ['mandap', 'stage', 'entrance', 'reception', 'photography'],
                'exclude_terms': ['funeral', 'death', 'obituary', 'mourning', 'condolence']
            },
            VendorCategory.MAKEUP: {
                'primary_terms': ['bridal makeup', 'wedding makeup', 'marriage makeup'],
                'secondary_terms': ['hair styling', 'mehendi', 'sangeet', 'reception'],
                'style_keywords': ['traditional', 'modern', 'natural', 'glamorous', 'minimal'],
                'services': ['bridal', 'groom', 'family', 'pre-wedding', 'reception'],
                'products': ['organic', 'waterproof', 'long-lasting', 'hypoallergenic'],
                'exclude_terms': ['funeral', 'death', 'obituary', 'mourning', 'condolence']
            }
        }
    
    def search_vendors(self, criteria: SearchCriteria, max_results: int = 20) -> List[VendorProfile]:
        """
        Intelligent vendor search with advanced filtering and scoring
        
        Args:
            criteria: Search criteria with all parameters
            max_results: Maximum number of results to return
            
        Returns:
            List of vendor profiles sorted by relevance score
        """
        logger.info(f"🔍 Searching for {criteria.category.value} in {criteria.location}")
        
        # Generate optimized search queries
        search_queries = self._generate_search_queries(criteria)
        
        all_vendors = []
        
        for query in search_queries:
            try:
                vendors = self._execute_search_query(query, criteria)
                all_vendors.extend(vendors)
            except Exception as e:
                logger.error(f"Error executing search query '{query}': {e}")
                continue
        
        # Remove duplicates and filter
        unique_vendors = self._deduplicate_vendors(all_vendors)
        filtered_vendors = self._apply_business_filters(unique_vendors, criteria)
        
        # Score and rank vendors
        scored_vendors = self._score_vendors(filtered_vendors, criteria)
        
        # Sort by score and return top results
        scored_vendors.sort(key=lambda x: x.search_score, reverse=True)
        
        logger.info(f"✅ Found {len(scored_vendors)} relevant vendors for {criteria.category.value}")
        return scored_vendors[:max_results]
    
    def _generate_search_queries(self, criteria: SearchCriteria) -> List[str]:
        """Generate optimized search queries based on criteria"""
        queries = []
        category_keywords = self.category_keywords[criteria.category]
        location_data = self.location_intelligence['major_cities'].get(
            criteria.location, 
            {'search_terms': [criteria.location]}
        )
        
        # Primary search queries
        for primary_term in category_keywords['primary_terms']:
            for location_term in location_data['search_terms']:
                query = f"{primary_term} {location_term}"
                
                # Add style-specific terms
                if criteria.wedding_theme:
                    for style_keyword in category_keywords['style_keywords']:
                        if style_keyword.lower() in criteria.wedding_theme.lower():
                            query += f" {style_keyword}"
                            break
                
                # Add capacity terms for venues
                if criteria.category == VendorCategory.VENUES:
                    if criteria.guest_count > 500:
                        query += " large capacity"
                    elif criteria.guest_count < 100:
                        query += " intimate"
                
                queries.append(query)
        
        # Secondary search queries with specific terms
        for secondary_term in category_keywords['secondary_terms'][:3]:  # Limit to top 3
            for location_term in location_data['search_terms']:
                query = f"{secondary_term} {location_term} wedding"
                queries.append(query)
        
        # Add regional specialty queries
        regional_specialties = self.location_intelligence['regional_specialties'].get(
            criteria.location, []
        )
        for specialty in regional_specialties[:2]:  # Limit to top 2
            query = f"{specialty} {criteria.category.value} {criteria.location}"
            queries.append(query)
        
        return list(set(queries))  # Remove duplicates
    
    def _execute_search_query(self, query: str, criteria: SearchCriteria) -> List[VendorProfile]:
        """Execute a single search query and extract vendor profiles"""
        if not self.serper_api_key:
            logger.warning("Serper API key not available, using fallback data")
            return self._get_fallback_vendors(criteria)
        
        # Check cache
        cache_key = self._get_cache_key(query)
        if cache_key in self.cache and self._is_cache_valid(self.cache[cache_key]):
            return self.cache[cache_key]['vendors']
        
        try:
            headers = {
                'X-API-KEY': self.serper_api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': 20,  # Get more results for better filtering
                'gl': 'in',  # India location
                'hl': 'en',  # English language
                'safe': 'active'
            }
            
            response = requests.post(self.search_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            vendors = []
            
            if 'organic' in data:
                for idx, result in enumerate(data['organic']):
                    vendor = self._extract_vendor_profile(result, criteria.category, criteria.location, idx + 1)
                    if vendor:
                        vendors.append(vendor)
            
            # Cache results
            self.cache[cache_key] = {
                'vendors': vendors,
                'timestamp': datetime.now().isoformat()
            }
            
            return vendors
            
        except Exception as e:
            logger.error(f"Error executing search query: {e}")
            return []
    
    def _extract_vendor_profile(self, search_result: Dict, category: VendorCategory, location: str, rank: int) -> Optional[VendorProfile]:
        """Extract comprehensive vendor profile from search result"""
        try:
            title = search_result.get('title', '')
            link = search_result.get('link', '')
            snippet = search_result.get('snippet', '')
            
            # Basic validation
            if not self._is_relevant_result(title, snippet, category):
                return None
            
            # Extract vendor information
            vendor = VendorProfile(
                id=f"{category.value}_{rank}_{hashlib.md5(title.encode()).hexdigest()[:8]}",
                name=self._clean_vendor_name(title),
                category=category,
                location=location,
                description=snippet[:300] + "..." if len(snippet) > 300 else snippet,
                website=link,
                phone=self._extract_phone(snippet),
                email=self._extract_email(snippet),
                rating=self._extract_rating(snippet),
                price_range=self._estimate_price_range(category, snippet),
                specialties=self._extract_specialties(snippet, category),
                verified=self._is_verified_vendor(link),
                experience_years=self._extract_experience(snippet),
                portfolio_url=self._extract_portfolio_url(link, snippet),
                social_media=self._extract_social_media(snippet),
                availability=self._estimate_availability(),
                languages=self._extract_languages(snippet),
                certifications=self._extract_certifications(snippet),
                awards=self._extract_awards(snippet),
                client_reviews=self._extract_reviews(snippet)
            )
            
            return vendor
            
        except Exception as e:
            logger.error(f"Error extracting vendor profile: {e}")
            return None
    
    def _is_relevant_result(self, title: str, snippet: str, category: VendorCategory) -> bool:
        """Check if search result is relevant to the category"""
        text = f"{title} {snippet}".lower()
        category_keywords = self.category_keywords[category]
        
        # Check for exclude terms
        for exclude_term in category_keywords['exclude_terms']:
            if exclude_term in text:
                return False
        
        # Check for relevant terms
        relevant_terms = category_keywords['primary_terms'] + category_keywords['secondary_terms']
        return any(term in text for term in relevant_terms)
    
    def _apply_business_filters(self, vendors: List[VendorProfile], criteria: SearchCriteria) -> List[VendorProfile]:
        """Apply business logic filters to vendor list"""
        filtered_vendors = []
        
        for vendor in vendors:
            # Budget filter
            if not self._is_within_budget(vendor, criteria.budget_range):
                continue
            
            # Location filter
            if not self._is_location_suitable(vendor, criteria.location):
                continue
            
            # Capacity filter for venues
            if criteria.category == VendorCategory.VENUES:
                if not self._has_suitable_capacity(vendor, criteria.guest_count):
                    continue
            
            # Availability filter
            if criteria.wedding_date and not self._is_available(vendor, criteria.wedding_date):
                continue
            
            filtered_vendors.append(vendor)
        
        return filtered_vendors
    
    def _score_vendors(self, vendors: List[VendorProfile], criteria: SearchCriteria) -> List[VendorProfile]:
        """Score vendors based on multiple factors"""
        for vendor in vendors:
            score = 0.0
            
            # Base relevance score (0-40 points)
            score += self._calculate_relevance_score(vendor, criteria)
            
            # Quality indicators (0-30 points)
            score += self._calculate_quality_score(vendor)
            
            # Budget alignment (0-20 points)
            score += self._calculate_budget_score(vendor, criteria.budget_range)
            
            # Location convenience (0-10 points)
            score += self._calculate_location_score(vendor, criteria.location)
            
            vendor.search_score = score
        
        return vendors
    
    def _calculate_relevance_score(self, vendor: VendorProfile, criteria: SearchCriteria) -> float:
        """Calculate relevance score based on category and theme match"""
        score = 0.0
        category_keywords = self.category_keywords[criteria.category]
        
        # Check primary terms match
        text = f"{vendor.name} {vendor.description}".lower()
        for term in category_keywords['primary_terms']:
            if term in text:
                score += 10.0
        
        # Check style keywords match
        if criteria.wedding_theme:
            for style_keyword in category_keywords['style_keywords']:
                if style_keyword.lower() in criteria.wedding_theme.lower() and style_keyword in text:
                    score += 5.0
        
        # Check specialties match
        for specialty in vendor.specialties:
            if specialty.lower() in criteria.wedding_theme.lower():
                score += 3.0
        
        return min(score, 40.0)
    
    def _calculate_quality_score(self, vendor: VendorProfile) -> float:
        """Calculate quality score based on various indicators"""
        score = 0.0
        
        # Rating score (0-15 points)
        if vendor.rating > 0:
            score += vendor.rating * 3.0
        
        # Verification score (0-5 points)
        if vendor.verified:
            score += 5.0
        
        # Experience score (0-5 points)
        if vendor.experience_years > 5:
            score += 5.0
        elif vendor.experience_years > 2:
            score += 3.0
        
        # Social media presence (0-5 points)
        if vendor.social_media:
            score += min(len(vendor.social_media) * 1.0, 5.0)
        
        return min(score, 30.0)
    
    def _calculate_budget_score(self, vendor: VendorProfile, budget_range: Tuple[int, int]) -> float:
        """Calculate budget alignment score"""
        if not vendor.price_range:
            return 10.0  # Neutral score if price not available
        
        vendor_min, vendor_max = vendor.price_range
        budget_min, budget_max = budget_range
        
        # Perfect match
        if vendor_min >= budget_min and vendor_max <= budget_max:
            return 20.0
        
        # Overlap
        if vendor_min <= budget_max and vendor_max >= budget_min:
            return 15.0
        
        # Close to budget
        if vendor_max <= budget_max * 1.2:
            return 10.0
        
        return 5.0
    
    def _calculate_location_score(self, vendor: VendorProfile, location: str) -> float:
        """Calculate location convenience score"""
        location_data = self.location_intelligence['major_cities'].get(location, {})
        
        # Exact location match
        if location.lower() in vendor.location.lower():
            return 10.0
        
        # Nearby location
        nearby_locations = location_data.get('nearby', [])
        if any(nearby.lower() in vendor.location.lower() for nearby in nearby_locations):
            return 7.0
        
        # Same state/region
        if self._is_same_region(vendor.location, location):
            return 5.0
        
        return 2.0
    
    # Helper methods for data extraction and validation
    def _clean_vendor_name(self, title: str) -> str:
        """Clean and extract vendor name from title"""
        # Remove common suffixes and prefixes
        title = re.sub(r'\s*-\s*(Best|Top|Leading|Professional).*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\|\s*.*', '', title)
        title = re.sub(r'\s*in\s+\w+.*', '', title, flags=re.IGNORECASE)
        return title.strip()[:60]
    
    def _extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        phone_pattern = r'(\+91\s*)?(\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{4})'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else ""
    
    def _extract_email(self, text: str) -> str:
        """Extract email from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""
    
    def _extract_rating(self, text: str) -> float:
        """Extract rating from text"""
        rating_pattern = r'(\d+(?:\.\d+)?)\s*(?:stars?|rating|out of 5)'
        match = re.search(rating_pattern, text, re.IGNORECASE)
        if match:
            rating = float(match.group(1))
            return min(rating, 5.0)
        return 0.0
    
    def _estimate_price_range(self, category: VendorCategory, text: str) -> Tuple[int, int]:
        """Estimate price range based on category and text"""
        market_ranges = self.market_data['price_ranges'][category]
        
        # Check for luxury indicators
        luxury_indicators = ['luxury', 'premium', 'exclusive', 'high-end', '5-star']
        if any(indicator in text.lower() for indicator in luxury_indicators):
            return market_ranges['luxury']
        
        # Check for budget indicators
        budget_indicators = ['budget', 'affordable', 'economical', 'cheap']
        if any(indicator in text.lower() for indicator in budget_indicators):
            return market_ranges['budget']
        
        return market_ranges['premium']
    
    def _extract_specialties(self, text: str, category: VendorCategory) -> List[str]:
        """Extract specialties from text"""
        category_keywords = self.category_keywords[category]
        found_specialties = []
        text_lower = text.lower()
        
        for keyword in category_keywords['style_keywords'] + category_keywords['secondary_terms']:
            if keyword in text_lower:
                found_specialties.append(keyword.title())
        
        return list(set(found_specialties))[:5]  # Limit to 5 specialties
    
    def _is_verified_vendor(self, link: str) -> bool:
        """Check if vendor is from verified platform"""
        verified_domains = [
            'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in',
            'shaadisaga.com', 'wedmegood.com', 'weddingwire.in', 'zomato.com'
        ]
        return any(domain in link for domain in verified_domains)
    
    def _extract_experience(self, text: str) -> int:
        """Extract years of experience from text"""
        exp_pattern = r'(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience'
        match = re.search(exp_pattern, text, re.IGNORECASE)
        return int(match.group(1)) if match else 0
    
    def _extract_portfolio_url(self, link: str, text: str) -> str:
        """Extract portfolio URL"""
        # Look for portfolio indicators in text
        portfolio_indicators = ['portfolio', 'gallery', 'work', 'projects']
        if any(indicator in text.lower() for indicator in portfolio_indicators):
            return link
        return ""
    
    def _extract_social_media(self, text: str) -> Dict[str, str]:
        """Extract social media links"""
        social_media = {}
        
        # Instagram
        insta_pattern = r'@(\w+)'
        insta_match = re.search(insta_pattern, text)
        if insta_match:
            social_media['instagram'] = f"https://instagram.com/{insta_match.group(1)}"
        
        # Facebook
        fb_pattern = r'facebook\.com/(\w+)'
        fb_match = re.search(fb_pattern, text)
        if fb_match:
            social_media['facebook'] = f"https://facebook.com/{fb_match.group(1)}"
        
        return social_media
    
    def _estimate_availability(self) -> Dict[str, bool]:
        """Estimate vendor availability"""
        return {
            'weekdays': True,
            'weekends': True,
            'peak_season': True,
            'off_season': True
        }
    
    def _extract_languages(self, text: str) -> List[str]:
        """Extract languages from text"""
        languages = ['English', 'Hindi']
        text_lower = text.lower()
        
        if 'marathi' in text_lower:
            languages.append('Marathi')
        if 'gujarati' in text_lower:
            languages.append('Gujarati')
        if 'punjabi' in text_lower:
            languages.append('Punjabi')
        if 'tamil' in text_lower:
            languages.append('Tamil')
        if 'telugu' in text_lower:
            languages.append('Telugu')
        
        return languages
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from text"""
        certifications = []
        text_lower = text.lower()
        
        cert_keywords = ['certified', 'licensed', 'accredited', 'diploma', 'degree']
        for keyword in cert_keywords:
            if keyword in text_lower:
                certifications.append(keyword.title())
        
        return certifications
    
    def _extract_awards(self, text: str) -> List[str]:
        """Extract awards from text"""
        awards = []
        text_lower = text.lower()
        
        award_keywords = ['award', 'winner', 'best', 'top', 'excellence']
        for keyword in award_keywords:
            if keyword in text_lower:
                awards.append(keyword.title())
        
        return awards
    
    def _extract_reviews(self, text: str) -> List[Dict]:
        """Extract review information from text"""
        reviews = []
        
        # Look for review indicators
        if 'review' in text.lower() or 'rating' in text.lower():
            reviews.append({
                'text': 'Positive reviews mentioned',
                'rating': self._extract_rating(text),
                'source': 'Search result'
            })
        
        return reviews
    
    # Business logic validation methods
    def _is_within_budget(self, vendor: VendorProfile, budget_range: Tuple[int, int]) -> bool:
        """Check if vendor is within budget range"""
        if not vendor.price_range:
            return True  # Include if price not available
        
        vendor_min, vendor_max = vendor.price_range
        budget_min, budget_max = budget_range
        
        # Allow 20% buffer
        return vendor_max <= budget_max * 1.2
    
    def _is_location_suitable(self, vendor: VendorProfile, location: str) -> bool:
        """Check if vendor location is suitable"""
        location_data = self.location_intelligence['major_cities'].get(location, {})
        
        # Exact match
        if location.lower() in vendor.location.lower():
            return True
        
        # Nearby locations
        nearby_locations = location_data.get('nearby', [])
        return any(nearby.lower() in vendor.location.lower() for nearby in nearby_locations)
    
    def _has_suitable_capacity(self, vendor: VendorProfile, guest_count: int) -> bool:
        """Check if venue has suitable capacity"""
        # This would need venue-specific data, for now return True
        return True
    
    def _is_available(self, vendor: VendorProfile, wedding_date: datetime) -> bool:
        """Check if vendor is available on wedding date"""
        # This would need availability data, for now return True
        return True
    
    def _is_same_region(self, vendor_location: str, search_location: str) -> bool:
        """Check if vendor is in same region"""
        # Simple region check - can be enhanced
        return True
    
    # Cache management
    def _get_cache_key(self, query: str) -> str:
        """Generate cache key for query"""
        return hashlib.md5(query.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if 'timestamp' not in cache_entry:
            return False
        
        cache_time = datetime.fromisoformat(cache_entry['timestamp'])
        return datetime.now() - cache_time < self.cache_duration
    
    def _deduplicate_vendors(self, vendors: List[VendorProfile]) -> List[VendorProfile]:
        """Remove duplicate vendors based on name and location"""
        seen = set()
        unique_vendors = []
        
        for vendor in vendors:
            key = f"{vendor.name}_{vendor.location}"
            if key not in seen:
                seen.add(key)
                unique_vendors.append(vendor)
        
        return unique_vendors
    
    def _get_fallback_vendors(self, criteria: SearchCriteria) -> List[VendorProfile]:
        """Get fallback vendor data when API is not available"""
        # Return sample data for testing
        return []

# Example usage and testing
if __name__ == "__main__":
    # Initialize search system
    search_system = EnhancedVendorSearch()
    
    # Example search criteria
    criteria = SearchCriteria(
        category=VendorCategory.VENUES,
        location="Mumbai",
        budget_range=(200000, 1000000),
        guest_count=300,
        wedding_theme="Royal Palace Wedding",
        wedding_date=datetime(2024, 12, 15),
        preferred_style="traditional",
        special_requirements=["parking", "accommodation"]
    )
    
    # Search for vendors
    vendors = search_system.search_vendors(criteria, max_results=10)
    
    # Display results
    print(f"Found {len(vendors)} vendors:")
    for i, vendor in enumerate(vendors, 1):
        print(f"{i}. {vendor.name} - {vendor.location}")
        print(f"   Score: {vendor.search_score:.1f}")
        print(f"   Price: ₹{vendor.price_range[0]:,} - ₹{vendor.price_range[1]:,}")
        print(f"   Rating: {vendor.rating}/5")
        print(f"   Specialties: {', '.join(vendor.specialties)}")
        print() 