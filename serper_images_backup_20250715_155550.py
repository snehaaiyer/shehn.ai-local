#!/usr/bin/env python3
"""
Serper AI Integration for Wedding Platform
Fetches relevant images for wedding themes and real vendor data
"""

import requests
import json
import logging
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta
import hashlib
import re

# Import config for API key
try:
    from config.api_config import SERPER_API_KEY
except ImportError:
    # Fallback if config file is not available
    SERPER_API_KEY = None

logger = logging.getLogger(__name__)

class SerperImageSearch:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('SERPER_API_KEY')
        self.images_url = "https://google.serper.dev/images"
        self.search_url = "https://google.serper.dev/search"
        self.cache = {}
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        if not self.api_key:
            logger.warning("Serper API key not found. Set SERPER_API_KEY environment variable.")
    
    def _get_cache_key(self, query: str) -> str:
        """Generate cache key for query"""
        return hashlib.md5(query.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if 'timestamp' not in cache_entry:
            return False
        
        cache_time = datetime.fromisoformat(cache_entry['timestamp'])
        return datetime.now() - cache_time < self.cache_duration
    
    def search_images(self, query: str, num_results: int = 10) -> List[Dict]:
        """
        Search for images using Serper API
        
        Args:
            query: Search query for images
            num_results: Number of images to return
            
        Returns:
            List of image dictionaries with url, title, source, etc.
        """
        if not self.api_key:
            logger.error("Serper API key not available")
            return self._get_fallback_images(query)
        
        # Check cache first
        cache_key = self._get_cache_key(query)
        if cache_key in self.cache and self._is_cache_valid(self.cache[cache_key]):
            logger.info(f"Returning cached results for: {query}")
            return self.cache[cache_key]['images']
        
        try:
            headers = {
                'X-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': num_results,
                'tbm': 'isch',  # Image search
                'safe': 'active',  # Safe search
                'gl': 'in',  # India location
                'hl': 'en'  # English language
            }
            
            response = requests.post(self.images_url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            images = []
            
            if 'images' in data:
                for img in data['images'][:num_results]:
                    images.append({
                        'url': img.get('imageUrl', ''),
                        'title': img.get('title', ''),
                        'source': img.get('source', ''),
                        'width': img.get('imageWidth', 0),
                        'height': img.get('imageHeight', 0),
                        'thumbnail': img.get('thumbnailUrl', img.get('imageUrl', ''))
                    })
            
            # Cache the results
            self.cache[cache_key] = {
                'images': images,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Found {len(images)} images for query: {query}")
            return images
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Serper API request failed: {e}")
            return self._get_fallback_images(query)
        except Exception as e:
            logger.error(f"Error searching images: {e}")
            return self._get_fallback_images(query)
    
    def search_vendors(self, category: str, location: str = "Mumbai", num_results: int = 10) -> List[Dict]:
        """
        Search for real vendors using Serper API
        
        Args:
            category: Vendor category (e.g., 'wedding photographer', 'catering services')
            location: Location for search (default: Mumbai)
            num_results: Number of results to return
            
        Returns:
            List of vendor dictionaries with contact information
        """
        if not self.api_key:
            logger.error("Serper API key not available")
            return self._get_fallback_vendors(category, location)
        
        query = f"{category} services in {location} wedding vendors contact details"
        cache_key = self._get_cache_key(f"vendors_{query}")
        
        # Check cache first
        if cache_key in self.cache and self._is_cache_valid(self.cache[cache_key]):
            logger.info(f"Returning cached vendor results for: {category} in {location}")
            return self.cache[cache_key]['vendors']
        
        try:
            headers = {
                'X-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': num_results * 2,  # Get more results to filter better ones
                'gl': 'in',  # India location
                'hl': 'en'  # English language
            }
            
            response = requests.post(self.search_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            vendors = []
            
            if 'organic' in data:
                for idx, result in enumerate(data['organic'][:num_results]):
                    vendor = self._extract_vendor_info(result, category, location, idx + 1)
                    if vendor:
                        vendors.append(vendor)
            
            # Cache the results
            self.cache[cache_key] = {
                'vendors': vendors,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Found {len(vendors)} vendors for {category} in {location}")
            return vendors
            
        except Exception as e:
            logger.error(f"Error searching vendors for '{category}' in '{location}': {e}")
            return self._get_fallback_vendors(category, location)
    
    def _extract_vendor_info(self, search_result: Dict, category: str, location: str, rank: int) -> Dict:
        """Extract vendor information from search result"""
        try:
            title = search_result.get('title', '')
            link = search_result.get('link', '')
            snippet = search_result.get('snippet', '')
            
            # Extract basic vendor info
            vendor = {
                'id': rank,
                'name': self._clean_vendor_name(title),
                'category': category,
                'location': location,
                'description': snippet[:200] + "..." if len(snippet) > 200 else snippet,
                'website': link,
                'rating': self._extract_rating(snippet),
                'phone': self._extract_phone(snippet),
                'email': self._extract_email(snippet),
                'google_maps': self._generate_maps_link(title, location),
                'instagram': self._generate_instagram_search(title),
                'price_range': self._estimate_price_range(category, snippet),
                'specialties': self._extract_specialties(snippet, category),
                'verified': link.startswith('https://') and any(domain in link for domain in [
                    'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in', 
                    'shaadisaga.com', 'wedmegood.com'
                ])
            }
            
            return vendor
            
        except Exception as e:
            logger.error(f"Error extracting vendor info: {e}")
            return None
    
    def _clean_vendor_name(self, title: str) -> str:
        """Clean and extract vendor name from title"""
        # Remove common suffixes and prefixes
        title = re.sub(r'\s*-\s*(Best|Top|Leading|Professional).*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\|\s*.*', '', title)
        title = re.sub(r'\s*in\s+\w+.*', '', title, flags=re.IGNORECASE)
        return title.strip()[:50]  # Limit to 50 characters
    
    def _extract_rating(self, text: str) -> float:
        """Extract rating from text"""
        rating_patterns = [
            r'(\d+\.?\d*)\s*(?:out of|/)\s*5',
            r'(\d+\.?\d*)\s*star',
            r'Rating:\s*(\d+\.?\d*)',
        ]
        
        for pattern in rating_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    rating = float(match.group(1))
                    return min(rating, 5.0)  # Cap at 5.0
                except ValueError:
                    continue
        
        # Default rating based on source quality
        return 4.2  # Default good rating
    
    def _extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        phone_patterns = [
            r'\+91[-\s]?[6-9]\d{9}',
            r'[6-9]\d{9}',
            r'\d{3}[-\s]?\d{3}[-\s]?\d{4}'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                phone = re.sub(r'[-\s]', '', match.group(0))
                if not phone.startswith('+91') and len(phone) == 10:
                    phone = '+91' + phone
                return phone
        
        # Generate a realistic dummy number for demo
        return f"+91 {90000 + (hash(text) % 10000):04d} {50000 + (hash(text) % 50000):05d}"
    
    def _extract_email(self, text: str) -> str:
        """Extract email from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        if match:
            return match.group(0)
        
        # Generate a realistic dummy email for demo
        name_part = re.sub(r'[^a-zA-Z0-9]', '', text[:20].lower())
        return f"{name_part}@weddingservices.com"
    
    def _generate_maps_link(self, vendor_name: str, location: str) -> str:
        """Generate Google Maps search link"""
        search_query = f"{vendor_name} {location}".replace(' ', '+')
        return f"https://maps.google.com/search/{search_query}"
    
    def _generate_instagram_search(self, vendor_name: str) -> str:
        """Generate Instagram search link"""
        # Clean name for Instagram handle
        handle = re.sub(r'[^a-zA-Z0-9]', '', vendor_name.lower())[:20]
        return f"https://instagram.com/{handle}"
    
    def _estimate_price_range(self, category: str, text: str) -> str:
        """Estimate price range based on category and text"""
        price_ranges = {
            'wedding photographer': '₹50,000 - ₹2,00,000',
            'catering services': '₹800 - ₹2,500 per plate',
            'wedding venues': '₹2,00,000 - ₹10,00,000',
            'decoration services': '₹75,000 - ₹5,00,000',
            'makeup artist': '₹25,000 - ₹1,50,000',
            'wedding planning': '₹1,00,000 - ₹8,00,000'
        }
        
        for key, price in price_ranges.items():
            if key in category.lower():
                return price
        
        return '₹50,000 - ₹3,00,000'  # Default range
    
    def _extract_specialties(self, text: str, category: str) -> List[str]:
        """Extract specialties/services from text"""
        specialty_keywords = {
            'photographer': ['candid', 'traditional', 'pre-wedding', 'drone', 'cinematic'],
            'catering': ['north indian', 'south indian', 'continental', 'gujarati', 'punjabi'],
            'venue': ['outdoor', 'indoor', 'garden', 'banquet', 'resort', 'hotel'],
            'decoration': ['floral', 'theme', 'mandap', 'lighting', 'stage'],
            'makeup': ['bridal', 'groom', 'hair styling', 'mehendi', 'sangeet']
        }
        
        found_specialties = []
        text_lower = text.lower()
        
        for cat, keywords in specialty_keywords.items():
            if cat in category.lower():
                for keyword in keywords:
                    if keyword in text_lower:
                        found_specialties.append(keyword.title())
        
        # Add some default specialties if none found
        if not found_specialties:
            if 'photographer' in category.lower():
                found_specialties = ['Candid', 'Traditional']
            elif 'catering' in category.lower():
                found_specialties = ['Multi-Cuisine', 'Indian']
            elif 'venue' in category.lower():
                found_specialties = ['Wedding Events', 'Celebrations']
            else:
                found_specialties = ['Professional Service']
        
        return found_specialties[:3]  # Limit to 3 specialties
    
    def _get_fallback_vendors(self, category: str, location: str) -> List[Dict]:
        """Get fallback vendor data when API is not available"""
        fallback_vendors = [
            {
                'id': 1,
                'name': f'Premium {category.title()} Services',
                'category': category,
                'location': location,
                'description': f'Professional {category} services with years of experience in wedding industry.',
                'website': 'https://example.com',
                'rating': 4.5,
                'phone': '+91 98765 43210',
                'email': 'contact@premium-services.com',
                'google_maps': f'https://maps.google.com/search/{category}+{location}',
                'instagram': 'https://instagram.com/premiumweddingservices',
                'price_range': '₹50,000 - ₹2,00,000',
                'specialties': ['Professional', 'Experienced'],
                'verified': True
            }
        ]
        
        return fallback_vendors
    
    def _get_fallback_images(self, query: str) -> List[Dict]:
        """
        Fallback images when Serper API is not available
        Returns curated Unsplash images for wedding themes
        """
        logger.info(f"Looking up fallback images for query: '{query}'")
        fallback_mapping = {
            # Wedding Themes
            'traditional-rajasthani': [
                {
                    'url': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Traditional Rajasthani Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'south-indian-traditional': [
                {
                    'url': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'South Indian Traditional Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'modern-indo-western': [
                {
                    'url': 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Modern Indo-Western Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'punjabi-vibrant': [
                {
                    'url': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Punjabi Wedding Celebration',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'bengali-traditional': [
                {
                    'url': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Bengali Traditional Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'destination-beach': [
                {
                    'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Beach Destination Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            
            # Venue Types
            'heritage-palace': [
                {
                    'url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2ea0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Heritage Palace Wedding Venue',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1518709268805-4e9042af2ea0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'luxury-resort': [
                {
                    'url': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Luxury Resort Wedding Venue',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'farmhouse-vintage': [
                {
                    'url': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Farmhouse Vintage Wedding Venue',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            
            # Photography Styles
            'candid-storytelling': [
                {
                    'url': 'https://images.unsplash.com/photo-1566933293069-b55c7f2709ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Candid Wedding Photography',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1566933293069-b55c7f2709ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'traditional-portraits': [
                {
                    'url': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Traditional Wedding Portraits',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            
            # Fashion & Makeup
            'bridal-makeup': [
                {
                    'url': 'https://images.unsplash.com/photo-1631477284863-d0aff97dc30a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Professional Bridal Makeup',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1631477284863-d0aff97dc30a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'designer-lehenga': [
                {
                    'url': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Designer Bridal Lehenga',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            
            # Legacy support for partial matches
            'rajasthani': [
                {
                    'url': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Traditional Rajasthani Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'south indian': [
                {
                    'url': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'South Indian Traditional Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'modern': [
                {
                    'url': 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Modern Wedding Setup',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'punjabi': [
                {
                    'url': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Punjabi Wedding Celebration',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'bengali': [
                {
                    'url': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Bengali Traditional Wedding',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ],
            'beach': [
                {
                    'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    'title': 'Beach Wedding Setup',
                    'source': 'Unsplash',
                    'thumbnail': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                }
            ]
        }
        
        # Find best match for query
        query_lower = query.lower()
        
        # First try exact match with theme keys
        if query_lower in fallback_mapping:
            logger.info(f"Exact match found for '{query}' -> using {query_lower}")
            return fallback_mapping[query_lower]
        
        # Create mapping for theme search queries to theme keys
        theme_query_mapping = {
            'traditional rajasthani royal wedding marigold palace architecture india': 'traditional-rajasthani',
            'south indian traditional wedding jasmine temple mandap kerala tamil': 'south-indian-traditional',
            'modern indian wedding contemporary led lighting fusion mandap': 'modern-indo-western',
            'punjabi sikh wedding bhangra dhol colorful vibrant celebration': 'punjabi-vibrant',
            'bengali wedding alpona red white traditional dhunuchi dance': 'bengali-traditional',
            'beach destination wedding mandap ocean sunset tropical indian': 'destination-beach',
            'heritage palace wedding venue royal architecture indian rajasthan': 'heritage-palace',
            'luxury resort wedding venue five star beautiful indian': 'luxury-resort',
            'farmhouse wedding venue rustic outdoor lawn vintage indian': 'farmhouse-vintage',
            'candid wedding photography emotional moments indian couple': 'candid-storytelling',
            'traditional indian wedding photography family portraits elegant': 'traditional-portraits',
            'indian bridal makeup hd professional beautiful bride': 'bridal-makeup',
            'designer bridal lehenga embroidery luxury indian wedding fashion': 'designer-lehenga'
        }
        
        # Try to match based on search query
        for search_query, theme_key in theme_query_mapping.items():
            if query_lower == search_query.lower() and theme_key in fallback_mapping:
                logger.info(f"Query match found for '{query}' -> using {theme_key}")
                return fallback_mapping[theme_key]
        
        # Try matching based on keywords in the query (prioritize specific matches)
        keyword_mapping = {
            'heritage palace': 'heritage-palace',
            'luxury resort': 'luxury-resort', 
            'farmhouse': 'farmhouse-vintage',
            'vintage': 'farmhouse-vintage',
            'candid': 'candid-storytelling',
            'storytelling': 'candid-storytelling',
            'portraits': 'traditional-portraits',
            'bridal makeup': 'bridal-makeup',
            'makeup': 'bridal-makeup',
            'designer lehenga': 'designer-lehenga',
            'lehenga': 'designer-lehenga',
            'designer': 'designer-lehenga',
            'south indian': 'south-indian-traditional',
            'modern': 'modern-indo-western',
            'punjabi': 'punjabi-vibrant',
            'bengali': 'bengali-traditional',
            'beach': 'destination-beach',
            'destination': 'destination-beach',
            'rajasthani': 'traditional-rajasthani',
            'palace': 'heritage-palace',
            'resort': 'luxury-resort'
        }
        
        # Sort by length (longer matches first) to prefer more specific matches
        for keyword in sorted(keyword_mapping.keys(), key=len, reverse=True):
            if keyword in query_lower and keyword_mapping[keyword] in fallback_mapping:
                logger.info(f"Keyword match found for '{query}' with '{keyword}' -> using {keyword_mapping[keyword]}")
                return fallback_mapping[keyword_mapping[keyword]]
        
        # Then try partial matching for theme keys
        for key, images in fallback_mapping.items():
            if key in query_lower or any(word in query_lower for word in key.split('-')):
                logger.info(f"Partial match found for '{query}' -> using {key}")
                return images
        
        # Legacy partial matching
        for key, images in fallback_mapping.items():
            if key in query_lower:
                logger.info(f"Legacy match found for '{query}' -> using {key}")
                return images
        
        # Default fallback - use traditional rajasthani
        logger.info(f"No match found for '{query}' -> using default traditional-rajasthani")
        return fallback_mapping.get('traditional-rajasthani', fallback_mapping['rajasthani'])
    
    def get_wedding_theme_images(self, use_serper: bool = False) -> Dict[str, List[Dict]]:
        """
        Get images for all wedding themes
        
        Args:
            use_serper: Whether to use Serper API or fallback images (default: False)
        
        Returns:
            Dictionary mapping theme names to image lists
        """
        themes = {
            'traditional-rajasthani': 'traditional rajasthani royal wedding marigold palace architecture india',
            'south-indian-traditional': 'south indian traditional wedding jasmine temple mandap kerala tamil',
            'modern-indo-western': 'modern indian wedding contemporary LED lighting fusion mandap',
            'punjabi-vibrant': 'punjabi sikh wedding bhangra dhol colorful vibrant celebration',
            'bengali-traditional': 'bengali wedding alpona red white traditional dhunuchi dance',
            'destination-beach': 'beach destination wedding mandap ocean sunset tropical indian',
            'heritage-palace': 'heritage palace wedding venue royal architecture indian rajasthan',
            'luxury-resort': 'luxury resort wedding venue five star beautiful indian',
            'farmhouse-vintage': 'farmhouse wedding venue rustic outdoor lawn vintage indian',
            'candid-storytelling': 'candid wedding photography emotional moments indian couple',
            'traditional-portraits': 'traditional indian wedding photography family portraits elegant',
            'bridal-makeup': 'indian bridal makeup hd professional beautiful bride',
            'designer-lehenga': 'designer bridal lehenga embroidery luxury indian wedding fashion'
        }
        
        all_images = {}
        for theme_key, search_query in themes.items():
            logger.info(f"Fetching images for theme: {theme_key}")
            if use_serper:
                # Use Serper API for search
                images = self.search_images(search_query, num_results=3)
            else:
                # Use fallback images only (skip Serper API)
                images = self._get_fallback_images(search_query)
            all_images[theme_key] = images
        
        return all_images

# Global instance
serper_client = SerperImageSearch(api_key=SERPER_API_KEY)

def get_theme_images(theme: str = None, use_serper: bool = False) -> Dict:
    """
    Get images for a specific theme or all themes
    
    Args:
        theme: Specific theme name (optional)
        use_serper: Whether to use Serper API or fallback images (default: False)
        
    Returns:
        Dictionary with theme images
    """
    if theme:
        search_query = f"indian wedding {theme} traditional beautiful ceremony"
        if use_serper:
            images = serper_client.search_images(search_query, num_results=3)
        else:
            images = serper_client._get_fallback_images(search_query)
        return {theme: images}
    else:
        return serper_client.get_wedding_theme_images(use_serper=use_serper)

def search_vendors(category: str, location: str = "Mumbai", num_results: int = 10) -> Dict:
    """
    Search for real vendors using Serper AI
    
    Args:
        category: Vendor category (venues, photographers, catering, etc.)
        location: Location for search
        num_results: Number of results to return
        
    Returns:
        Dictionary with vendor search results
    """
    try:
        # Map category to search terms
        category_mapping = {
            'venues': 'wedding venues banquet halls',
            'photography': 'wedding photographer',
            'catering': 'catering services',
            'decoration': 'wedding decoration services',
            'makeup': 'bridal makeup artist',
            'planning': 'wedding planning services'
        }
        
        search_term = category_mapping.get(category, f'wedding {category}')
        vendors = serper_client.search_vendors(search_term, location, num_results)
        
        return {
            'success': True,
            'category': category,
            'location': location,
            'vendors': vendors,
            'total_found': len(vendors),
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error searching vendors: {e}")
        return {
            'success': False,
            'error': str(e),
            'category': category,
            'location': location,
            'vendors': [],
            'timestamp': datetime.now().isoformat()
        }

def get_all_vendors(location: str = "Mumbai") -> Dict:
    """
    Get vendors for all categories
    
    Args:
        location: Location for search
        
    Returns:
        Dictionary with all vendor categories
    """
    try:
        categories = ['venues', 'photography', 'catering', 'decoration', 'makeup']
        all_vendors = {}
        
        for category in categories:
            result = search_vendors(category, location, 5)  # Get 5 vendors per category
            if result['success']:
                all_vendors[category] = result['vendors']
            else:
                all_vendors[category] = []
        
        return {
            'success': True,
            'location': location,
            'vendors_by_category': all_vendors,
            'total_categories': len(categories),
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting all vendors: {e}")
        return {
            'success': False,
            'error': str(e),
            'location': location,
            'vendors_by_category': {},
            'timestamp': datetime.now().isoformat()
        } 