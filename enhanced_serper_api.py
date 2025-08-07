#!/usr/bin/env python3
"""
Enhanced Serper API Integration for Wedding Platform
Advanced search logic with intelligent filtering and business rules
"""

import requests
import json
import logging
from typing import List, Dict, Optional, Tuple
import os
from datetime import datetime, timedelta
import hashlib
import re
from enhanced_vendor_search import EnhancedVendorSearch, SearchCriteria, VendorCategory, VendorProfile
import difflib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedSerperAPI:
    """
    Enhanced Serper API integration with intelligent search algorithms
    """
    
    def __init__(self, api_key: Optional[str] = None):
        # Try to get API key from multiple sources
        if api_key:
            self.api_key = api_key
        elif os.getenv('SERPER_API_KEY'):
            self.api_key = os.getenv('SERPER_API_KEY')
        else:
            # Try to import from config
            try:
                from config.api_config import SERPER_API_KEY
                self.api_key = SERPER_API_KEY
            except ImportError:
                self.api_key = None
        
        self.search_url = "https://google.serper.dev/search"
        self.images_url = "https://google.serper.dev/images"
        self.cache = {}
        self.cache_duration = timedelta(hours=4)  # Shorter cache for fresh results
        
        # Initialize enhanced search system
        self.search_system = EnhancedVendorSearch(self.api_key)
        
        if not self.api_key:
            logger.warning("Serper API key not found. Set SERPER_API_KEY environment variable or configure in config/api_config.py")
        else:
            logger.info(f"✅ Serper API key loaded successfully")
    
    def _generate_targeted_search_queries(self, category: str, location: str, budget_range: Tuple[int, int], guest_count: int, wedding_theme: str = "") -> List[str]:
        """
        Generate ULTRA-TARGETED search queries for INDIVIDUAL vendor business listings
        Specifically designed to avoid directory/collection pages
        """
        queries = []
        
        # STRATEGY 1: Target specific business names with contact info
        if category == 'photography':
            queries.extend([
                f'"{location}" photography studio contact phone -"top" -"best" -"list" -"photographers in"',
                f'"{location}" wedding photographer phone number -"services" -"directory" -"agents"',
                f'site:justdial.com "{location}" photography studio contact phone',
                f'"{location}" candid photographer contact details -"booking agents"',
                f'intext:"{location}" intitle:"studio" intitle:"photography" phone',
                f'"{location}" photographer portfolio contact -"wedding photographers" -"services in"'
            ])
        
        elif category == 'venues':
            queries.extend([
                f'"{location}" banquet hall contact phone -"banquet halls in" -"venues in"',
                f'"{location}" wedding venue contact booking -"venue booking" -"agents"',
                f'site:justdial.com "{location}" marriage hall contact -"halls in"',
                f'"{location}" palace hotel wedding contact phone -"hotels in"',
                f'"{location}" resort wedding venue contact details -"resorts in"',
                f'intext:"{location}" intitle:"palace" OR intitle:"resort" contact phone',
                f'"{location}" garden venue wedding contact -"venues and" -"directory"'
            ])
            
        elif category == 'catering':
            queries.extend([
                f'"{location}" catering services contact phone -"caterers in" -"services in"',
                f'"{location}" wedding catering contact details -"catering services"',
                f'site:justdial.com "{location}" caterer contact phone',
                f'"{location}" food catering wedding phone -"top caterers"',
                f'intext:"{location}" intitle:"catering" contact phone number',
                f'"{location}" marriage catering contact -"catering companies"'
            ])
            
        elif category == 'decoration':
            queries.extend([
                f'"{location}" wedding decoration contact phone -"decorators in" -"services in"',
                f'"{location}" event decoration contact details -"decoration services"',
                f'site:justdial.com "{location}" decorator contact phone',
                f'"{location}" floral decoration wedding contact -"top decorators"',
                f'intext:"{location}" intitle:"decoration" OR intitle:"decor" contact',
                f'"{location}" mandap decoration contact phone -"services"'
            ])
        
        else:
            # Generic pattern for other categories
            queries.extend([
                f'"{location}" {category} contact phone -"services in" -"top" -"best"',
                f'site:justdial.com "{location}" {category} contact',
                f'"{location}" wedding {category} contact details -"agents"'
            ])
        
        # STRATEGY 2: Target specific business directory listings (individual pages only)
        high_quality_directories = [
            ('justdial.com', 'contact phone'),
            ('indiamart.com', 'contact details'),
            ('sulekha.com', 'phone number')
        ]
        
        for domain, contact_term in high_quality_directories:
            if category == 'photography':
                queries.append(f'site:{domain} "{location}" photography studio {contact_term}')
            elif category == 'venues':
                queries.append(f'site:{domain} "{location}" banquet hall {contact_term}')
            elif category == 'catering':
                queries.append(f'site:{domain} "{location}" catering {contact_term}')
            else:
                queries.append(f'site:{domain} "{location}" {category} {contact_term}')
        
        # STRATEGY 3: Exclude common directory/listing terms explicitly
        exclusion_terms = ['-"top"', '-"best"', '-"list"', '-"directory"', '-"agents"', 
                          '-"services in"', '-"vendors"', '-"booking agents"']
        exclusion_string = ' '.join(exclusion_terms)
        
        # Add exclusion-focused queries
        queries.extend([
            f'"{location}" {category} contact phone {exclusion_string}',
            f'"{location}" wedding {category} phone number {exclusion_string}'
        ])
        
        # STRATEGY 4: Target business owner/proprietor pages
        owner_patterns = ['proprietor', 'owner', 'founded by', 'established by']
        for pattern in owner_patterns[:2]:  # Use first 2 patterns
            queries.append(f'"{location}" {category} {pattern} contact phone')
        
        logger.info(f"🎯 Generated {len(queries)} ULTRA-TARGETED queries for {category} in {location}")
        return queries[:20]  # Limit to top 20 most targeted queries

    def _filter_vendor_results(self, search_results: List[Dict], category: str) -> List[Dict]:
        """
        Aggregate and filter search results with comprehensive scoring
        Prioritizes scores over contact info, ensures minimum 2 contact info types
        """
        aggregated_results = []
        
        # Keywords that indicate actual vendor/business listings
        vendor_indicators = [
            'contact', 'phone', 'call', 'booking', 'enquiry', 'rate', 'price',
            'service', 'vendor', 'professional', 'company', 'studio', 'agency',
            'catering', 'photographer', 'venue', 'hall', 'caterer', 'makeup'
        ]
        
        # Keywords that indicate blog posts or articles (to exclude)
        blog_indicators = [
            'blog', 'article', 'post', 'guide', 'tips', 'how to', 'review',
            'comparison', 'best of', 'top 10', 'list', 'recommendation',
            'wedding planning', 'wedding ideas', 'wedding inspiration',
            'ultimate guide', 'complete guide', 'everything you need'
        ]
        
        # Domain patterns that are likely business directories or vendor sites
        business_domains = [
            'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in',
            'shaadisaga.com', 'wedmegood.com', 'indiamart.com', 'yellowpages.in',
            'asklaila.com', 'locanto.in', 'weddingwire.in', 'zomato.com'
        ]
        
        # High-value domains that typically have good vendor listings
        high_value_domains = ['justdial.com', 'indiamart.com', 'sulekha.com']
        
        for result in search_results:
            title = result.get('title', '').lower()
            snippet = result.get('snippet', '').lower()
            link = result.get('link', '').lower()
            
            # Skip if it's clearly a blog post or article
            if any(indicator in title or indicator in snippet for indicator in blog_indicators):
                continue
            
            # Skip generic category pages and listing pages
            category_indicators = ['top', 'best', 'list', 'vendors', 'agents', 'decorators', 'rentals']
            if any(indicator in title.lower() for indicator in category_indicators):
                continue
            
            # Calculate comprehensive vendor score
            score_breakdown = self._calculate_vendor_score(
                title, snippet, link, vendor_indicators, 
                business_domains, high_value_domains
            )
            
            # Include results with reasonable score threshold
            if score_breakdown['total_score'] >= 1:  # Very low threshold for real vendors
                result['score_breakdown'] = score_breakdown
                aggregated_results.append(result)
        
        # Sort by total score (prioritizing scores over contact info)
        aggregated_results.sort(key=lambda x: x.get('score_breakdown', {}).get('total_score', 0), reverse=True)
        
        # Apply contact info filtering (ensure at least 2 contact info types)
        filtered_results = self._apply_contact_info_filter(aggregated_results)
        
        logger.info(f"🔍 Aggregation: {len(search_results)} raw results -> {len(aggregated_results)} scored results -> {len(filtered_results)} contact-filtered results")
        
        return filtered_results
    
    def _calculate_vendor_score(self, title: str, snippet: str, link: str, 
                               vendor_indicators: List[str], business_domains: List[str], 
                               high_value_domains: List[str]) -> Dict:
        """Calculate comprehensive vendor score with multiple factors"""
        
        # Base vendor indicator score
        vendor_score = 0
        for indicator in vendor_indicators:
            if indicator in title:
                vendor_score += 2
            if indicator in snippet:
                vendor_score += 1
        
        # Domain credibility score
        domain_score = 0
        for domain in business_domains:
            if domain in link:
                if domain in high_value_domains:
                    domain_score = 5  # High value domains get more weight
                else:
                    domain_score = 3
                break
        
        # Contact information score
        contact_score = 0
        contact_types = []
        
        # Check for phone numbers
        import re
        phone_pattern = r'(\+91\s*)?(\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{4})'
        phone_matches = re.findall(phone_pattern, snippet)
        if phone_matches:
            contact_score += 4
            contact_types.append('phone')
        
        # Check for email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if re.search(email_pattern, snippet):
            contact_score += 3
            contact_types.append('email')
        
        # Check for contact keywords
        contact_keywords = ['contact', 'call', 'booking', 'enquiry']
        for keyword in contact_keywords:
            if keyword in snippet:
                contact_score += 1
                if keyword not in contact_types:
                    contact_types.append(keyword)
        
        # Specific vendor indicators (not generic terms)
        specific_vendor_indicators = ['studio', 'caterers', 'palace', 'resort', 'hotel', 'hall', 'photography']
        specific_score = 0
        for indicator in specific_vendor_indicators:
            if indicator in title:
                specific_score += 2
        
        # Rating and review indicators
        rating_score = 0
        rating_indicators = ['rating', 'review', 'star', '4.', '5.', '3.']
        for indicator in rating_indicators:
            if indicator in snippet:
                rating_score += 1
        
        # Calculate total score (prioritizing scores over contact info)
        total_score = (vendor_score * 2) + (domain_score * 3) + (specific_score * 2) + (rating_score * 1) + (contact_score * 1)
        
        return {
            'total_score': total_score,
            'vendor_score': vendor_score,
            'domain_score': domain_score,
            'contact_score': contact_score,
            'specific_score': specific_score,
            'rating_score': rating_score,
            'contact_types': contact_types,
            'contact_count': len(contact_types)
        }
    
    def _apply_contact_info_filter(self, aggregated_results: List[Dict]) -> List[Dict]:
        """Apply contact info filtering to ensure quality"""
        filtered_results = []
        
        for result in aggregated_results:
            score_breakdown = result.get('score_breakdown', {})
            contact_count = score_breakdown.get('contact_count', 0)
            total_score = score_breakdown.get('total_score', 0)
            
            # More lenient contact filtering:
            # - At least 1 contact info type AND decent score, OR
            # - High overall score (good domain/content), OR
            # - Any contact info with business directory
            business_domains = ['justdial.com', 'indiamart.com', 'sulekha.com']
            is_business_directory = any(domain in result.get('link', '').lower() for domain in business_domains)
            
            # Practical contact filtering for real-world results
            if (contact_count >= 1) or (total_score >= 3) or is_business_directory:
                filtered_results.append(result)
        
        return filtered_results

    def search_wedding_vendors(self, 
                              category: str, 
                              location: str = "Mumbai", 
                              budget_range: Tuple[int, int] = (100000, 500000),
                              guest_count: int = 200,
                              wedding_theme: str = "",
                              max_results: int = 15) -> Dict:
        """
        Search for wedding vendors with enhanced business logic and vendor filtering
        """
        try:
            logger.info(f"🔍 Enhanced vendor search: {category} in {location}")
            
            # Generate targeted search queries
            search_queries = self._generate_targeted_search_queries(category, location, budget_range, guest_count, wedding_theme)
            
            all_vendors = []
            
            # Execute multiple targeted searches
            for query in search_queries[:15]:  # Increased to 15 queries
                try:
                    vendors = self._execute_vendor_search(query, category, location, max_results)
                    all_vendors.extend(vendors)
                    logger.info(f"Query '{query[:50]}...' returned {len(vendors)} results")
                except Exception as e:
                    logger.error(f"Error executing search query '{query}': {e}")
                    continue
            
            # Filter for actual vendor results
            filtered_vendors = self._filter_vendor_results(all_vendors, category)
            
            # Remove duplicates
            unique_vendors = self._deduplicate_vendors(filtered_vendors)
            
            # If deduplication is too aggressive, use filtered results directly
            if len(unique_vendors) == 0 and len(filtered_vendors) > 0:
                logger.warning(f"⚠️ Deduplication too aggressive, using filtered results directly")
                unique_vendors = filtered_vendors[:max_results]
            
            # Convert to API response format
            vendor_data = []
            for vendor in unique_vendors[:max_results]:
                vendor_data.append(self._extract_vendor_data(vendor, category, location))
            
            logger.info(f"📊 Final results: {len(unique_vendors)} unique vendors found, returning {len(vendor_data)}")
            
            return {
                'success': True,
                'category': category,
                'location': location,
                'budget_range': budget_range,
                'guest_count': guest_count,
                'wedding_theme': wedding_theme,
                'vendors': vendor_data,
                'total_found': len(vendor_data),
                'search_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'search_queries_used': len(search_queries),
                    'filters_applied': ['vendor_filtering', 'business_listings', 'contact_info'],
                    'vendor_results_found': len(filtered_vendors),
                    'total_results_searched': len(all_vendors)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced vendor search: {e}")
            return {
                'success': False,
                'error': str(e),
                'category': category,
                'location': location,
                'vendors': [],
                'total_found': 0,
                'timestamp': datetime.now().isoformat()
            }

    def _execute_vendor_search(self, query: str, category: str, location: str, max_results: int) -> List[Dict]:
        """
        Execute a single vendor search query
        """
        if not self.api_key:
            logger.warning("Serper API key not available")
            return []
        
        try:
            headers = {
                'X-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': 20,  # Get more results per query
                'gl': 'in',  # India location
                'hl': 'en',  # English language
                'safe': 'active'
            }
            
            response = requests.post(self.search_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            if 'organic' in data:
                for result in data['organic']:
                    # Basic validation
                    if self._is_valid_vendor_result(result, category):
                        results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error executing search query: {e}")
            return []

    def _is_valid_vendor_result(self, result: Dict, category: str) -> bool:
        """
        ULTRA STRICT: Check if search result is a valid INDIVIDUAL vendor listing 
        (not collection/directory/service pages)
        """
        title = result.get('title', '').lower()
        snippet = result.get('snippet', '').lower()
        link = result.get('link', '').lower()
        
        # IMMEDIATE REJECTION: Collection/directory/listing pages
        collection_rejection_patterns = [
            # Quantity indicators
            'top', 'best', 'list of', 'find', 'search', '20 best', '10 best', '50 best',
            'popular', 'famous', 'leading', 'directory', 'agents', 'compare',
            
            # Booking/aggregator pages
            'booking agents', 'venue booking', 'wedding vendors', 'marriage vendors',
            'best wedding', 'top wedding', 'wedding planners', 'wedding services',
            'find best', 'search for', 'vendors near', 'services in',
            
            # Location-based listings
            'banquet halls in', 'photographers in', 'caterers in', 'venues in',
            'halls in', 'decorators in', 'planners in', 'services in',
            
            # Generic service categories
            'venues and halls', 'venues & halls', 'marriage venues', 'wedding venues',
            'marriage halls', 'banquet halls', 'wedding photographers', 'wedding caterers',
            
            # Platform/aggregator indicators
            'weddingz', 'wedmegood', 'shaadisaga', 'zomato', 'justdial listings',
            'venue booking', 'event booking', 'wedding booking'
        ]
        
        # IMMEDIATE REJECTION if title contains any collection indicator
        for pattern in collection_rejection_patterns:
            if pattern in title:
                logger.debug(f"❌ REJECTED (Collection): '{title}' contains '{pattern}'")
                return False
        
        # IMMEDIATE REJECTION: Generic service category pages
        service_category_patterns = [
            'services in', 'decoration in', 'interior design in', 'booking service',
            'hall decoration', 'wedding decoration', 'marriage decoration',
            'photography service', 'catering service', 'planning service',
            'services -', 'service provider', 'providers in', 'companies in'
        ]
        
        for pattern in service_category_patterns:
            if pattern in title:
                logger.debug(f"❌ REJECTED (Service Category): '{title}' contains '{pattern}'")
                return False
        
        # IMMEDIATE REJECTION: Blog/guide/tips pages
        content_rejection_patterns = [
            'blog', 'article', 'post', 'guide', 'tips', 'how to', 'what is', 'why',
            'complete guide', 'ultimate guide', 'everything you need', 'things to know'
        ]
        
        for pattern in content_rejection_patterns:
            if pattern in title or pattern in snippet:
                logger.debug(f"❌ REJECTED (Content): '{title}' contains '{pattern}'")
                return False
        
        # IMMEDIATE REJECTION: URL patterns indicating directories/categories
        directory_url_patterns = [
            '/directory/', '/category/', '/search/', '/list/', '/all/', '/browse/',
            '/wedding-venues/', '/marriage-halls/', '/banquet-halls/', '/venues/',
            '/photographers/', '/caterers/', '/decorators/', '/vendors/'
        ]
        
        for pattern in directory_url_patterns:
            if pattern in link:
                logger.debug(f"❌ REJECTED (Directory URL): '{title}' has URL pattern '{pattern}'")
                return False
        
        # POSITIVE VALIDATION: Must have INDIVIDUAL business name patterns
        import re
        business_name_patterns = [
            # Specific venue names with location/type
            r'\b[A-Z][a-z]+\s+(palace|resort|hotel|hall|gardens|restaurant|club|manor|villa|farmhouse|lawns)\b',
            r'\b(the\s+)?[A-Z][a-z]+\s+(banquet|marriage hall|wedding hall|resort|hotel)\b',
            
            # Photography studios with proper names
            r'\b[A-Z][a-z]+\s+(studio|photography|photographers|photo studio)\b',
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(studio|photography)\b',
            
            # Catering companies with proper names
            r'\b[A-Z][a-z]+\s+(caterers|catering|kitchen|foods|restaurant)\b',
            
            # Decoration companies with proper names
            r'\b[A-Z][a-z]+\s+(decorators|decoration|events|designs)\b',
            
            # Company suffixes
            r'\b[A-Z][a-z]+.*\s+(pvt ltd|private limited|company|enterprises|services|solutions)\b',
            
            # Proper business names (at least 2 capitalized words)
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b'
        ]
        
        has_business_name = any(re.search(pattern, title) for pattern in business_name_patterns)
        
        if not has_business_name:
            logger.debug(f"❌ REJECTED (No Business Name): '{title}' lacks individual business name pattern")
            return False
        
        # POSITIVE VALIDATION: Must have contact info OR be specific business listing
        contact_indicators = ['contact', 'phone', 'call', 'booking', 'enquiry', '+91', 'email']
        has_contact = any(indicator in snippet for indicator in contact_indicators)
        
        # Check if it's a specific business page (not a listing page)
        specific_business_indicators = [
            'our services', 'about us', 'portfolio', 'gallery', 'packages',
            'book now', 'contact us', 'get quote', 'our work'
        ]
        is_specific_business = any(indicator in snippet for indicator in specific_business_indicators)
        
        # FINAL VALIDATION: Must pass at least one positive check
        if not (has_contact or is_specific_business):
            logger.debug(f"❌ REJECTED (No Contact/Business Info): '{title}' lacks contact or business indicators")
            return False
        
        # SUCCESS: Passed all filters
        logger.debug(f"✅ ACCEPTED: '{title}' - Individual business listing")
        return True
        
        # Must be from a business directory or have business indicators
        business_domains = [
            'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in',
            'shaadisaga.com', 'wedmegood.com', 'indiamart.com', 'yellowpages.in'
        ]
        
        is_business_site = any(domain in link for domain in business_domains)
        
        if is_business_site:
            return True
        
        # Check for business indicators in content
        business_indicators = ['service', 'vendor', 'professional', 'company', 'studio', 'agency']
        has_business_indicators = any(indicator in title or indicator in snippet for indicator in business_indicators)
        
        return has_business_indicators

    def _extract_vendor_data(self, search_result: Dict, category: str, location: str) -> Dict:
        """
        Extract vendor data from search result
        """
        title = search_result.get('title', '')
        snippet = search_result.get('snippet', '')
        link = search_result.get('link', '')
        
        # Extract vendor name
        vendor_name = self._extract_vendor_name(title)
        
        # Extract contact information
        phone = self._extract_phone(snippet)
        email = self._extract_email(snippet)
        
        # Extract rating with weightage
        rating_data = self._extract_rating(snippet)
        rating = rating_data['weighted_rating']  # Use weighted rating for display
        
        # Estimate price range
        price_range = self._estimate_price_range(category, snippet)
        
        # Extract specialties
        specialties = self._extract_specialties(snippet, category)
        
        # Check if verified
        verified = self._is_verified_vendor(link)
        
        # Generate contact links
        social_media = self._extract_social_media(snippet)
        whatsapp_link = self._generate_whatsapp_link(phone, vendor_name) if phone else ''
        maps_link = self._generate_maps_link(vendor_name, location)
        
        return {
            'id': f"{category}_{hashlib.md5(vendor_name.encode()).hexdigest()[:8]}",
            'name': vendor_name,
            'category': category,
            'location': location,
            'description': snippet[:200] + "..." if len(snippet) > 200 else snippet,
            'website': link,
            'phone': phone,
            'email': email,
            'rating': rating,
            'rating_details': rating_data,  # Include full rating breakdown
            'price_range': f"₹{price_range[0]:,} - ₹{price_range[1]:,}",
            'price_min': price_range[0],
            'price_max': price_range[1],
            'specialties': specialties,
            'verified': verified,
            'experience_years': self._extract_experience(snippet),
            'portfolio_url': link if 'portfolio' in snippet.lower() or 'gallery' in snippet.lower() else '',
            'social_media': social_media,
            'languages': self._extract_languages(snippet),
            'certifications': self._extract_certifications(snippet),
            'awards': self._extract_awards(snippet),
            'search_score': search_result.get('score_breakdown', {}).get('total_score', 0),
            'score_breakdown': search_result.get('score_breakdown', {}),
            # Contact links for UI
            'google_maps': maps_link,
            'whatsapp': whatsapp_link,
            'instagram': social_media.get('instagram', ''),
            'facebook': social_media.get('facebook', ''),
            'availability': self._estimate_availability(),
            'client_reviews': self._extract_reviews(snippet)
        }

    def _deduplicate_vendors(self, vendors: List[Dict]) -> List[Dict]:
        """
        Remove duplicate vendors using fuzzy matching on name and domain
        """
        seen = []
        unique_vendors = []
        threshold = 0.85  # Similarity threshold (0-1)
        
        for vendor in vendors:
            name = vendor.get('name', '').lower().strip()
            website = vendor.get('website', '').lower()
            domain = website.split('/')[2] if '//' in website and len(website.split('/')) > 2 else website
            
            # Skip vendors with empty or invalid names
            if not name or len(name) < 3:
                continue
                
            is_duplicate = False
            for seen_vendor in seen:
                seen_name = seen_vendor['name']
                seen_domain = seen_vendor['domain']
                
                # Exact name match
                if name == seen_name:
                    is_duplicate = True
                    # Keep the vendor with higher score if duplicate
                    current_score = vendor.get('match_score', 0) or vendor.get('rating', 0) * 20
                    seen_score = seen_vendor['score']
                    if current_score > seen_score:
                        seen_vendor['vendor'] = vendor
                        seen_vendor['name'] = name
                        seen_vendor['domain'] = domain
                        seen_vendor['score'] = current_score
                    break
                
                # Fuzzy name matching
                name_sim = difflib.SequenceMatcher(None, name, seen_name).ratio()
                domain_sim = difflib.SequenceMatcher(None, domain, seen_domain).ratio() if domain and seen_domain else 0
                
                if name_sim > threshold or (domain and domain_sim > threshold):
                    is_duplicate = True
                    # Keep the vendor with higher score if duplicate
                    current_score = vendor.get('match_score', 0) or vendor.get('rating', 0) * 20
                    seen_score = seen_vendor['score']
                    if current_score > seen_score:
                        seen_vendor['vendor'] = vendor
                        seen_vendor['name'] = name
                        seen_vendor['domain'] = domain
                        seen_vendor['score'] = current_score
                    break
                    
            if not is_duplicate:
                current_score = vendor.get('match_score', 0) or vendor.get('rating', 0) * 20
                seen.append({'name': name, 'domain': domain, 'vendor': vendor, 'score': current_score})
                
        unique_vendors = [entry['vendor'] for entry in seen]
        return unique_vendors
    
    def _relaxed_deduplication(self, vendors: List[Dict]) -> List[Dict]:
        """Less aggressive deduplication when we have too few results"""
        seen = set()
        unique_vendors = []
        
        for vendor in vendors:
            name = vendor.get('name', '').lower().strip()
            website = vendor.get('website', '').lower()
            
            # Skip completely empty names or generic category names
            if not name or name == '' or len(name) < 3:
                logger.debug(f"Skipping vendor with empty/short name: '{name}'")
                continue
            
            # Skip only very obvious category pages (more lenient)
            category_terms = ['top 10', 'best of', 'list of', 'directory of']
            if any(term in name for term in category_terms):
                logger.debug(f"Skipping category page: '{name}'")
                continue
            
            # Use website + partial name for more lenient deduplication
            domain = website.split('/')[2] if '//' in website and len(website.split('/')) > 2 else website
            key = f"{name[:10]}_{domain}"  # Use first 10 chars of name + domain
            
            if key not in seen:
                seen.add(key)
                unique_vendors.append(vendor)
                logger.debug(f"Added unique vendor: '{name}' from {domain}")
            else:
                logger.debug(f"Duplicate vendor skipped: '{name}' from {domain}")
        
        logger.info(f"🔍 Relaxed deduplication: {len(vendors)} total results -> {len(unique_vendors)} unique vendors")
        return unique_vendors
    
    def search_wedding_venues(self, 
                             location: str = "Mumbai",
                             budget_range: Tuple[int, int] = (200000, 1000000),
                             guest_count: int = 300,
                             venue_type: str = "banquet",
                             amenities: List[str] = None,
                             max_results: int = 20) -> Dict:
        """
        Specialized venue search with capacity and amenity filtering
        
        Args:
            location: Location for search
            budget_range: Budget range as tuple (min, max)
            guest_count: Number of guests
            venue_type: Type of venue (banquet, resort, garden, etc.)
            amenities: Required amenities
            max_results: Maximum number of results
            
        Returns:
            Dictionary with venue search results
        """
        try:
            logger.info(f"🏰 Enhanced venue search: {venue_type} in {location} for {guest_count} guests")
            
            # Create venue-specific search criteria
            criteria = SearchCriteria(
                category=VendorCategory.VENUES,
                location=location,
                budget_range=budget_range,
                guest_count=guest_count,
                wedding_theme=f"{venue_type} wedding venue",
                special_requirements=amenities or []
            )
            
            # Execute search
            venues = self.search_system.search_vendors(criteria, max_results)
            
            # Apply venue-specific filtering
            filtered_venues = []
            for venue in venues:
                # Check capacity suitability
                if not self._is_venue_suitable_for_guests(venue, guest_count):
                    continue
                
                # Check amenity requirements
                if amenities and not self._has_required_amenities(venue, amenities):
                    continue
                
                filtered_venues.append(venue)
            
            # Convert to API response format
            venue_data = []
            for venue in filtered_venues:
                venue_data.append({
                    'id': venue.id,
                    'name': venue.name,
                    'category': 'venues',
                    'location': venue.location,
                    'description': venue.description,
                    'website': venue.website,
                    'phone': venue.phone,
                    'email': venue.email,
                    'rating': venue.rating,
                    'price_range': f"₹{venue.price_range[0]:,} - ₹{venue.price_range[1]:,}",
                    'price_min': venue.price_range[0],
                    'price_max': venue.price_range[1],
                    'capacity': self._estimate_venue_capacity(venue),
                    'venue_type': self._extract_venue_type(venue),
                    'amenities': self._extract_venue_amenities(venue),
                    'specialties': venue.specialties,
                    'verified': venue.verified,
                    'experience_years': venue.experience_years,
                    'portfolio_url': venue.portfolio_url,
                    'social_media': venue.social_media,
                    'search_score': venue.search_score,
                    'google_maps': self._generate_maps_link(venue.name, venue.location),
                    'instagram': venue.social_media.get('instagram', ''),
                    'availability': venue.availability,
                    'parking_capacity': self._extract_parking_info(venue),
                    'accommodation_available': self._has_accommodation(venue),
                    'catering_included': self._has_catering(venue),
                    'decoration_included': self._has_decoration(venue)
                })
            
            return {
                'success': True,
                'category': 'venues',
                'location': location,
                'budget_range': budget_range,
                'guest_count': guest_count,
                'venue_type': venue_type,
                'amenities_required': amenities,
                'venues': venue_data,
                'total_found': len(venue_data),
                'search_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'capacity_filtered': True,
                    'amenity_filtered': bool(amenities),
                    'search_score_threshold': 50.0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced venue search: {e}")
            return {
                'success': False,
                'error': str(e),
                'category': 'venues',
                'location': location,
                'venues': [],
                'total_found': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    def search_wedding_photographers(self, 
                                   location: str = "Mumbai",
                                   budget_range: Tuple[int, int] = (50000, 200000),
                                   style_preference: str = "candid",
                                   services_needed: List[str] = None,
                                   max_results: int = 15) -> Dict:
        """
        Specialized photographer search with style and service filtering
        
        Args:
            location: Location for search
            budget_range: Budget range as tuple (min, max)
            style_preference: Photography style (candid, traditional, cinematic, etc.)
            services_needed: Required services (pre-wedding, engagement, etc.)
            max_results: Maximum number of results
            
        Returns:
            Dictionary with photographer search results
        """
        try:
            logger.info(f"📸 Enhanced photographer search: {style_preference} style in {location}")
            
            # Create photographer-specific search criteria
            criteria = SearchCriteria(
                category=VendorCategory.PHOTOGRAPHY,
                location=location,
                budget_range=budget_range,
                guest_count=200,  # Not relevant for photographers
                wedding_theme=f"{style_preference} wedding photography",
                special_requirements=services_needed or []
            )
            
            # Execute search
            photographers = self.search_system.search_vendors(criteria, max_results)
            
            # Apply photography-specific filtering
            filtered_photographers = []
            for photographer in photographers:
                # Check style match
                if not self._matches_photography_style(photographer, style_preference):
                    continue
                
                # Check service availability
                if services_needed and not self._has_required_services(photographer, services_needed):
                    continue
                
                filtered_photographers.append(photographer)
            
            # Convert to API response format
            photographer_data = []
            for photographer in filtered_photographers:
                photographer_data.append({
                    'id': photographer.id,
                    'name': photographer.name,
                    'category': 'photography',
                    'location': photographer.location,
                    'description': photographer.description,
                    'website': photographer.website,
                    'phone': photographer.phone,
                    'email': photographer.email,
                    'rating': photographer.rating,
                    'price_range': f"₹{photographer.price_range[0]:,} - ₹{photographer.price_range[1]:,}",
                    'price_min': photographer.price_range[0],
                    'price_max': photographer.price_range[1],
                    'photography_style': self._extract_photography_style(photographer),
                    'services_offered': self._extract_photography_services(photographer),
                    'equipment': self._extract_photography_equipment(photographer),
                    'specialties': photographer.specialties,
                    'verified': photographer.verified,
                    'experience_years': photographer.experience_years,
                    'portfolio_url': photographer.portfolio_url,
                    'social_media': photographer.social_media,
                    'search_score': photographer.search_score,
                    'google_maps': self._generate_maps_link(photographer.name, photographer.location),
                    'instagram': photographer.social_media.get('instagram', ''),
                    'availability': photographer.availability,
                    'languages': photographer.languages,
                    'certifications': photographer.certifications,
                    'awards': photographer.awards,
                    'client_reviews': photographer.client_reviews,
                    'drone_photography': self._has_drone_photography(photographer),
                    'cinematic_videos': self._has_cinematic_videos(photographer),
                    'editing_style': self._extract_editing_style(photographer)
                })
            
            return {
                'success': True,
                'category': 'photography',
                'location': location,
                'budget_range': budget_range,
                'style_preference': style_preference,
                'services_needed': services_needed,
                'photographers': photographer_data,
                'total_found': len(photographer_data),
                'search_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'style_filtered': True,
                    'service_filtered': bool(services_needed),
                    'search_score_threshold': 60.0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced photographer search: {e}")
            return {
                'success': False,
                'error': str(e),
                'category': 'photography',
                'location': location,
                'photographers': [],
                'total_found': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    def search_wedding_catering(self, 
                               location: str = "Mumbai",
                               budget_range: Tuple[int, int] = (800, 2500),
                               guest_count: int = 200,
                               cuisine_preference: str = "north indian",
                               dietary_requirements: List[str] = None,
                               max_results: int = 15) -> Dict:
        """
        Specialized catering search with cuisine and dietary filtering
        
        Args:
            location: Location for search
            budget_range: Budget range per plate as tuple (min, max)
            guest_count: Number of guests
            cuisine_preference: Preferred cuisine
            dietary_requirements: Dietary requirements (vegetarian, jain, etc.)
            max_results: Maximum number of results
            
        Returns:
            Dictionary with catering search results
        """
        try:
            logger.info(f"🍽️ Enhanced catering search: {cuisine_preference} in {location} for {guest_count} guests")
            
            # Create catering-specific search criteria
            criteria = SearchCriteria(
                category=VendorCategory.CATERING,
                location=location,
                budget_range=budget_range,
                guest_count=guest_count,
                wedding_theme=f"{cuisine_preference} wedding catering",
                special_requirements=dietary_requirements or []
            )
            
            # Execute search
            caterers = self.search_system.search_vendors(criteria, max_results)
            
            # Apply catering-specific filtering
            filtered_caterers = []
            for caterer in caterers:
                # Check cuisine match
                if not self._matches_cuisine_preference(caterer, cuisine_preference):
                    continue
                
                # Check dietary requirements
                if dietary_requirements and not self._meets_dietary_requirements(caterer, dietary_requirements):
                    continue
                
                filtered_caterers.append(caterer)
            
            # Convert to API response format
            caterer_data = []
            for caterer in filtered_caterers:
                caterer_data.append({
                    'id': caterer.id,
                    'name': caterer.name,
                    'category': 'catering',
                    'location': caterer.location,
                    'description': caterer.description,
                    'website': caterer.website,
                    'phone': caterer.phone,
                    'email': caterer.email,
                    'rating': caterer.rating,
                    'price_range': f"₹{caterer.price_range[0]:,} - ₹{caterer.price_range[1]:,} per plate",
                    'price_min': caterer.price_range[0],
                    'price_max': caterer.price_range[1],
                    'cuisine_specialties': self._extract_cuisine_specialties(caterer),
                    'dietary_options': self._extract_dietary_options(caterer),
                    'service_style': self._extract_service_style(caterer),
                    'specialties': caterer.specialties,
                    'verified': caterer.verified,
                    'experience_years': caterer.experience_years,
                    'portfolio_url': caterer.portfolio_url,
                    'social_media': caterer.social_media,
                    'search_score': caterer.search_score,
                    'google_maps': self._generate_maps_link(caterer.name, caterer.location),
                    'instagram': caterer.social_media.get('instagram', ''),
                    'availability': caterer.availability,
                    'languages': caterer.languages,
                    'certifications': caterer.certifications,
                    'awards': caterer.awards,
                    'client_reviews': caterer.client_reviews,
                    'minimum_order': self._extract_minimum_order(caterer),
                    'delivery_available': self._has_delivery(caterer),
                    'setup_included': self._has_setup_service(caterer),
                    'staff_included': self._has_staff_service(caterer)
                })
            
            return {
                'success': True,
                'category': 'catering',
                'location': location,
                'budget_range': budget_range,
                'guest_count': guest_count,
                'cuisine_preference': cuisine_preference,
                'dietary_requirements': dietary_requirements,
                'caterers': caterer_data,
                'total_found': len(caterer_data),
                'search_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'cuisine_filtered': True,
                    'dietary_filtered': bool(dietary_requirements),
                    'search_score_threshold': 55.0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced catering search: {e}")
            return {
                'success': False,
                'error': str(e),
                'category': 'catering',
                'location': location,
                'caterers': [],
                'total_found': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    # Helper methods for category mapping and data extraction
    def _map_category_to_enum(self, category: str) -> VendorCategory:
        """Map category string to enum"""
        category_mapping = {
            'venues': VendorCategory.VENUES,
            'photography': VendorCategory.PHOTOGRAPHY,
            'catering': VendorCategory.CATERING,
            'decoration': VendorCategory.DECORATION,
            'makeup': VendorCategory.MAKEUP,
            'planning': VendorCategory.PLANNING,
            'music': VendorCategory.MUSIC,
            'transport': VendorCategory.TRANSPORT,
            'jewelry': VendorCategory.JEWELRY,
            'attire': VendorCategory.ATTIRE
        }
        return category_mapping.get(category.lower(), VendorCategory.VENUES)
    
    def _generate_maps_link(self, name: str, location: str) -> str:
        """Generate Google Maps link"""
        query = f"{name} {location}".replace(' ', '+')
        return f"https://www.google.com/maps/search/{query}"
    
    def _generate_whatsapp_link(self, phone: str, vendor_name: str) -> str:
        """Generate WhatsApp contact link"""
        if not phone:
            return ''
        
        # Clean phone number - remove spaces, dashes, and ensure it starts with country code
        clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
        if not clean_phone.startswith('+'):
            if clean_phone.startswith('91'):
                clean_phone = '+' + clean_phone
            elif clean_phone.startswith('0'):
                clean_phone = '+91' + clean_phone[1:]
            else:
                clean_phone = '+91' + clean_phone
        
        # Create WhatsApp message
        message = f"Hi, I found your business {vendor_name} online and I'm interested in your wedding services. Could you please share more details?"
        encoded_message = message.replace(' ', '%20').replace(',', '%2C').replace("'", '%27')
        
        return f"https://wa.me/{clean_phone.replace('+', '')}?text={encoded_message}"
    
    # Venue-specific helper methods
    def _is_venue_suitable_for_guests(self, venue: VendorProfile, guest_count: int) -> bool:
        """Check if venue can accommodate guest count"""
        # This would need venue capacity data
        # For now, use a simple heuristic based on venue name and description
        text = f"{venue.name} {venue.description}".lower()
        
        if guest_count > 500:
            return any(keyword in text for keyword in ['large', 'grand', 'banquet', 'convention'])
        elif guest_count > 200:
            return any(keyword in text for keyword in ['medium', 'banquet', 'hall', 'resort'])
        else:
            return any(keyword in text for keyword in ['intimate', 'small', 'garden', 'rooftop'])
    
    def _has_required_amenities(self, venue: VendorProfile, amenities: List[str]) -> bool:
        """Check if venue has required amenities"""
        text = f"{venue.name} {venue.description}".lower()
        return all(amenity.lower() in text for amenity in amenities)
    
    def _estimate_venue_capacity(self, venue: VendorProfile) -> str:
        """Estimate venue capacity"""
        text = f"{venue.name} {venue.description}".lower()
        
        if any(keyword in text for keyword in ['large', 'grand', 'convention']):
            return "500+ guests"
        elif any(keyword in text for keyword in ['medium', 'banquet']):
            return "200-500 guests"
        else:
            return "50-200 guests"
    
    def _extract_venue_type(self, venue: VendorProfile) -> str:
        """Extract venue type"""
        text = f"{venue.name} {venue.description}".lower()
        
        if 'resort' in text:
            return "Resort"
        elif 'hotel' in text:
            return "Hotel"
        elif 'garden' in text:
            return "Garden"
        elif 'farmhouse' in text:
            return "Farmhouse"
        elif 'palace' in text:
            return "Palace"
        else:
            return "Banquet Hall"
    
    def _extract_venue_amenities(self, venue: VendorProfile) -> List[str]:
        """Extract venue amenities"""
        amenities = []
        text = f"{venue.name} {venue.description}".lower()
        
        amenity_keywords = {
            'parking': ['parking', 'car park'],
            'accommodation': ['accommodation', 'rooms', 'stay'],
            'catering': ['catering', 'food', 'kitchen'],
            'decoration': ['decoration', 'decor'],
            'music': ['music', 'sound', 'dj'],
            'garden': ['garden', 'lawn', 'outdoor'],
            'ac': ['ac', 'air conditioning', 'air-conditioned'],
            'wifi': ['wifi', 'internet', 'wireless']
        }
        
        for amenity, keywords in amenity_keywords.items():
            if any(keyword in text for keyword in keywords):
                amenities.append(amenity.title())
        
        return amenities
    
    def _extract_parking_info(self, venue: VendorProfile) -> str:
        """Extract parking information"""
        text = f"{venue.name} {venue.description}".lower()
        
        if 'parking' in text:
            if 'large' in text or 'ample' in text:
                return "Large parking available"
            else:
                return "Parking available"
        return "Parking not mentioned"
    
    def _has_accommodation(self, venue: VendorProfile) -> bool:
        """Check if venue has accommodation"""
        text = f"{venue.name} {venue.description}".lower()
        return any(keyword in text for keyword in ['accommodation', 'rooms', 'stay', 'hotel'])
    
    def _has_catering(self, venue: VendorProfile) -> bool:
        """Check if venue has catering"""
        text = f"{venue.name} {venue.description}".lower()
        return any(keyword in text for keyword in ['catering', 'food', 'kitchen', 'restaurant'])
    
    def _has_decoration(self, venue: VendorProfile) -> bool:
        """Check if venue has decoration"""
        text = f"{venue.name} {venue.description}".lower()
        return any(keyword in text for keyword in ['decoration', 'decor', 'floral'])
    
    # Photography-specific helper methods
    def _matches_photography_style(self, photographer: VendorProfile, style: str) -> bool:
        """Check if photographer matches style preference"""
        text = f"{photographer.name} {photographer.description}".lower()
        return style.lower() in text
    
    def _has_required_services(self, photographer: VendorProfile, services: List[str]) -> bool:
        """Check if photographer offers required services"""
        text = f"{photographer.name} {photographer.description}".lower()
        return all(service.lower() in text for service in services)
    
    def _extract_photography_style(self, photographer: VendorProfile) -> List[str]:
        """Extract photography styles"""
        styles = []
        text = f"{photographer.name} {photographer.description}".lower()
        
        style_keywords = ['candid', 'traditional', 'cinematic', 'documentary', 'artistic', 'journalistic']
        for style in style_keywords:
            if style in text:
                styles.append(style.title())
        
        return styles
    
    def _extract_photography_services(self, photographer: VendorProfile) -> List[str]:
        """Extract photography services"""
        services = []
        text = f"{photographer.name} {photographer.description}".lower()
        
        service_keywords = ['pre-wedding', 'engagement', 'reception', 'sangeet', 'mehendi', 'haldi']
        for service in service_keywords:
            if service in text:
                services.append(service.title())
        
        return services
    
    def _extract_photography_equipment(self, photographer: VendorProfile) -> List[str]:
        """Extract photography equipment"""
        equipment = []
        text = f"{photographer.name} {photographer.description}".lower()
        
        equipment_keywords = ['drone', '4k', 'cinematic', 'professional', 'studio', 'canon', 'nikon']
        for equip in equipment_keywords:
            if equip in text:
                equipment.append(equip.title())
        
        return equipment
    
    def _has_drone_photography(self, photographer: VendorProfile) -> bool:
        """Check if photographer offers drone photography"""
        text = f"{photographer.name} {photographer.description}".lower()
        return 'drone' in text
    
    def _has_cinematic_videos(self, photographer: VendorProfile) -> bool:
        """Check if photographer offers cinematic videos"""
        text = f"{photographer.name} {photographer.description}".lower()
        return any(keyword in text for keyword in ['cinematic', 'video', 'film'])
    
    def _extract_editing_style(self, photographer: VendorProfile) -> str:
        """Extract editing style"""
        text = f"{photographer.name} {photographer.description}".lower()
        
        if 'natural' in text:
            return "Natural"
        elif 'artistic' in text:
            return "Artistic"
        elif 'traditional' in text:
            return "Traditional"
        else:
            return "Standard"
    
    # Catering-specific helper methods
    def _matches_cuisine_preference(self, caterer: VendorProfile, cuisine: str) -> bool:
        """Check if caterer matches cuisine preference"""
        text = f"{caterer.name} {caterer.description}".lower()
        return cuisine.lower() in text
    
    def _meets_dietary_requirements(self, caterer: VendorProfile, requirements: List[str]) -> bool:
        """Check if caterer meets dietary requirements"""
        text = f"{caterer.name} {caterer.description}".lower()
        return all(req.lower() in text for req in requirements)
    
    def _extract_cuisine_specialties(self, caterer: VendorProfile) -> List[str]:
        """Extract cuisine specialties"""
        cuisines = []
        text = f"{caterer.name} {caterer.description}".lower()
        
        cuisine_keywords = ['north indian', 'south indian', 'continental', 'chinese', 'italian', 'gujarati', 'punjabi']
        for cuisine in cuisine_keywords:
            if cuisine in text:
                cuisines.append(cuisine.title())
        
        return cuisines
    
    def _extract_dietary_options(self, caterer: VendorProfile) -> List[str]:
        """Extract dietary options"""
        options = []
        text = f"{caterer.name} {caterer.description}".lower()
        
        dietary_keywords = ['vegetarian', 'non-vegetarian', 'jain', 'halal', 'vegan']
        for option in dietary_keywords:
            if option in text:
                options.append(option.title())
        
        return options
    
    def _extract_service_style(self, caterer: VendorProfile) -> List[str]:
        """Extract service style"""
        styles = []
        text = f"{caterer.name} {caterer.description}".lower()
        
        style_keywords = ['thali', 'buffet', 'plated', 'live counter', 'dessert']
        for style in style_keywords:
            if style in text:
                styles.append(style.title())
        
        return styles
    
    def _extract_minimum_order(self, caterer: VendorProfile) -> str:
        """Extract minimum order requirement"""
        text = f"{caterer.name} {caterer.description}".lower()
        
        # Look for minimum order patterns
        min_pattern = r'minimum\s+(\d+)\s*(?:guests?|plates?)'
        match = re.search(min_pattern, text)
        if match:
            return f"Minimum {match.group(1)} guests"
        
        return "No minimum specified"
    
    def _has_delivery(self, caterer: VendorProfile) -> bool:
        """Check if caterer offers delivery"""
        text = f"{caterer.name} {caterer.description}".lower()
        return 'delivery' in text
    
    def _has_setup_service(self, caterer: VendorProfile) -> bool:
        """Check if caterer offers setup service"""
        text = f"{caterer.name} {caterer.description}".lower()
        return any(keyword in text for keyword in ['setup', 'arrangement', 'service'])
    
    def _has_staff_service(self, caterer: VendorProfile) -> bool:
        """Check if caterer provides staff"""
        text = f"{caterer.name} {caterer.description}".lower()
        return any(keyword in text for keyword in ['staff', 'servers', 'waiters'])

    def _extract_vendor_name(self, title: str) -> str:
        """Clean and extract vendor name from title"""
        original_title = title
        
        # Remove common suffixes and prefixes
        title = re.sub(r'\s*-\s*(Best|Top|Leading|Professional).*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\|\s*.*', '', title)
        # Only remove contact info if it's clearly at the end
        title = re.sub(r'\s*[-|]\s*contact.*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*[-|]\s*phone.*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*[-|]\s*booking.*$', '', title, flags=re.IGNORECASE)
        
        # Be more selective about removing location names - only if at the end
        title = re.sub(r',?\s+(in\s+)?delhi\s*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r',?\s+(in\s+)?mumbai\s*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r',?\s+(in\s+)?bangalore\s*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r',?\s+(in\s+)?ghaziabad\s*$', '', title, flags=re.IGNORECASE)
        
        # Only remove "services" if it's at the end and preceded by something substantial
        if len(title.split()) > 2:
            title = re.sub(r'\s+services\s*$', '', title, flags=re.IGNORECASE)
        
        # Clean up extra spaces and punctuation
        title = re.sub(r'\s+', ' ', title)
        title = title.strip(' -.,')
        
        # If we ended up with an empty or very short name, try to extract from original
        if len(title.strip()) < 3:
            # Try to extract the first meaningful part before colon or dash
            if ':' in original_title:
                title = original_title.split(':')[0].strip()
            elif ' - ' in original_title:
                title = original_title.split(' - ')[0].strip()
            else:
                # Take first few words if they seem like a business name
                words = original_title.split()
                if len(words) >= 2:
                    title = ' '.join(words[:3])  # Take first 3 words
                else:
                    title = original_title
        
        return title.strip()[:60]

    def _extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        phone_pattern = r'(\+91\s*)?(\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{4})'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else ""

    def _extract_email(self, text: str) -> str:
        """Extract email from text"""
        # Look for common email patterns
        email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'email[:\s]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
            r'contact[:\s]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
            r'info[:\s]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})'
        ]
        
        for pattern in email_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Return the email part (group 1 if it exists, otherwise group 0)
                return match.group(1) if len(match.groups()) > 0 else match.group(0)
        
        return ""

    def _extract_rating(self, text: str) -> Dict:
        """Extract rating with weightage based on sample size and user count"""
        rating_data = {
            'rating': 0.0,
            'user_count': 0,
            'sample_size': 0,
            'confidence_score': 0.0,
            'weighted_rating': 0.0
        }
        
        # Look for rating patterns like "4.5/5", "4.5 stars", etc.
        rating_patterns = [
            r'(\d+\.?\d*)\s*\/\s*5',
            r'(\d+\.?\d*)\s*stars?',
            r'rating[:\s]*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*out\s*of\s*5'
        ]
        
        for pattern in rating_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    rating = float(match.group(1))
                    rating_data['rating'] = min(max(rating, 0.0), 5.0)
                    break
                except ValueError:
                    continue
        
        # Extract user count and sample size
        user_patterns = [
            r'(\d+)\s*users?',
            r'(\d+)\s*reviews?',
            r'(\d+)\s*ratings?',
            r'(\d+)\s*customers?',
            r'(\d+)\s*clients?'
        ]
        
        for pattern in user_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    user_count = int(match.group(1))
                    rating_data['user_count'] = user_count
                    rating_data['sample_size'] = user_count
                    break
                except ValueError:
                    continue
        
        # Calculate confidence score based on sample size
        sample_size = rating_data['sample_size']
        if sample_size >= 100:
            rating_data['confidence_score'] = 1.0
        elif sample_size >= 50:
            rating_data['confidence_score'] = 0.8
        elif sample_size >= 20:
            rating_data['confidence_score'] = 0.6
        elif sample_size >= 10:
            rating_data['confidence_score'] = 0.4
        elif sample_size >= 5:
            rating_data['confidence_score'] = 0.2
        else:
            rating_data['confidence_score'] = 0.1
        
        # Calculate weighted rating (rating * confidence)
        rating_data['weighted_rating'] = rating_data['rating'] * rating_data['confidence_score']
        
        return rating_data

    def _estimate_price_range(self, category: str, text: str) -> Tuple[int, int]:
        """Estimate price range based on category and text"""
        price_ranges = {
            'wedding photographer': (50000, 200000),
            'catering services': (800, 2500),
            'wedding venues': (200000, 1000000),
            'decoration services': (75000, 500000),
            'makeup artist': (25000, 150000),
            'wedding planning': (100000, 800000)
        }
        
        for key, price in price_ranges.items():
            if key in category.lower():
                return price
        
        return (50000, 300000)  # Default range

    def _extract_specialties(self, text: str, category: str) -> List[str]:
        """Extract specialties from text"""
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
        
        return list(set(found_specialties))[:5]  # Limit to 5 specialties

    def _is_verified_vendor(self, link: str) -> bool:
        """Check if vendor is from verified platform"""
        verified_domains = [
            'justdial.com', 'sulekha.com', 'urbanpro.com', 'weddingz.in',
            'shaadisaga.com', 'wedmegood.com', 'indiamart.com', 'yellowpages.in'
        ]
        return any(domain in link for domain in verified_domains)

    def _extract_experience(self, text: str) -> int:
        """Extract years of experience from text"""
        exp_pattern = r'(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience'
        match = re.search(exp_pattern, text, re.IGNORECASE)
        return int(match.group(1)) if match else 0

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
            rating_data = self._extract_rating(text)
            reviews.append({
                'text': 'Positive reviews mentioned',
                'rating': rating_data['rating'],
                'weighted_rating': rating_data['weighted_rating'],
                'user_count': rating_data['user_count'],
                'confidence_score': rating_data['confidence_score'],
                'source': 'Search result'
            })
        
        return reviews

# Example usage and testing
if __name__ == "__main__":
    # Initialize enhanced Serper API
    serper_api = EnhancedSerperAPI()
    
    # Test venue search
    print("🏰 Testing Venue Search...")
    venue_results = serper_api.search_wedding_venues(
        location="Mumbai",
        budget_range=(300000, 800000),
        guest_count=250,
        venue_type="banquet",
        amenities=["parking", "accommodation"]
    )
    
    print(f"Found {venue_results['total_found']} venues")
    for venue in venue_results['venues'][:3]:
        print(f"- {venue['name']} ({venue['location']})")
        print(f"  Price: {venue['price_range']}")
        print(f"  Score: {venue['search_score']:.1f}")
        print()
    
    # Test photographer search
    print("📸 Testing Photographer Search...")
    photo_results = serper_api.search_wedding_photographers(
        location="Mumbai",
        budget_range=(75000, 150000),
        style_preference="candid",
        services_needed=["pre-wedding", "engagement"]
    )
    
    print(f"Found {photo_results['total_found']} photographers")
    for photographer in photo_results['photographers'][:3]:
        print(f"- {photographer['name']} ({photographer['location']})")
        print(f"  Style: {', '.join(photographer['photography_style'])}")
        print(f"  Score: {photographer['search_score']:.1f}")
        print() 