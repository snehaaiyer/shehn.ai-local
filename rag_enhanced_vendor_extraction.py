
#!/usr/bin/env python3
"""
RAG-Enhanced Vendor Extraction Service
Uses wedding preferences and context to intelligently extract and enhance vendor data
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import requests
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VendorContext:
    """Context information for vendor extraction"""
    budget_range: str
    guest_count: int
    wedding_date: str
    location: str
    style_preference: str
    venue_type: str
    photography_style: str
    cuisine_preference: str
    priorities: List[str]

@dataclass
class EnhancedVendor:
    """Enhanced vendor information with RAG processing"""
    id: str
    name: str
    category: str
    location: str
    rating: float
    price_range: str
    description: str
    contact_score: int
    
    # Enhanced fields from RAG processing
    context_match_score: int
    preference_alignment: Dict[str, float]
    extracted_specialties: List[str]
    availability_likelihood: str
    budget_compatibility: str
    capacity_suitability: str
    
    # Contact and business info
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    
    # Additional metadata
    years_experience: int = 0
    weddings_completed: int = 0
    awards: List[str] = None
    testimonials: List[Dict] = None

class RAGEnhancedVendorExtractor:
    """RAG-Enhanced Vendor Extraction with contextual intelligence"""
    
    def __init__(self):
        self.preference_weights = {
            'budget': 0.25,
            'style': 0.20,
            'location': 0.15,
            'capacity': 0.15,
            'experience': 0.10,
            'specialties': 0.10,
            'availability': 0.05
        }
    
    def extract_enhanced_vendor_info(self, vendor: Dict, context: VendorContext) -> EnhancedVendor:
        """Extract and enhance vendor information using RAG context"""
        
        try:
            # Calculate context match score
            context_score = self._calculate_context_match_score(vendor, context)
            
            # Analyze preference alignment
            preference_alignment = self._analyze_preference_alignment(vendor, context)
            
            # Extract specialties based on context
            extracted_specialties = self._extract_contextual_specialties(vendor, context)
            
            # Assess availability likelihood
            availability_likelihood = self._assess_availability_likelihood(vendor, context)
            
            # Determine budget compatibility
            budget_compatibility = self._determine_budget_compatibility(vendor, context)
            
            # Check capacity suitability
            capacity_suitability = self._check_capacity_suitability(vendor, context)
            
            # Create enhanced vendor
            enhanced_vendor = EnhancedVendor(
                id=vendor.get('id', f"vendor-{hash(vendor.get('name', 'unknown'))}"),
                name=vendor.get('name', 'Unknown Vendor'),
                category=vendor.get('category', 'unknown'),
                location=vendor.get('location', context.location),
                rating=float(vendor.get('rating', 4.0)),
                price_range=vendor.get('price_range', 'Contact for pricing'),
                description=self._enhance_description(vendor, context),
                contact_score=int(vendor.get('contact_score', 75)),
                
                # Enhanced RAG fields
                context_match_score=context_score,
                preference_alignment=preference_alignment,
                extracted_specialties=extracted_specialties,
                availability_likelihood=availability_likelihood,
                budget_compatibility=budget_compatibility,
                capacity_suitability=capacity_suitability,
                
                # Contact information
                phone=vendor.get('phone'),
                email=vendor.get('email'),
                website=vendor.get('website'),
                instagram=vendor.get('instagram'),
                
                # Business metadata
                years_experience=vendor.get('experience_years', 0),
                weddings_completed=vendor.get('weddings_planned', 0),
                awards=vendor.get('awards', []),
                testimonials=vendor.get('testimonials', [])
            )
            
            logger.info(f"✅ Enhanced vendor: {enhanced_vendor.name} (Score: {context_score}/100)")
            return enhanced_vendor
            
        except Exception as e:
            logger.error(f"❌ Error enhancing vendor {vendor.get('name', 'Unknown')}: {e}")
            # Return basic vendor info if enhancement fails
            return self._create_basic_enhanced_vendor(vendor)
    
    def _calculate_context_match_score(self, vendor: Dict, context: VendorContext) -> int:
        """Calculate how well vendor matches wedding context"""
        
        score = 0
        max_score = 100
        
        # Budget compatibility (25 points)
        budget_score = self._score_budget_match(vendor.get('price_range', ''), context.budget_range)
        score += budget_score * 0.25
        
        # Style compatibility (20 points)
        style_score = self._score_style_match(vendor, context)
        score += style_score * 0.20
        
        # Location proximity (15 points)
        location_score = self._score_location_match(vendor.get('location', ''), context.location)
        score += location_score * 0.15
        
        # Capacity suitability (15 points)
        capacity_score = self._score_capacity_match(vendor, context.guest_count)
        score += capacity_score * 0.15
        
        # Experience and rating (10 points)
        experience_score = min(100, (vendor.get('rating', 0) * 20) + (vendor.get('experience_years', 0) * 5))
        score += experience_score * 0.10
        
        # Specialty alignment (10 points)
        specialty_score = self._score_specialty_match(vendor, context)
        score += specialty_score * 0.10
        
        # Availability likelihood (5 points)
        availability_score = self._score_availability(vendor, context.wedding_date)
        score += availability_score * 0.05
        
        return min(100, int(score))
    
    def _analyze_preference_alignment(self, vendor: Dict, context: VendorContext) -> Dict[str, float]:
        """Analyze how vendor aligns with specific preferences"""
        
        alignment = {}
        
        # Budget alignment
        alignment['budget'] = self._score_budget_match(vendor.get('price_range', ''), context.budget_range) / 100
        
        # Style alignment
        alignment['style'] = self._score_style_match(vendor, context) / 100
        
        # Location alignment  
        alignment['location'] = self._score_location_match(vendor.get('location', ''), context.location) / 100
        
        # Category priority alignment
        vendor_category = vendor.get('category', '')
        priority_score = 0.0
        if vendor_category in context.priorities:
            priority_index = context.priorities.index(vendor_category)
            priority_score = 1.0 - (priority_index / len(context.priorities))
        
        alignment['priority'] = priority_score
        
        return alignment
    
    def _extract_contextual_specialties(self, vendor: Dict, context: VendorContext) -> List[str]:
        """Extract vendor specialties relevant to wedding context"""
        
        specialties = []
        
        # Base specialties from vendor data
        vendor_specialties = vendor.get('specialties', [])
        if vendor_specialties:
            specialties.extend(vendor_specialties)
        
        # Context-based specialty inference
        category = vendor.get('category', '')
        style = context.style_preference.lower()
        
        if category == 'venues':
            if 'royal' in style or 'heritage' in style:
                specialties.append('Royal Weddings')
            if 'traditional' in style:
                specialties.append('Traditional Indian Ceremonies')
            if 'modern' in style:
                specialties.append('Contemporary Celebrations')
        
        elif category == 'photography':
            if context.photography_style:
                specialties.append(f"{context.photography_style.title()} Photography")
            if 'traditional' in style:
                specialties.append('Cultural Wedding Photography')
        
        elif category == 'catering':
            if context.cuisine_preference:
                specialties.append(f"{context.cuisine_preference.title()} Cuisine")
        
        # Remove duplicates and return
        return list(set(specialties))
    
    def _assess_availability_likelihood(self, vendor: Dict, context: VendorContext) -> str:
        """Assess likelihood of vendor availability"""
        
        rating = vendor.get('rating', 0)
        experience = vendor.get('experience_years', 0)
        
        # High-demand vendors (high rating + experience) may be less available
        if rating >= 4.8 and experience >= 10:
            return 'Low - High Demand Vendor'
        elif rating >= 4.5 and experience >= 5:
            return 'Medium - Popular Vendor'
        else:
            return 'High - Available Vendor'
    
    def _determine_budget_compatibility(self, vendor: Dict, context: VendorContext) -> str:
        """Determine budget compatibility level"""
        
        vendor_price = vendor.get('price_range', '').lower()
        budget = context.budget_range.lower()
        
        if 'budget' in vendor_price and ('budget' in budget or 'under 5' in budget):
            return 'Perfect Match'
        elif 'mid' in vendor_price and ('mid' in budget or '5-15' in budget):
            return 'Perfect Match'
        elif 'premium' in vendor_price and ('luxury' in budget or '15-50' in budget):
            return 'Perfect Match'
        elif 'luxury' in vendor_price and ('ultra' in budget or '50+' in budget):
            return 'Perfect Match'
        else:
            return 'Requires Discussion'
    
    def _check_capacity_suitability(self, vendor: Dict, context: VendorContext) -> str:
        """Check if vendor can handle guest capacity"""
        
        if vendor.get('category') != 'venues':
            return 'Not Applicable'
        
        vendor_capacity = vendor.get('capacity', 0)
        guest_count = context.guest_count
        
        if vendor_capacity >= guest_count and vendor_capacity <= guest_count * 1.5:
            return 'Perfect Size'
        elif vendor_capacity >= guest_count:
            return 'Can Accommodate'
        else:
            return 'Too Small'
    
    def _enhance_description(self, vendor: Dict, context: VendorContext) -> str:
        """Enhance vendor description with context-aware details"""
        
        base_description = vendor.get('description', '')
        
        enhancements = []
        
        # Add capacity relevance
        if vendor.get('category') == 'venues' and context.guest_count:
            enhancements.append(f"Suitable for {context.guest_count} guests")
        
        # Add style relevance
        if context.style_preference:
            enhancements.append(f"Specializes in {context.style_preference} weddings")
        
        # Add location advantage
        if vendor.get('location', '').lower() in context.location.lower():
            enhancements.append(f"Conveniently located in {context.location}")
        
        # Combine base description with enhancements
        if enhancements:
            enhanced_desc = f"{base_description} • {' • '.join(enhancements)}"
        else:
            enhanced_desc = base_description
        
        return enhanced_desc
    
    # Helper scoring methods
    def _score_budget_match(self, vendor_price: str, user_budget: str) -> int:
        """Score budget compatibility (0-100)"""
        # Implementation similar to existing budget compatibility logic
        if not vendor_price or not user_budget:
            return 50
        
        budget_mapping = {
            'budget friendly': 1,
            'mid range': 2, 
            'luxury': 3,
            'ultra luxury': 4
        }
        
        vendor_level = 2  # default
        user_level = 2    # default
        
        for key, level in budget_mapping.items():
            if key in vendor_price.lower():
                vendor_level = level
            if key in user_budget.lower():
                user_level = level
        
        # Score based on how close the levels are
        diff = abs(vendor_level - user_level)
        if diff == 0:
            return 100
        elif diff == 1:
            return 80
        elif diff == 2:
            return 60
        else:
            return 40
    
    def _score_style_match(self, vendor: Dict, context: VendorContext) -> int:
        """Score style compatibility (0-100)"""
        vendor_name = vendor.get('name', '').lower()
        vendor_desc = vendor.get('description', '').lower()
        style = context.style_preference.lower()
        
        style_keywords = {
            'traditional': ['traditional', 'heritage', 'cultural', 'classic'],
            'modern': ['modern', 'contemporary', 'minimalist', 'urban'],
            'royal': ['royal', 'palace', 'luxury', 'premium'],
            'destination': ['destination', 'beach', 'resort'],
            'bohemian': ['bohemian', 'boho', 'garden', 'rustic']
        }
        
        keywords = style_keywords.get(style, [style])
        matches = sum(1 for keyword in keywords if keyword in vendor_name or keyword in vendor_desc)
        
        return min(100, matches * 30)
    
    def _score_location_match(self, vendor_location: str, user_location: str) -> int:
        """Score location proximity (0-100)"""
        if not vendor_location or not user_location:
            return 50
        
        if user_location.lower() in vendor_location.lower():
            return 100
        
        # Check for metro area matches
        metro_areas = {
            'mumbai': ['navi mumbai', 'thane', 'pune'],
            'delhi': ['gurgaon', 'noida', 'faridabad'],
            'bangalore': ['mysore', 'hosur'],
            'chennai': ['pondicherry', 'kanchipuram']
        }
        
        user_city = user_location.lower()
        vendor_city = vendor_location.lower()
        
        if user_city in metro_areas:
            nearby_cities = metro_areas[user_city]
            if any(city in vendor_city for city in nearby_cities):
                return 80
        
        return 30
    
    def _score_capacity_match(self, vendor: Dict, guest_count: int) -> int:
        """Score capacity suitability (0-100)"""
        if vendor.get('category') != 'venues':
            return 100  # Not applicable
        
        vendor_capacity = vendor.get('capacity', 0)
        if not vendor_capacity:
            return 50
        
        if vendor_capacity >= guest_count and vendor_capacity <= guest_count * 1.5:
            return 100
        elif vendor_capacity >= guest_count:
            return 80
        else:
            return 20
    
    def _score_specialty_match(self, vendor: Dict, context: VendorContext) -> int:
        """Score specialty alignment (0-100)"""
        vendor_specialties = vendor.get('specialties', [])
        if not vendor_specialties:
            return 50
        
        context_keywords = [
            context.style_preference,
            context.venue_type,
            context.photography_style,
            context.cuisine_preference
        ]
        
        matches = 0
        for specialty in vendor_specialties:
            for keyword in context_keywords:
                if keyword and keyword.lower() in specialty.lower():
                    matches += 1
        
        return min(100, matches * 25)
    
    def _score_availability(self, vendor: Dict, wedding_date: str) -> int:
        """Score availability likelihood (0-100)"""
        # Simplified availability scoring
        rating = vendor.get('rating', 0)
        
        if rating >= 4.8:
            return 30  # High-demand vendors less available
        elif rating >= 4.5:
            return 60
        else:
            return 90
    
    def _create_basic_enhanced_vendor(self, vendor: Dict) -> EnhancedVendor:
        """Create basic enhanced vendor if full enhancement fails"""
        
        return EnhancedVendor(
            id=vendor.get('id', f"vendor-{hash(vendor.get('name', 'unknown'))}"),
            name=vendor.get('name', 'Unknown Vendor'),
            category=vendor.get('category', 'unknown'),
            location=vendor.get('location', ''),
            rating=float(vendor.get('rating', 4.0)),
            price_range=vendor.get('price_range', 'Contact for pricing'),
            description=vendor.get('description', ''),
            contact_score=int(vendor.get('contact_score', 75)),
            
            # Default enhanced fields
            context_match_score=75,
            preference_alignment={},
            extracted_specialties=[],
            availability_likelihood='Unknown',
            budget_compatibility='Requires Discussion',
            capacity_suitability='Unknown',
            
            phone=vendor.get('phone'),
            email=vendor.get('email'),
            website=vendor.get('website'),
            instagram=vendor.get('instagram')
        )

def create_vendor_context_from_preferences(preferences_data: Dict) -> VendorContext:
    """Create VendorContext from wedding preferences data"""
    
    return VendorContext(
        budget_range=preferences_data.get('budgetRange', ''),
        guest_count=int(preferences_data.get('guestCount', 100)),
        wedding_date=preferences_data.get('weddingDate', ''),
        location=preferences_data.get('city', ''),
        style_preference=preferences_data.get('weddingStyle', ''),
        venue_type=preferences_data.get('venueType', ''),
        photography_style=preferences_data.get('photographyStyle', ''),
        cuisine_preference=preferences_data.get('cuisine', ''),
        priorities=preferences_data.get('priorities', [])
    )

# Example usage
if __name__ == "__main__":
    # Test the RAG-enhanced vendor extraction
    extractor = RAGEnhancedVendorExtractor()
    
    sample_vendor = {
        'id': 'venue-1',
        'name': 'Royal Palace Hotel',
        'category': 'venues',
        'location': 'Mumbai',
        'rating': 4.8,
        'price_range': 'Premium (> ₹2L)',
        'description': 'Luxury hotel with grand ballrooms',
        'contact_score': 95,
        'capacity': 300,
        'experience_years': 15
    }
    
    sample_context = VendorContext(
        budget_range='Luxury - 15-50 Lakhs',
        guest_count=250,
        wedding_date='2024-12-15',
        location='Mumbai',
        style_preference='Royal',
        venue_type='hotels',
        photography_style='cinematic',
        cuisine_preference='multi-cuisine',
        priorities=['venue', 'photography', 'catering']
    )
    
    enhanced_vendor = extractor.extract_enhanced_vendor_info(sample_vendor, sample_context)
    print(f"Enhanced Vendor: {enhanced_vendor.name}")
    print(f"Context Match Score: {enhanced_vendor.context_match_score}/100")
    print(f"Budget Compatibility: {enhanced_vendor.budget_compatibility}")
    print(f"Extracted Specialties: {enhanced_vendor.extracted_specialties}")
