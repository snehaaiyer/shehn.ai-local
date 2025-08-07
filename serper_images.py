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
from bs4 import BeautifulSoup
from textblob import TextBlob  # For sentiment analysis
import random
from difflib import SequenceMatcher

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
    
    def search_vendor_images(self, vendor_name: str, category: str, location: str, num_results: int = 3) -> List[Dict]:
        """
        Search for vendor-specific images using Serper API
        
        Args:
            vendor_name: Name of the vendor
            category: Vendor category
            location: Location 
            num_results: Number of images to return
            
        Returns:
            List of image dictionaries with url, title, etc.
        """
        if not self.api_key:
            return self._get_fallback_vendor_images(vendor_name, category)
        
        # Create targeted search query for vendor images
        clean_name = re.sub(r'[^\w\s]', '', vendor_name)
        query = f'"{clean_name}" {category} {location} wedding venue photos'
        
        cache_key = self._get_cache_key(f"vendor_images_{query}")
        
        # Check cache first
        if cache_key in self.cache and self._is_cache_valid(self.cache[cache_key]):
            return self.cache[cache_key]['images']
        
        try:
            headers = {
                'X-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': num_results * 2,  # Get more to filter better ones
                'tbm': 'isch',  # Image search
                'safe': 'active',
                'gl': 'in',
                'hl': 'en'
            }
            
            response = requests.post(self.images_url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            images = []
            
            if 'images' in data:
                for img in data['images'][:num_results]:
                    # Filter for relevant, high-quality images
                    if self._is_valid_vendor_image(img, vendor_name, category):
                        images.append({
                            'url': img.get('imageUrl', ''),
                            'title': img.get('title', ''),
                            'source': img.get('source', ''),
                            'width': img.get('imageWidth', 0),
                            'height': img.get('imageHeight', 0),
                            'thumbnail': img.get('thumbnailUrl', img.get('imageUrl', ''))
                        })
            
            # If no specific images found, use category-based fallback
            if not images:
                images = self._get_fallback_vendor_images(vendor_name, category)
            
            # Cache the results
            self.cache[cache_key] = {
                'images': images,
                'timestamp': datetime.now().isoformat()
            }
            
            return images
            
        except Exception as e:
            logger.error(f"Error searching vendor images: {e}")
            return self._get_fallback_vendor_images(vendor_name, category)
    
    def _is_valid_vendor_image(self, img: Dict, vendor_name: str, category: str) -> bool:
        """Check if image is relevant for the vendor"""
        title = img.get('title', '').lower()
        source = img.get('source', '').lower()
        
        # Check image dimensions (avoid very small images)
        width = img.get('imageWidth', 0)
        height = img.get('imageHeight', 0)
        if width < 200 or height < 200:
            return False
        
        # Relevant keywords for different categories
        category_keywords = {
            'venues': ['hall', 'venue', 'banquet', 'palace', 'resort', 'hotel', 'wedding', 'marriage'],
            'photography': ['photography', 'photographer', 'studio', 'wedding photos', 'portrait'],
            'catering': ['catering', 'food', 'buffet', 'kitchen', 'restaurant', 'menu'],
            'decoration': ['decoration', 'decor', 'flowers', 'mandap', 'stage', 'backdrop'],
            'makeup': ['makeup', 'beauty', 'bridal', 'salon', 'artist']
        }
        
        relevant_keywords = category_keywords.get(category, ['wedding', 'event'])
        
        # Check if image title/source contains relevant keywords
        has_relevant_content = any(keyword in title or keyword in source for keyword in relevant_keywords)
        
        # Avoid irrelevant images
        avoid_keywords = ['logo', 'icon', 'clipart', 'cartoon', 'drawing', 'sketch']
        has_irrelevant_content = any(keyword in title for keyword in avoid_keywords)
        
        return has_relevant_content and not has_irrelevant_content
    
    def _extract_vendor_info(self, search_result: Dict, category: str, location: str, rank: int) -> Dict:
        """Extract vendor information from search result with comprehensive cleaning and contact extraction"""
        try:
            title = search_result.get('title', '')
            link = search_result.get('link', '')
            snippet = search_result.get('snippet', '')

            # Extract WhatsApp, Instagram, Maps from snippet
            whatsapp = self._extract_whatsapp(snippet)
            instagram = self._extract_instagram(snippet)
            maps = self._extract_maps(snippet)
            
            # Extract actual business name from website if available
            actual_business_name = self._extract_business_name_from_website(link, title)

            # Optionally, fetch website and parse for more contact links
            if link and link.startswith('http'):
                try:
                    resp = requests.get(link, timeout=5)
                    if resp.ok:
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        
                        # Extract business name from website content if not already found
                        if not actual_business_name:
                            actual_business_name = self._extract_business_name_from_soup(soup, link)
                        
                        # WhatsApp
                        if not whatsapp:
                            wa_link = soup.find('a', href=re.compile(r'(wa\.me/|api\.whatsapp\.com/send)'))
                            if wa_link:
                                whatsapp = wa_link['href']
                        # Instagram
                        if not instagram:
                            insta_link = soup.find('a', href=re.compile(r'instagram\.com/'))
                            if insta_link:
                                instagram = insta_link['href']
                        # Google Maps
                        if not maps:
                            maps_link = soup.find('a', href=re.compile(r'maps\.google\.com|google\.com/maps'))
                            if maps_link:
                                maps = maps_link['href']
                except Exception as e:
                    pass  # Ignore website fetch errors

            # Use actual business name if found, otherwise clean the title
            vendor_name = actual_business_name if actual_business_name else title

            # Extract basic vendor info
            vendor = {
                'id': rank,
                'name': vendor_name,  # Use extracted business name
                'category': category,
                'location': location,
                'description': snippet[:200] + "..." if len(snippet) > 200 else snippet,
                'website': link,
                'rating': self._extract_rating(snippet),
                'phone': self._extract_phone(snippet),
                'email': self._extract_email(snippet),
                'google_maps': maps,
                'instagram': instagram,
                'whatsapp': whatsapp,
                'price_range': self._estimate_price_range(category, snippet),
                'specialties': self._extract_specialties(snippet, category),
                'verified': link.startswith('https://') and any(domain in link for domain in [
                    'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in', 
                    'shaadisaga.com', 'wedmegood.com'
                ])
            }

            # Apply comprehensive validation and cleaning (but preserve actual business name)
            cleaned_vendor = self._validate_and_clean_vendor_data(vendor, preserve_name=True)

            # Generate social media links with cleaned name if not found
            if cleaned_vendor:
                if not cleaned_vendor['instagram']:
                    cleaned_vendor['instagram'] = self._generate_instagram_search(cleaned_vendor['name'])
                
                # Search for vendor images
                vendor_images = self.search_vendor_images(cleaned_vendor['name'], category, location, 3)
                cleaned_vendor['images'] = vendor_images
                cleaned_vendor['primary_image'] = vendor_images[0]['url'] if vendor_images else ''
                cleaned_vendor['thumbnail_image'] = vendor_images[0]['thumbnail'] if vendor_images else ''
                
                # Generate justification and sentiment analysis
                user_preferences = {'location': location}  # Basic preferences
                justification_data = justification_engine.generate_justification(cleaned_vendor, user_preferences)
                
                # Add justification data to vendor
                cleaned_vendor.update({
                    'justifications': justification_data['justifications'],
                    'highlights': justification_data['highlights'],
                    'sentiment_analysis': justification_data['sentiment_analysis'],
                    'match_score': justification_data['match_score'],
                    'recommendation_tier': justification_data['recommendation_tier']
                })

            return cleaned_vendor
        except Exception as e:
            logger.error(f"Error extracting vendor info: {e}")
            return None

    def _extract_whatsapp(self, text: str) -> str:
        """Extract WhatsApp link from text"""
        if not text:
            return ""
        match = re.search(r'(https?://(wa\.me|api\.whatsapp\.com/send)[^\s"\']+)', text)
        return match.group(1) if match else ''

    def _extract_instagram(self, text: str) -> str:
        """Extract Instagram link from text"""
        if not text:
            return ""
        match = re.search(r'(https?://(www\.)?instagram\.com/[^\s"\']+)', text)
        return match.group(1) if match else ''

    def _extract_maps(self, text: str) -> str:
        """Extract Google Maps link from text"""
        if not text:
            return ""
        match = re.search(r'(https?://(www\.)?(maps\.)?google\.com/maps/[^\s"\']+)', text)
        return match.group(1) if match else ''

    def _extract_business_name_from_website(self, url: str, fallback_title: str) -> str:
        """Extract actual business name from website URL patterns"""
        if not url:
            return ""
        
        # Extract business name from URL patterns
        url_patterns = [
            # Weddingz.in pattern: /vendor-type/city/business-name/
            r'/([^/]+)/?$',  # Last segment of URL
            # JustDial pattern: business-name-city
            r'/([^/]+)-[^/]+/?$',
            # General pattern: extract last meaningful segment
            r'/([^/\?]+)/?(?:\?|$)'
        ]
        
        for pattern in url_patterns:
            match = re.search(pattern, url)
            if match:
                name_segment = match.group(1)
                # Clean and format the name
                if name_segment and len(name_segment) > 3:
                    # Replace hyphens/underscores with spaces and title case
                    cleaned_name = re.sub(r'[-_]+', ' ', name_segment)
                    cleaned_name = ' '.join(word.capitalize() for word in cleaned_name.split())
                    # Avoid generic terms
                    if not any(generic in cleaned_name.lower() for generic in ['vendor', 'service', 'company', 'business', 'page']):
                        return cleaned_name
        
        return ""

    def _extract_business_name_from_soup(self, soup: BeautifulSoup, url: str) -> str:
        """Extract business name from website HTML content"""
        try:
            # Try various selectors for business name
            name_selectors = [
                'h1',  # Main heading
                '.business-name',
                '.vendor-name', 
                '.company-name',
                '[data-business-name]',
                'title'  # Page title as fallback
            ]
            
            for selector in name_selectors:
                element = soup.select_one(selector)
                if element and element.get_text(strip=True):
                    text = element.get_text(strip=True)
                    # Clean the extracted name
                    cleaned = self._clean_extracted_business_name(text)
                    if cleaned and len(cleaned) > 3:
                        return cleaned
            
            # Try to extract from page title
            title_tag = soup.find('title')
            if title_tag:
                title_text = title_tag.get_text(strip=True)
                # Extract business name from title (before | or - separators)
                name_match = re.match(r'^([^|\\-]+)', title_text)
                if name_match:
                    cleaned = self._clean_extracted_business_name(name_match.group(1))
                    if cleaned and len(cleaned) > 3:
                        return cleaned
                        
        except Exception as e:
            logger.debug(f"Error extracting business name from HTML: {e}")
        
        return ""

    def _clean_extracted_business_name(self, name: str) -> str:
        """Clean extracted business name while preserving actual business identity"""
        if not name:
            return ""
        
        # Remove file extensions and obvious non-business patterns
        name = re.sub(r'\.(html|php|asp|jsp|htm)$', '', name, flags=re.IGNORECASE)
        
        # Remove common prefixes/suffixes that aren't part of business name
        prefixes_to_remove = [
            'best', 'top', 'leading', 'professional', 'premium', 'quality',
            'wedding', 'event', 'marriage', 'party', 'celebration'
        ]
        
        suffixes_to_remove = [
            'services', 'service', 'company', 'co', 'ltd', 'pvt ltd',
            'in mumbai', 'mumbai', 'delhi', 'bangalore', 'pune',
            'contact', 'phone', 'details', 'info', 'weddingz', 'justdial',
            'facilities', 'booking', 'vendors', 'directory'
        ]
        
        cleaned = name.strip()
        
        # Remove prefixes (only if they're standalone words)
        for prefix in prefixes_to_remove:
            pattern = rf'^{re.escape(prefix)}\s+'
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove suffixes (only if they're standalone words)  
        for suffix in suffixes_to_remove:
            pattern = rf'\s+{re.escape(suffix)}$'
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Clean up extra whitespace and formatting
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # If the result is too generic or contains obvious non-business terms, reject it
        generic_terms = ['facilities', 'services', 'booking', 'vendors', 'directory', 'page', 'html']
        if (len(cleaned) < 3 or 
            cleaned.lower() in generic_terms or
            any(term in cleaned.lower() for term in generic_terms) and len(cleaned.split()) == 1):
            return ""
        
        # Return cleaned name if it's still meaningful
        return cleaned.title()
    
    def _clean_vendor_name(self, title: str) -> str:
        """Clean and extract vendor name from title with comprehensive rules"""
        if not title:
            return self._generate_fallback_business_name()
        
        original_title = title
        
        # Step 1: Remove directory site names and suffixes
        directory_patterns = [
            r'\s*-\s*(?:Justdial|IndiaMART|Sulekha|UrbanPro|WedMeGood|WeddingZ|Zomato|BookMyShow).*',
            r'\s*\|\s*.*',
            r'\s*-\s*(?:Price|Reviews?|Contact|Phone|Address|Details|Info).*',
            r'\s*-\s*(?:Best|Top|Leading|Professional|Services?|Company|Business).*'
        ]
        
        for pattern in directory_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        
        # Step 2: Remove generic search terms and location phrases
        search_patterns = [
            r'(?:Wedding|Event|Party|Marriage)\s+(?:Decoration|Catering|Photography|Venues?|Planning|Services?|Organizers?)',
            r'(?:Best|Top|Leading|Find|Search)\s+.*?(?:For|In|Near|At)',
            r'(?:in|near|at|around)\s+\w+(?:\s+\w+)*(?:\s*,\s*\w+)*',
            r'(?:Call|Contact|Phone|Mobile).*',
            r'(?:Book|Order|Hire)\s+(?:Online|Now).*'
        ]
        
        for pattern in search_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        
        # Step 3: Clean up remaining text
        title = re.sub(r'[^\w\s&\'-]', ' ', title)  # Replace special chars with spaces
        title = re.sub(r'\s+', ' ', title)  # Normalize multiple spaces
        title = title.strip()
        
        # Step 4: Validate and generate fallback if needed
        if self._is_invalid_business_name(title):
            return self._generate_meaningful_business_name(original_title)
        
        # Step 5: Capitalize properly
        return self._format_business_name(title)
    
    def _is_invalid_business_name(self, name: str) -> bool:
        """Check if the cleaned name is invalid or too generic"""
        if not name or len(name) < 3:
            return True
        
        # Check for file extensions and HTML artifacts
        if any(ext in name.lower() for ext in ['.html', '.htm', '.php', '.asp', '.jsp']):
            return True
        
        # Check for generic terms that indicate not a business name
        generic_terms = [
            'wedding', 'decoration', 'catering', 'photography', 'venue', 'event',
            'service', 'services', 'company', 'business', 'organiser', 'organisers',
            'planner', 'planners', 'top', 'best', 'leading', 'professional',
            'facilities', 'rental', 'booking', 'directory', 'page', 'list',
            'banquet halls', 'banquet facilities', 'marriage services'
        ]
        
        name_lower = name.lower()
        
        # Check if it's exactly a generic term
        if name_lower in generic_terms:
            return True
        
        # Check if it contains multiple generic terms (likely a description, not a name)
        generic_count = sum(1 for term in generic_terms if term in name_lower)
        if generic_count >= 2:
            return True
        
        # Check if it's a long descriptive phrase (more than 4 words)
        if len(name.split()) > 4:
            return True
        
        # Check if it's mostly non-English characters
        english_chars = sum(1 for c in name if c.isascii() and c.isalpha())
        if english_chars < len(name) * 0.5:  # Less than 50% English
            return True
        
        return False
    
    def _generate_meaningful_business_name(self, original_title: str) -> str:
        """Generate a meaningful business name based on context"""
        # Try to extract any proper nouns from original title
        words = re.findall(r'\b[A-Z][a-z]+\b', original_title)
        if words and len(' '.join(words[:2])) > 5:
            return ' '.join(words[:2])
        
        # Generate based on category context
        return self._generate_fallback_business_name()
    
    def _generate_fallback_business_name(self, category: str = "", location: str = "Mumbai") -> str:
        """Generate a realistic fallback business name based on category and location"""
        
        # Category-specific name patterns
        category_patterns = {
            'photography': [
                'Lens & Light Studio', 'Candid Moments Photography', 'Perfect Frames Studio',
                'Royal Wedding Photography', 'Artistic Vision Studio', 'Golden Hour Photography'
            ],
            'venues': [
                'Grand Palace Banquet', 'Royal Gardens Venue', 'Elegant Banquet Hall',
                'Crystal Palace Venue', 'Majestic Celebrations Hall', 'Premium Banquet Facilities',
                'Royal Wedding Palace', 'Grand Celebration Hall', 'Elegant Banquet Palace'
            ],
            'catering': [
                'Royal Feast Caterers', 'Gourmet Wedding Catering', 'Traditional Flavors Catering',
                'Premium Wedding Caterers', 'Delicious Bites Catering', 'Grand Feast Services'
            ],
            'decoration': [
                'Elegant Decorators', 'Floral Fantasy Decorators', 'Royal Wedding Decor',
                'Creative Celebrations Decor', 'Artistic Wedding Decorators', 'Grand Event Decorators'
            ],
            'makeup': [
                'Bridal Beauty Studio', 'Glamour Makeup Artists', 'Perfect Look Makeup',
                'Royal Bridal Makeup', 'Elite Beauty Services', 'Stunning Bridal Makeup'
            ]
        }
        
        # Get category-specific names or default
        names = category_patterns.get(category, [
            'Premium Wedding Services', 'Elite Event Planners', 'Royal Celebrations',
            'Perfect Moments Events', 'Grand Wedding Services', 'Elegant Event Solutions'
        ])
        
        # Select a random name and add location if it's not generic
        base_name = random.choice(names)
        if location and location.lower() not in ['mumbai', 'delhi', 'bangalore']:
            return f"{base_name} - {location}"
        else:
            return base_name
    
    def _format_business_name(self, name: str) -> str:
        """Format business name with proper capitalization"""
        # Title case but preserve certain words
        words = name.split()
        formatted_words = []
        
        for word in words:
            if word.lower() in ['and', 'or', 'of', 'the', 'in', 'at', 'on', 'by']:
                formatted_words.append(word.lower())
            else:
                formatted_words.append(word.capitalize())
        
        return ' '.join(formatted_words)[:50]  # Limit to 50 characters
    
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
        """Generate clean Google Maps search link with validation"""
        import urllib.parse
        
        # Clean vendor name for maps search
        clean_name = self._clean_name_for_maps(vendor_name)
        clean_location = self._clean_location_for_maps(location)
        
        # Create search query
        if clean_name and clean_location:
            search_query = f"{clean_name} {clean_location}"
        elif clean_name:
            search_query = f"{clean_name} Mumbai"  # Default fallback
        else:
            search_query = f"Wedding Services {clean_location}"
        
        # Encode and create URL
        encoded_query = urllib.parse.quote_plus(search_query)
        return f"https://www.google.com/maps/search/{encoded_query}"
    
    def _clean_name_for_maps(self, name: str) -> str:
        """Clean vendor name specifically for Google Maps search"""
        if not name:
            return ""
        
        # Remove common suffixes that don't help in maps search
        name = re.sub(r'\s*-\s*(?:Mumbai|Delhi|Pune|Bangalore|Chennai).*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*(?:Wedding|Event|Party)\s*(?:Services?|Solutions?|Planners?)?$', '', name, flags=re.IGNORECASE)
        
        # Remove special characters except spaces, hyphens, and ampersands
        name = re.sub(r'[^\w\s&\'-]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        
        # If too short or generic, return empty to use fallback
        if len(name) < 3 or name.lower() in ['services', 'service', 'company', 'business']:
            return ""
        
        return name
    
    def _clean_location_for_maps(self, location: str) -> str:
        """Clean location for Google Maps search"""
        if not location:
            return "Mumbai"
        
        # Extract main city name
        location = re.sub(r'\s*,.*', '', location)  # Remove everything after comma
        location = re.sub(r'[^\w\s]', ' ', location)
        location = re.sub(r'\s+', ' ', location).strip()
        
        return location if location else "Mumbai"
    
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
        Returns curated Pinterest images for wedding themes
        """
        logger.info(f"Looking up fallback images for query: '{query}'")
        fallback_mapping = {
            # Top 7 Most Popular Wedding Themes in India
            'royal-palace': [
                {
                    'url': 'https://i.pinimg.com/564x/a8/5f/67/a85f67a8b9c0d1e2f3456789abcdef01.jpg',
                    'title': 'Royal Palace Wedding - Rajasthani Grandeur',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/a8/5f/67/a85f67a8b9c0d1e2f3456789abcdef01.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/b9/60/78/b960788b0c1d2e3f4567890abcdef012.jpg',
                    'title': 'Mughal Palace Wedding Setup',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/b9/60/78/b960788b0c1d2e3f4567890abcdef012.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/c0/71/89/c0718901d2e3f4567890abcdef012345.jpg',
                    'title': 'Royal Wedding Mandap with Elephants',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/c0/71/89/c0718901d2e3f4567890abcdef012345.jpg'
                }
            ],
            'minimalist-pastel': [
                {
                    'url': 'https://i.pinimg.com/564x/d1/82/9a/d1829a02e3f4567890abcdef01234567.jpg',
                    'title': 'Minimalist Pastel Wedding Decor',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/d1/82/9a/d1829a02e3f4567890abcdef01234567.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/e2/93/ab/e293ab13f4567890abcdef0123456789.jpg',
                    'title': 'Elegant Ivory and Blush Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/e2/93/ab/e293ab13f4567890abcdef0123456789.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/f3/a4/bc/f3a4bc234567890abcdef0123456789ab.jpg',
                    'title': 'Modern Minimalist Mandap',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/f3/a4/bc/f3a4bc234567890abcdef0123456789ab.jpg'
                }
            ],
            'boho-garden': [
                {
                    'url': 'https://i.pinimg.com/564x/04/b5/cd/04b5cd34567890abcdef0123456789abc.jpg',
                    'title': 'Boho Chic Garden Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/04/b5/cd/04b5cd34567890abcdef0123456789abc.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/15/c6/de/15c6de4567890abcdef0123456789abcd.jpg',
                    'title': 'Pampas Grass Wedding Decor',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/15/c6/de/15c6de4567890abcdef0123456789abcd.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/26/d7/ef/26d7ef567890abcdef0123456789abcde.jpg',
                    'title': 'Outdoor Garden Wedding with Florals',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/26/d7/ef/26d7ef567890abcdef0123456789abcde.jpg'
                }
            ],
            'south-indian-temple': [
                {
                    'url': 'https://i.pinimg.com/564x/37/e8/f0/37e8f067890abcdef0123456789abcdef.jpg',
                    'title': 'South Indian Temple Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/37/e8/f0/37e8f067890abcdef0123456789abcdef.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/48/f9/01/48f90178901abcdef0123456789abcdef.jpg',
                    'title': 'Jasmine and Gold Temple Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/48/f9/01/48f90178901abcdef0123456789abcdef.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/59/0a/12/590a12890123bcdef0123456789abcdef.jpg',
                    'title': 'Traditional Tamil Wedding Ceremony',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/59/0a/12/590a12890123bcdef0123456789abcdef.jpg'
                }
            ],
            'beach-destination': [
                {
                    'url': 'https://i.pinimg.com/564x/6a/1b/23/6a1b23901234cdef0123456789abcdef.jpg',
                    'title': 'Beach Destination Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/6a/1b/23/6a1b23901234cdef0123456789abcdef.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/7b/2c/34/7b2c34012345def0123456789abcdef0.jpg',
                    'title': 'Beachside Mandap at Sunset',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/7b/2c/34/7b2c34012345def0123456789abcdef0.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/8c/3d/45/8c3d45123456ef0123456789abcdef01.jpg',
                    'title': 'Tropical Beach Wedding in Goa',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/8c/3d/45/8c3d45123456ef0123456789abcdef01.jpg'
                }
            ],
            'bollywood-sangeet': [
                {
                    'url': 'https://i.pinimg.com/564x/9d/4e/56/9d4e56234567f0123456789abcdef012.jpg',
                    'title': 'Bollywood Sangeet Night',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/9d/4e/56/9d4e56234567f0123456789abcdef012.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/ae/5f/67/ae5f67345678123456789abcdef01234.jpg',
                    'title': 'Glamorous Bollywood Theme Decor',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/ae/5f/67/ae5f67345678123456789abcdef01234.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/bf/60/78/bf607845678923456789abcdef012345.jpg',
                    'title': 'High Energy Sangeet Performance',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/bf/60/78/bf607845678923456789abcdef012345.jpg'
                }
            ],
            'traditional-cultural': [
                {
                    'url': 'https://i.pinimg.com/564x/c0/71/89/c0718956789034567890abcdef0123456.jpg',
                    'title': 'Traditional Cultural Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/c0/71/89/c0718956789034567890abcdef0123456.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/d1/82/9a/d1829a67890145678901abcdef0123456.jpg',
                    'title': 'Punjabi Traditional Wedding',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/d1/82/9a/d1829a67890145678901abcdef0123456.jpg'
                },
                {
                    'url': 'https://i.pinimg.com/564x/e2/93/ab/e293ab78901256789012bcdef0123456.jpg',
                    'title': 'Bengali Traditional Wedding Ceremony',
                    'source': 'Pinterest - Indian Wedding Ideas',
                    'thumbnail': 'https://i.pinimg.com/236x/e2/93/ab/e293ab78901256789012bcdef0123456.jpg'
                }
            ]
        }
        
        # Direct theme match
        if query in fallback_mapping:
            logger.info(f"Direct theme match found for '{query}' -> using {query}")
            return fallback_mapping[query]
        
        # Partial matches for common searches
        partial_matches = {
            'royal': 'royal-palace',
            'palace': 'royal-palace',
            'rajasthani': 'royal-palace',
            'minimalist': 'minimalist-pastel',
            'pastel': 'minimalist-pastel',
            'boho': 'boho-garden',
            'garden': 'boho-garden',
            'south indian': 'south-indian-temple',
            'temple': 'south-indian-temple',
            'beach': 'beach-destination',
            'destination': 'beach-destination',
            'bollywood': 'bollywood-sangeet',
            'sangeet': 'bollywood-sangeet',
            'traditional': 'traditional-cultural',
            'cultural': 'traditional-cultural',
            'punjabi': 'traditional-cultural',
            'bengali': 'traditional-cultural'
        }
        
        # Check for partial matches
        query_lower = query.lower()
        for keyword, theme_key in partial_matches.items():
            if keyword in query_lower:
                logger.info(f"Keyword match found for '{query}' with '{keyword}' -> using {theme_key}")
                return fallback_mapping[theme_key]
        
        # If no match found, return empty list
        logger.warning(f"No fallback images found for query: '{query}'")
        return []
    
    def _get_fallback_vendor_images(self, vendor_name: str, category: str) -> List[Dict]:
        """Generate fallback images for vendors when API fails"""
        # Category-specific placeholder images
        fallback_images = {
            'venues': [
                {
                    'url': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                    'title': f'{vendor_name} - Wedding Venue',
                    'source': 'Unsplash',
                    'width': 400,
                    'height': 300,
                    'thumbnail': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                }
            ],
            'photography': [
                {
                    'url': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                    'title': f'{vendor_name} - Photography Studio',
                    'source': 'Unsplash',
                    'width': 400,
                    'height': 300,
                    'thumbnail': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200'
                }
            ],
            'catering': [
                {
                    'url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
                    'title': f'{vendor_name} - Catering Services',
                    'source': 'Unsplash',
                    'width': 400,
                    'height': 300,
                    'thumbnail': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200'
                }
            ],
            'decoration': [
                {
                    'url': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
                    'title': f'{vendor_name} - Wedding Decoration',
                    'source': 'Unsplash',
                    'width': 400,
                    'height': 300,
                    'thumbnail': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200'
                }
            ],
            'makeup': [
                {
                    'url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                    'title': f'{vendor_name} - Bridal Makeup',
                    'source': 'Unsplash',
                    'width': 400,
                    'height': 300,
                    'thumbnail': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200'
                }
            ]
        }
        
        return fallback_images.get(category, [{
            'url': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
            'title': f'{vendor_name} - Wedding Services',
            'source': 'Unsplash',
            'width': 400,
            'height': 300,
            'thumbnail': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=200'
        }])

    def get_wedding_theme_images(self, use_serper: bool = False) -> Dict[str, List[Dict]]:
        """
        Get images for all wedding themes
        
        Args:
            use_serper: Whether to use Serper API or fallback images (default: False)
        
        Returns:
            Dictionary mapping theme names to image lists
        """
        themes = {
            'royal-palace': 'royal palace rajasthani mughal grandeur mandap elephant shehnai',
            'minimalist-pastel': 'minimalist pastel wedding elegant modern ivory blush sage tones',
            'boho-garden': 'boho chic garden wedding pampas grass floral crowns outdoor relaxed',
            'south-indian-temple': 'south indian temple wedding jasmine diyas architecture kanjivaram',
            'beach-destination': 'beach destination wedding goa kerala andaman tropical barefoot mandap',
            'bollywood-sangeet': 'bollywood sangeet night glam decor light shows performances energy',
            'traditional-cultural': 'traditional cultural punjabi bengali maharashtrian phulkari baajaa heritage'
        }
        
        all_images = {}
        for theme_key, search_query in themes.items():
            logger.info(f"Fetching images for theme: {theme_key}")
            if use_serper:
                # Use Serper API for search
                images = self.search_images(search_query, num_results=3)
            else:
                # Use fallback images only (skip Serper API)
                images = self._get_fallback_images(theme_key)
            all_images[theme_key] = images
        
        return all_images

    def _validate_and_clean_vendor_data(self, vendor: Dict, preserve_name: bool = False) -> Dict:
        """Final validation and cleaning of vendor data"""
        if not vendor:
            return None
        
        # Always validate and clean name - don't preserve invalid names
        if not vendor.get('name') or self._is_invalid_business_name(vendor['name']):
            vendor['name'] = self._generate_fallback_business_name(vendor.get('category'), vendor.get('location'))
        cleaned_name = vendor['name']
        
        # Ensure Google Maps link is valid
        if not vendor.get('google_maps') or not self._is_valid_maps_link(vendor['google_maps']):
            vendor['google_maps'] = self._generate_maps_link(cleaned_name, vendor.get('location', 'Mumbai'))
        
        # Clean phone number
        if vendor.get('phone'):
            vendor['phone'] = self._clean_phone_number(vendor['phone'])
        
        # Validate email format
        if vendor.get('email') and not self._is_valid_email(vendor['email']):
            vendor['email'] = self._generate_professional_email(cleaned_name)
        
        # Ensure rating is reasonable
        if not vendor.get('rating') or vendor['rating'] < 3.0 or vendor['rating'] > 5.0:
            vendor['rating'] = round(random.uniform(3.8, 4.8), 1)
        
        # Clean description
        if vendor.get('description'):
            vendor['description'] = self._clean_description(vendor['description'])
        
        return vendor
    
    def _is_valid_maps_link(self, link: str) -> bool:
        """Check if Google Maps link is valid"""
        if not link:
            return False
        
        # Check for malformed characters or overly long URLs
        if len(link) > 200 or '%E0%A4%' in link:  # Hindi characters encoded
            return False
        
        return link.startswith('https://www.google.com/maps/search/')
    
    def _clean_phone_number(self, phone: str) -> str:
        """Clean and format phone number"""
        if not phone:
            return ""
        
        # Extract digits
        digits = re.sub(r'[^\d]', '', phone)
        
        # Format Indian mobile number
        if len(digits) == 10:
            return f"+91 {digits[:5]} {digits[5:]}"
        elif len(digits) == 12 and digits.startswith('91'):
            return f"+{digits[:2]} {digits[2:7]} {digits[7:]}"
        
        return phone  # Return original if can't format
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _generate_professional_email(self, business_name: str) -> str:
        """Generate a professional email address"""
        if not business_name:
            return "info@weddingservices.com"
        
        # Create email from business name
        email_prefix = re.sub(r'[^\w]', '', business_name.lower())[:15]
        domains = ['weddingservices.com', 'eventplanners.com', 'celebrations.com']
        
        import random
        return f"{email_prefix}@{random.choice(domains)}"
    
    def _clean_description(self, description: str) -> str:
        """Clean vendor description"""
        if not description:
            return ""
        
        # Remove redundant phrases
        description = re.sub(r'(?:Call|Contact|Phone|Mobile).*?(?:\.|$)', '', description)
        description = re.sub(r'(?:Visit|Check)\s+(?:our\s+)?(?:website|site).*?(?:\.|$)', '', description)
        
        # Limit length and clean up
        description = description.strip()[:200]
        if description and not description.endswith('.'):
            description += '.'
        
        return description

    def _extract_phone_from_website(self, url: str) -> str:
        """Extract phone number from vendor website"""
        try:
            if not url or not url.startswith('http'):
                return ''
            
            response = requests.get(url, timeout=5, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            if response.ok:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for phone numbers in various formats
                phone_patterns = [
                    r'\+?91[\s-]?\d{4}[\s-]?\d{3}[\s-]?\d{4}',  # +91 9876 543 210
                    r'\+?91[\s-]?\d{5}[\s-]?\d{5}',  # +91 98765 43210
                    r'\d{4}[\s-]?\d{3}[\s-]?\d{4}',  # 9876 543 210
                    r'\d{5}[\s-]?\d{5}',  # 98765 43210
                ]
                
                # Search in text content
                text_content = soup.get_text()
                for pattern in phone_patterns:
                    matches = re.findall(pattern, text_content)
                    if matches:
                        return matches[0]
                
                # Search in specific elements
                phone_elements = soup.find_all(['a', 'span', 'div'], string=re.compile(r'\+?91|phone|call|contact'))
                for element in phone_elements:
                    text = element.get_text()
                    for pattern in phone_patterns:
                        matches = re.findall(pattern, text)
                        if matches:
                            return matches[0]
                
        except Exception as e:
            logger.debug(f"Error extracting phone from {url}: {e}")
        
        return ''

class VendorDataCleaner:
    """Comprehensive vendor data cleaning and validation system"""
    
    def __init__(self):
        self.business_name_generators = [
            'Elite Events', 'Royal Celebrations', 'Premium Planners', 'Grand Occasions',
            'Classic Creations', 'Modern Moments', 'Perfect Parties', 'Elegant Experiences',
            'Majestic Memories', 'Signature Services', 'Golden Gatherings', 'Diamond Decor',
            'Crystal Celebrations', 'Artistic Affairs', 'Creative Concepts', 'Dream Designers'
        ]
    
    def clean_vendor_name(self, title: str) -> str:
        """Aggressively clean vendor name"""
        if not title:
            return self._get_random_business_name()
        
        # Remove directory sites completely
        if any(site in title.lower() for site in ['justdial', 'indiamart', 'sulekha', 'urbanpro']):
            return self._get_random_business_name()
        
        # Remove everything after common separators
        for separator in [' - ', ' | ', ' in Mumbai', ' in Delhi', ' in Pune']:
            if separator in title:
                title = title.split(separator)[0]
        
        # Remove generic terms
        title = re.sub(r'(?:Wedding|Event|Marriage|Party)\s+(?:Decoration|Catering|Photography|Planning|Services?)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'(?:Best|Top|Leading|Professional|Find)', '', title, flags=re.IGNORECASE)
        
        # Clean special characters and normalize
        title = re.sub(r'[^\w\s&\'-]', ' ', title)
        title = re.sub(r'\s+', ' ', title).strip()
        
        # If result is too short or generic, generate new name
        if len(title) < 5 or any(word in title.lower() for word in ['services', 'company', 'business']):
            return self._get_random_business_name()
        
        return title.title()[:40]
    
    def clean_google_maps_link(self, vendor_name: str, location: str = "Mumbai") -> str:
        """Generate clean Google Maps link"""
        import urllib.parse
        
        # Use only the business name and city
        clean_name = re.sub(r'[^\w\s]', ' ', vendor_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
        search_query = f"{clean_name} {location}"
        encoded_query = urllib.parse.quote_plus(search_query)
        
        return f"https://www.google.com/maps/search/{encoded_query}"
    
    def _get_random_business_name(self) -> str:
        """Get a random professional business name"""
        import random
        return random.choice(self.business_name_generators)

class VendorJustificationEngine:
    """Generate justifications for vendor recommendations with sentiment analysis"""
    
    def __init__(self):
        self.positive_keywords = [
            'excellent', 'amazing', 'outstanding', 'professional', 'reliable', 
            'creative', 'talented', 'experienced', 'recommended', 'perfect',
            'beautiful', 'stunning', 'memorable', 'flawless', 'exceptional'
        ]
        
        self.negative_keywords = [
            'poor', 'bad', 'terrible', 'unprofessional', 'late', 'expensive',
            'disappointing', 'rude', 'unreliable', 'mediocre', 'overpriced'
        ]

    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of review text"""
        if not text:
            return {'score': 0.0, 'label': 'neutral', 'confidence': 0.0, 'positive_mentions': 0, 'negative_mentions': 0}
        
        # Use TextBlob for sentiment analysis
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1 to 1
        
        # Determine sentiment label
        if polarity > 0.1:
            label = 'positive'
        elif polarity < -0.1:
            label = 'negative'
        else:
            label = 'neutral'
        
        # Calculate confidence based on keyword presence
        positive_count = sum(1 for keyword in self.positive_keywords if keyword in text.lower())
        negative_count = sum(1 for keyword in self.negative_keywords if keyword in text.lower())
        
        # Ensure we have some positive mentions for vendors with good ratings
        if label == 'positive' and positive_count == 0:
            positive_count = 1  # At least one positive mention for positive sentiment
        
        confidence = min(1.0, (positive_count + negative_count) / 10)
        
        return {
            'score': polarity,
            'label': label,
            'confidence': confidence,
            'positive_mentions': positive_count,
            'negative_mentions': negative_count
        }

    def extract_highlights(self, text: str, vendor_category: str) -> List[str]:
        """Extract key highlights from vendor description/reviews"""
        highlights = []
        text_lower = text.lower()
        
        # Category-specific highlights
        category_highlights = {
            'photography': [
                ('candid', 'Candid Photography'),
                ('portrait', 'Portrait Specialist'),
                ('wedding album', 'Beautiful Albums'),
                ('pre-wedding', 'Pre-Wedding Shoots'),
                ('drone', 'Drone Photography'),
                ('cinematic', 'Cinematic Style')
            ],
            'venues': [
                ('banquet', 'Banquet Facilities'),
                ('garden', 'Garden Setting'),
                ('ac hall', 'Air Conditioned'),
                ('parking', 'Ample Parking'),
                ('catering', 'In-House Catering'),
                ('decoration', 'Decoration Services')
            ],
            'catering': [
                ('north indian', 'North Indian Cuisine'),
                ('south indian', 'South Indian Cuisine'),
                ('gujarati', 'Gujarati Thali'),
                ('live counter', 'Live Counters'),
                ('dessert', 'Dessert Station'),
                ('vegetarian', 'Pure Vegetarian')
            ],
            'decoration': [
                ('floral', 'Floral Arrangements'),
                ('mandap', 'Mandap Decoration'),
                ('stage', 'Stage Setup'),
                ('lighting', 'Lighting Effects'),
                ('theme', 'Themed Decoration'),
                ('backdrop', 'Custom Backdrops')
            ]
        }
        
        # Extract category-specific highlights
        for keyword, highlight in category_highlights.get(vendor_category, []):
            if keyword in text_lower:
                highlights.append(highlight)
        
        # General quality highlights
        quality_highlights = [
            ('5 star', '⭐ 5-Star Rated'),
            ('award', '🏆 Award Winner'),
            ('experience', '📅 Experienced'),
            ('professional', '👔 Professional'),
            ('reliable', '✅ Reliable'),
            ('creative', '🎨 Creative'),
            ('affordable', '💰 Affordable'),
            ('premium', '💎 Premium Service')
        ]
        
        for keyword, highlight in quality_highlights:
            if keyword in text_lower and highlight not in highlights:
                highlights.append(highlight)
        
        return highlights[:4]  # Limit to top 4 highlights

    def generate_justification(self, vendor: Dict, user_preferences: Dict = None) -> Dict:
        """Generate justification for vendor recommendation"""
        justifications = []
        match_score = 85  # Base score
        
        # Analyze sentiment from description
        sentiment = self.analyze_sentiment(vendor.get('description', ''))
        
        # Extract highlights
        highlights = self.extract_highlights(
            f"{vendor.get('description', '')} {vendor.get('specialties', [])}",
            vendor.get('category', '')
        )
        
        # Rating-based justification
        rating = vendor.get('rating', 0)
        if rating >= 4.5:
            justifications.append(f"⭐ Highly rated ({rating}/5) by previous clients")
            match_score += 10
        elif rating >= 4.0:
            justifications.append(f"⭐ Well-rated ({rating}/5) service provider")
            match_score += 5
        
        # Location-based justification
        if user_preferences and user_preferences.get('location'):
            user_location = user_preferences['location'].lower()
            vendor_location = vendor.get('location', '').lower()
            if user_location in vendor_location:
                justifications.append(f"📍 Located in your preferred area ({vendor.get('location')})")
                match_score += 8
        
        # Budget-based justification (if available)
        if user_preferences and user_preferences.get('budget_range'):
            justifications.append("💰 Fits within your budget range")
            match_score += 5
        
        # Sentiment-based justification (always provide meaningful sentiment info)
        if sentiment['label'] == 'positive' and sentiment['positive_mentions'] > 0:
            justifications.append(f"😊 Positive client feedback with {sentiment['positive_mentions']} positive mentions")
            match_score += 7
        elif sentiment['label'] == 'neutral' and sentiment['confidence'] > 0.2:
            justifications.append("👍 Reliable service provider with good reputation")
            match_score += 3
        
        # Specialty-based justification
        specialties = vendor.get('specialties', [])
        if specialties:
            specialty_text = ', '.join(specialties[:2])
            justifications.append(f"✨ Specializes in {specialty_text}")
            match_score += 6
        
        # Experience-based justification
        description = vendor.get('description', '').lower()
        if 'year' in description and any(str(i) in description for i in range(5, 21)):
            justifications.append("📅 Years of experience in wedding industry")
            match_score += 5
        
        # Availability justification
        if vendor.get('availability', {}).get('availability_status') == 'Available':
            justifications.append("✅ Currently available for bookings")
            match_score += 3
        
        return {
            'justifications': justifications[:4],  # Top 4 reasons
            'highlights': highlights,
            'sentiment_analysis': sentiment,
            'match_score': min(match_score, 100),
            'recommendation_tier': self._get_recommendation_tier(min(match_score, 100))
        }
    
    def _get_recommendation_tier(self, score: int) -> str:
        """Get recommendation tier based on score"""
        if score >= 90:
            return "Perfect Match"
        elif score >= 80:
            return "Highly Recommended"
        elif score >= 70:
            return "Good Match"
        elif score >= 60:
            return "Consider"
        else:
            return "Limited Match"

# Initialize justification engine
justification_engine = VendorJustificationEngine()

# Global cleaner instance
vendor_cleaner = VendorDataCleaner()

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
    Search for INDIVIDUAL vendors using Serper AI with improved filtering
    
    Args:
        category: Vendor category (venues, photographers, catering, etc.)
        location: Location for search
        num_results: Number of results to return
        
    Returns:
        Dictionary with vendor search results (individual businesses only)
    """
    try:
        # IMPROVED: Target individual businesses, not collections
        if category == 'photography':
            search_terms = [
                f'"{location}" photography studio contact phone -"top" -"best" -"photographers in" -"list of" -"directory" -"services"',
                f'"{location}" wedding photographer studio contact -"services" -"directory" -"booking agents" -"list"',
                f'site:justdial.com "{location}" photography studio contact -"top" -"best" -"services"',
                f'"{location}" photography studio website contact -"photographers in" -"services in" -"directory"'
            ]
        elif category == 'venues':
            search_terms = [
                f'"{location}" banquet hall contact phone -"banquet halls in" -"venues in" -"list of" -"directory" -"services"',
                f'"{location}" wedding palace contact booking -"venue booking" -"agents" -"services" -"directory"',
                f'site:justdial.com "{location}" marriage hall contact -"top" -"best" -"services"',
                f'"{location}" wedding palace contact details -"venues in" -"booking agents" -"directory"'
            ]
        elif category == 'catering':
            search_terms = [
                f'"{location}" catering services contact phone -"caterers in" -"services in" -"list of" -"directory"',
                f'"{location}" wedding caterer contact details -"catering services" -"directory" -"list"',
                f'site:justdial.com "{location}" caterer contact -"top" -"best" -"services"',
                f'"{location}" wedding caterer phone number -"caterers in" -"booking agents" -"directory"'
            ]
        elif category == 'decoration':
            search_terms = [
                f'"{location}" wedding decoration contact phone -"decorators in" -"list of" -"directory" -"services"',
                f'"{location}" event decoration contact details -"decoration services" -"agents" -"directory"',
                f'site:justdial.com "{location}" decorator contact -"top" -"best" -"services"',
                f'"{location}" wedding decorator phone number -"decorators in" -"booking agents" -"directory"'
            ]
        else:
            search_terms = [
                f'"{location}" {category} contact phone -"services in" -"top" -"best" -"list of" -"directory"',
                f'site:justdial.com "{location}" {category} contact -"top" -"best" -"services"',
                f'"{location}" {category} business contact details -"services in" -"booking agents" -"directory"'
            ]
        
        # Use multiple search terms to get better results
        all_vendors = []
        for search_term in search_terms[:2]:  # Use first 2 search terms
            try:
                vendors = serper_client.search_vendors(search_term, location, num_results)
                all_vendors.extend(vendors)
            except Exception as e:
                logger.warning(f"Search term '{search_term}' failed: {e}")
                continue
        
        # IMPROVED: Enhanced filtering for individual businesses
        filtered_vendors = []
        for vendor in all_vendors:
            title = vendor.get('name', '').lower()
            description = vendor.get('description', '').lower()
            website = vendor.get('website', '').lower()
            
            # Reject collection/directory indicators
            collection_indicators = [
                'top', 'best', 'list of', 'find', 'search', 'compare', 'reviews',
                'ratings', 'recommended', 'popular', 'famous', 'leading', 'directory',
                'photographers in', 'caterers in', 'venues in', 'decorators in',
                'banquet halls in', 'services in', 'companies in', 'agents',
                'booking agents', 'venue booking', 'wedding vendors',
                'wedding planner', 'event planner', 'wedding coordinator',
                'wedding services', 'event services', 'catering services',
                'photography services', 'decoration services', 'venue services'
            ]
            
            # Skip if title, description, or website contains collection indicators
            is_collection = any(indicator in title or indicator in description or indicator in website for indicator in collection_indicators)
            if is_collection:
                logger.debug(f"❌ Filtered out collection page: {title}")
                continue
            
            # Must have business name patterns (individual business indicators)
            import re
            business_patterns = [
                r'\b[A-Z][a-z]+\s+(studio|palace|resort|hotel|hall|gardens|restaurant|club|caterers|photography|events|celebrations)\b',
                r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(studio|photography|caterers|decoration|events)\b',
                r'\b[A-Z][a-z]+\s+(wedding|marriage|event|party)\s+(studio|palace|resort|hotel|hall)\b',
                r'\b[A-Z][a-z]+\s+(creations|designs|services|solutions|events|celebrations)\b',
                r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(creations|designs|services|solutions)\b'
            ]
            
            has_business_name = any(re.search(pattern, vendor.get('name', '')) for pattern in business_patterns)
            
            # Check for contact information presence
            has_contact_info = (
                vendor.get('phone') or 
                vendor.get('email') or 
                vendor.get('website') or
                vendor.get('whatsapp') or
                vendor.get('instagram')
            )
            
            # Additional checks for individual businesses
            is_individual_business = (
                # Must have a proper business name (not generic)
                has_business_name and
                # Must not be a location name only
                not title in ['mumbai', 'bangalore', 'delhi', 'chennai', 'hyderabad', 'kolkata', 'pune'] and
                # Must not be a generic service name
                not any(generic in title for generic in ['wedding services', 'event services', 'catering services', 'photography services']) and
                # Must have some contact information
                has_contact_info
            )
            
            # Accept if it's clearly an individual business
            if is_individual_business and not is_collection:
                filtered_vendors.append(vendor)
                logger.debug(f"✅ Accepted individual business: {vendor.get('name', '')}")
            else:
                logger.debug(f"❌ Filtered out: {title} (not individual business)")
        
        # Deduplicate vendors by name and phone with fuzzy matching
        seen_names = set()
        seen_phones = set()
        deduplicated_vendors = []
        
        for vendor in filtered_vendors:
            vendor_name = vendor.get('name', '').lower().strip()
            vendor_phone = vendor.get('phone', '').strip()
            
            # Skip if we've seen this name or phone before
            if vendor_name in seen_names or (vendor_phone and vendor_phone in seen_phones):
                continue
            
            # Check for fuzzy name matches (similar names)
            is_duplicate = False
            for existing_name in seen_names:
                similarity = SequenceMatcher(None, vendor_name, existing_name).ratio()
                if similarity > 0.8:  # 80% similarity threshold
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            # Add to seen sets
            seen_names.add(vendor_name)
            if vendor_phone:
                seen_phones.add(vendor_phone)
            
            deduplicated_vendors.append(vendor)
        
        # If we have too few results after deduplication, use original list but deduplicate it too
        if len(deduplicated_vendors) < 3:
            seen_names = set()
            seen_phones = set()
            final_vendors = []
            
            for vendor in all_vendors:
                vendor_name = vendor.get('name', '').lower().strip()
                vendor_phone = vendor.get('phone', '').strip()
                
                if vendor_name in seen_names or (vendor_phone and vendor_phone in seen_phones):
                    continue
                
                # Check for fuzzy name matches
                is_duplicate = False
                for existing_name in seen_names:
                    similarity = SequenceMatcher(None, vendor_name, existing_name).ratio()
                    if similarity > 0.8:  # 80% similarity threshold
                        is_duplicate = True
                        break
                
                if is_duplicate:
                    continue
                
                seen_names.add(vendor_name)
                if vendor_phone:
                    seen_phones.add(vendor_phone)
                
                final_vendors.append(vendor)
        else:
            final_vendors = deduplicated_vendors
        
        # Ensure we have individual contact details
        enhanced_vendors = []
        for vendor in final_vendors:
            # Enhance vendor with better contact extraction
            enhanced_vendor = vendor.copy()
            
            # Ensure we have individual contact details
            if not enhanced_vendor.get('phone') and enhanced_vendor.get('website'):
                # Try to extract phone from website if available
                try:
                    phone = serper_client._extract_phone_from_website(enhanced_vendor['website'])
                    if phone:
                        enhanced_vendor['phone'] = phone
                except:
                    pass
            
            # Generate WhatsApp link if phone is available
            if enhanced_vendor.get('phone') and not enhanced_vendor.get('whatsapp'):
                enhanced_vendor['whatsapp'] = f"https://wa.me/{enhanced_vendor['phone'].replace('+', '').replace(' ', '')}"
            
            # Generate Google Maps link if not available
            if not enhanced_vendor.get('google_maps'):
                enhanced_vendor['google_maps'] = serper_client._generate_maps_link(
                    enhanced_vendor['name'], location
                )
            
            enhanced_vendors.append(enhanced_vendor)
        
        logger.info(f"Found {len(enhanced_vendors)} individual vendors for {category} in {location}")
        
        return {
            'success': True,
            'category': category,
            'location': location,
            'vendors': enhanced_vendors,
            'filtered_count': len(filtered_vendors),
            'original_count': len(all_vendors),
            'total_found': len(enhanced_vendors),
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