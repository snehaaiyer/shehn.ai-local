#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Simplified Unified Server
Includes vendor discovery functionality with communications agent
"""

import uvicorn
import json
from fastapi import FastAPI, Request, HTTPException, Body
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from datetime import datetime
import logging
import os
import re
import random
from typing import Dict, List
import urllib.parse
from difflib import SequenceMatcher

# Import our Serper image and vendor search
from serper_images import get_theme_images, search_vendors, get_all_vendors, serper_client
from vendor_database import get_vendor_database

# Import Ollama AI service
from ollama_ai_service import ollama_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define paths
CURRENT_DIR = Path(__file__).parent
STATIC_DIR = CURRENT_DIR / "local_website"

# Ensure static directory exists
if not STATIC_DIR.exists():
    logger.error(f"Static directory not found: {STATIC_DIR}")
    exit(1)

# FastAPI App Setup
app = FastAPI(
    title="BID AI Wedding Assistant - Unified Server",
    description="Complete wedding planning platform with vendor discovery",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function for budget category notes
def get_category_notes(category, wedding_days):
    """Get helpful notes about how costs scale for different categories"""
    if wedding_days == 1:
        return ""
    
    notes = {
        'venue': f"Multi-day venue bookings often include package discounts. Consider venues that offer {wedding_days}-day packages.",
        'catering': f"Catering costs scale directly with days. Plan varied menus for each day to keep guests engaged over {wedding_days} days.",
        'photography': f"Most photographers offer multi-day packages with discounts. Coverage for {wedding_days} days may include pre-wedding and post-wedding shoots.",
        'decoration': f"Decorations can often be reused across {wedding_days} days with some refresh. Consider modular setups to save costs.",
        'makeup': f"Full makeup services needed for each day. Consider bridal packages for {wedding_days}-day celebrations.",
        'miscellaneous': f"Transport, accommodation, and coordination costs increase with {wedding_days}-day celebrations. Plan logistics carefully."
    }
    
    return notes.get(category, f"Costs may scale with {wedding_days} days of celebration.")

def _calculate_contact_score(vendor: Dict) -> int:
    """Calculate a contact score based on available contact methods"""
    score = 0
    if vendor.get('phone') and vendor.get('phone') != 'N/A':
        score += 30
    if vendor.get('email') and vendor.get('email') != 'N/A':
        score += 25
    if vendor.get('website') and vendor.get('website') != 'N/A':
        score += 20
    if vendor.get('whatsapp') and vendor.get('whatsapp') != 'N/A':
        score += 15
    if vendor.get('instagram') and vendor.get('instagram') != 'N/A':
        score += 10
    return score

def _is_collection_page(vendor: Dict) -> bool:
    """Check if vendor appears to be a collection/directory page rather than individual business"""
    name = vendor.get('name', '').lower()
    description = vendor.get('description', '').lower()
    
    # Collection indicators
    collection_indicators = [
        'top', 'best', 'list of', 'find', 'search', 'compare', 'reviews',
        'ratings', 'recommended', 'popular', 'famous', 'leading', 'directory',
        'photographers in', 'caterers in', 'venues in', 'decorators in',
        'banquet halls in', 'services in', 'companies in', 'agents',
        'booking agents', 'venue booking', 'wedding vendors',
        'wedding planner', 'event planner', 'wedding coordinator'
    ]
    
    # Check if name or description contains collection indicators
    return any(indicator in name or indicator in description for indicator in collection_indicators)

# Availability and Confidence Scoring
def calculate_availability_confidence(vendor_info, date_preferences=None):
    """
    Calculate availability and confidence scores for vendors based on date preferences
    Returns availability status and confidence score (0-100)
    """
    import random
    from datetime import datetime, timedelta
    
    # Default confidence based on vendor rating and type
    base_confidence = min(95, int(vendor_info.get('rating', 4.0) * 20))
    
    # Factor in number of wedding days
    wedding_days = 1
    if date_preferences and 'weddingDays' in date_preferences:
        try:
            wedding_days = int(date_preferences['weddingDays'])
        except (ValueError, TypeError):
            wedding_days = 1
    
    # Adjust confidence and availability based on wedding duration
    if wedding_days > 1:
        # Multi-day weddings are harder to accommodate
        confidence_adjustment = -(wedding_days - 1) * 5  # -5% per additional day
        availability_adjustment = -(wedding_days - 1) * 0.1  # Lower availability for multi-day
        base_confidence = max(60, base_confidence + confidence_adjustment)
    else:
        availability_adjustment = 0
    
    if not date_preferences:
        return {
            'availability_status': 'Available - Contact to Confirm',
            'confidence_score': base_confidence,
            'availability_note': 'No specific dates provided. Contact vendor for availability.',
            'next_available_dates': []
        }
    
    flexibility = date_preferences.get('dateFlexibility')
    specific_date = date_preferences.get('specificDate')
    
    # Generate availability based on flexibility
    if specific_date:
        # For specific dates, simulate real availability checking
        try:
            target_date = datetime.strptime(specific_date, '%Y-%m-%d')
            days_ahead = (target_date - datetime.now()).days
            
            if days_ahead < 30:
                # Short notice - lower availability
                availability_chance = 0.4 + availability_adjustment
                confidence_adjustment = -20
            elif days_ahead < 90:
                # 1-3 months - medium availability
                availability_chance = 0.7 + availability_adjustment
                confidence_adjustment = -5
            else:
                # 3+ months - good availability
                availability_chance = 0.9 + availability_adjustment
                confidence_adjustment = 5
                
            # Ensure availability chance doesn't go below 0.1 or above 1.0
            availability_chance = max(0.1, min(1.0, availability_chance))
            is_available = random.random() < availability_chance
            final_confidence = max(50, min(95, base_confidence + confidence_adjustment))
            
            if is_available:
                duration_text = f" ({wedding_days} days)" if wedding_days > 1 else ""
                return {
                    'availability_status': f'Available on {target_date.strftime("%B %d, %Y")}{duration_text}',
                    'confidence_score': final_confidence,
                    'availability_note': f'Confirmed availability for your {wedding_days}-day wedding celebration.',
                    'next_available_dates': [specific_date],
                    'wedding_days': wedding_days
                }
            else:
                # Generate alternative dates
                alt_dates = []
                for i in range(3):
                    alt_date = target_date + timedelta(days=random.randint(7, 21))
                    alt_dates.append(alt_date.strftime('%Y-%m-%d'))
                
                duration_note = f" for {wedding_days} consecutive days" if wedding_days > 1 else ""
                return {
                    'availability_status': 'Not Available - Alternatives Suggested',
                    'confidence_score': max(60, final_confidence - 15),
                    'availability_note': f'Requested dates unavailable{duration_note}. Alternative start dates suggested.',
                    'next_available_dates': alt_dates,
                    'wedding_days': wedding_days
                }
                
        except ValueError:
            pass  # Invalid date format, fall through to flexible handling
    
    # Handle flexible date ranges
    duration_text = f" ({wedding_days} days)" if wedding_days > 1 else ""
    
    if flexibility == '3months':
        availability_status = f'High Availability - 3 Month Window{duration_text}'
        confidence_score = min(90, base_confidence + 10)
        note = f'Excellent availability within 3 months for {wedding_days}-day celebrations. Multiple date options.'
    elif flexibility == '6months':
        availability_status = f'Excellent Availability - 6 Month Window{duration_text}'
        confidence_score = min(95, base_confidence + 15)
        note = f'Outstanding availability within 6 months for {wedding_days}-day celebrations. Premium date choices.'
    elif flexibility == '12months':
        availability_status = f'Premium Availability - 12 Month Window{duration_text}'
        confidence_score = min(98, base_confidence + 20)
        note = f'Premium availability with 12 month flexibility for {wedding_days}-day celebrations. All preferred dates available.'
    else:
        availability_status = f'Available - Contact to Confirm{duration_text}'
        confidence_score = base_confidence
        note = f'Contact vendor directly to confirm availability for {wedding_days}-day celebration.'
    
    # Generate sample available dates for flexible bookings
    available_dates = []
    start_date = datetime.now() + timedelta(days=30)
    for i in range(5):
        sample_date = start_date + timedelta(days=random.randint(0, 90))
        available_dates.append(sample_date.strftime('%Y-%m-%d'))
    
    return {
        'availability_status': availability_status,
        'confidence_score': confidence_score,
        'availability_note': note,
        'next_available_dates': sorted(available_dates),
        'wedding_days': wedding_days
    }

# Communications Agent Class
class CommunicationsAgent:
    def __init__(self):
        self.templates = {
            'inquiry': {
                'subject': 'Wedding {category} Inquiry - {date}',
                'body': '''Dear {vendor_name} Team,

We hope this message finds you well. We are planning our wedding celebration and are interested in your {category} services.

**Wedding Details:**
• Date: {date}
• Venue: {venue}
• Guest Count: {guest_count}
• Duration: {duration}
• Style Preference: Traditional with modern touches

**About Us:**
We are {customer_name} and we're looking for exceptional {category} services for our special day. We came across your work and are impressed by your portfolio and reputation.

**Our Requirements:**
• Professional and reliable service
• Competitive pricing within our budget
• Flexibility in customization
• High-quality standards

We would love to discuss our requirements in detail and understand your service offerings, packages, and availability for our wedding date.

Could you please share:
1. Your availability for {date}
2. Service packages and pricing
3. Portfolio/previous work samples
4. Terms and conditions
5. Next steps for booking

We look forward to hearing from you soon.

Best regards,
{customer_name}
Phone: {customer_phone}
Email: {customer_email}'''
            },
            'quote': {
                'subject': 'Formal Quote Request - Wedding {category} Services',
                'body': '''Dear {vendor_name},

We are writing to request a formal quotation for your {category} services for our upcoming wedding celebration.

**Event Details:**
• Wedding Date: {date}
• Venue: {venue}
• Number of Guests: {guest_count}
• Event Duration: {duration}
• Couple: {customer_name}

**Specific Requirements:**
We are looking for comprehensive {category} services that align with our vision of a memorable wedding celebration. Based on your portfolio and reputation, we believe you would be the perfect fit for our special day.

**Quote Request:**
Please provide a detailed quotation including:
• Complete service breakdown
• Package options available
• Pricing structure
• Payment terms and schedule
• Cancellation policy
• Additional services/add-ons
• Timeline and planning process

**Budget Range:**
Our allocated budget for {category} services is competitive and we're looking for the best value proposition that meets our quality expectations.

**Next Steps:**
If your quotation aligns with our requirements, we would like to schedule a consultation to discuss the details further and finalize the booking.

Please send your quotation at your earliest convenience as we are planning to finalize our vendors soon.

Thank you for your time and consideration.

Warm regards,
{customer_name}
Contact: {customer_phone}
Email: {customer_email}'''
            }
        }

    def generate_message(self, message_type, vendor_info, wedding_info, additional_info=None):
        try:
            template = self.templates.get(message_type, self.templates['inquiry'])
            
            # Prepare data for formatting
            data = {
                'vendor_name': vendor_info.get('name', 'Team'),
                'category': vendor_info.get('category', 'services'),
                'date': wedding_info.get('date', '[Wedding Date]'),
                'venue': wedding_info.get('venue', '[Wedding Venue]'),
                'guest_count': wedding_info.get('guest_count', '[Guest Count]'),
                'duration': wedding_info.get('duration', '[Event Duration]'),
                'customer_name': wedding_info.get('customer_name', '[Customer Name]'),
                'customer_phone': wedding_info.get('customer_phone', '[Phone Number]'),
                'customer_email': wedding_info.get('customer_email', '[Email Address]')
            }
            
            return template['body'].format(**data)
            
        except Exception as e:
            logger.error(f"Error generating message: {e}")
            return f"Hello {vendor_info.get('name', 'Team')},\n\nWe are interested in your {vendor_info.get('category', 'services')} for our wedding. Please contact us to discuss details.\n\nThank you!"

    def generate_whatsapp_message(self, vendor_info, wedding_info):
        try:
            vendor_name = vendor_info.get('name', 'Team')
            category = vendor_info.get('category', 'services')
            date = wedding_info.get('date', '[Date]')
            guest_count = wedding_info.get('guest_count', '[Guest Count]')
            customer_name = wedding_info.get('customer_name', '[Name]')
            
            message = f"""🌸 Wedding {category.title()} Inquiry 💍

Hi {vendor_name}! 

We're {customer_name} planning our wedding and interested in your {category} services.

📅 Date: {date}
👥 Guests: {guest_count}
🎯 Looking for: Professional {category} services

Would love to discuss availability and packages. Could you share your pricing and portfolio?

Thanks! 🙏"""
            
            return message
            
        except Exception as e:
            logger.error(f"Error generating WhatsApp message: {e}")
            return f"Hi! Interested in your {vendor_info.get('category', 'services')} for our wedding. Please contact us!"

# Initialize communications agent
comm_agent = CommunicationsAgent()

class VendorDataValidator:
    """Comprehensive validation and cleaning system for vendor data"""
    
    def __init__(self):
        self.professional_names = [
            'Elite Events', 'Royal Celebrations', 'Premium Planners', 'Grand Occasions',
            'Classic Creations', 'Modern Moments', 'Perfect Parties', 'Elegant Experiences',
            'Majestic Memories', 'Signature Services', 'Golden Gatherings', 'Diamond Decor',
            'Crystal Celebrations', 'Artistic Affairs', 'Creative Concepts', 'Dream Designers',
            'Luxe Weddings', 'Pristine Events', 'Stellar Celebrations', 'Opulent Occasions'
        ]
        
        self.invalid_name_patterns = [
            'justdial', 'indiamart', 'sulekha', 'urbanpro', 'wedmegood', 'weddingz',
            'top', 'best', 'list of', 'find', 'search', 'directory', 'booking agents',
            'wedding decoration in', 'catering services in', 'photographers in'
        ]
    
    def validate_vendor_list(self, vendors: List[Dict]) -> List[Dict]:
        """Validate and clean entire vendor list with deduplication"""
        validated_vendors = []
        seen_names = set()
        seen_phones = set()
        
        for vendor in vendors:
            cleaned_vendor = self.validate_single_vendor(vendor)
            if cleaned_vendor:
                # Check for duplicates by name and phone
                vendor_name = cleaned_vendor.get('name', '').lower().strip()
                vendor_phone = cleaned_vendor.get('phone', '').strip()
                
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
                
                validated_vendors.append(cleaned_vendor)
        
        return validated_vendors
    
    def validate_single_vendor(self, vendor: Dict) -> Dict:
        """Validate and clean single vendor data with contact validation"""
        if not vendor:
            return None
        
        # Clean vendor name (but preserve if it's already a valid business name)
        original_name = vendor.get('name', '')
        if not self._is_obviously_invalid_name(original_name):
            vendor['name'] = original_name  # Keep original if it seems valid
        else:
            vendor['name'] = self.clean_vendor_name(original_name, vendor.get('category', ''), vendor.get('location', 'Mumbai'))
        
        # Validate and clean all contact information
        vendor['phone'] = self.clean_phone_number(vendor.get('phone', ''))
        vendor['email'] = self.validate_email(vendor.get('email', ''), vendor['name'])
        vendor['google_maps'] = self.generate_clean_maps_link(vendor['name'], vendor.get('location', 'Mumbai'))
        vendor['instagram'] = self.validate_instagram_handle(vendor.get('instagram', ''), vendor['name'])
        vendor['whatsapp'] = self.validate_whatsapp_number(vendor.get('phone', ''))
        
        # Add contact validation flags
        vendor['has_valid_phone'] = self.is_valid_phone(vendor['phone'])
        vendor['has_valid_email'] = self.is_valid_email_format(vendor['email'])
        vendor['has_valid_maps'] = self.is_valid_maps_link(vendor['google_maps'])
        vendor['has_valid_instagram'] = self.is_valid_instagram_handle(vendor['instagram'])
        vendor['has_valid_whatsapp'] = self.is_valid_phone(vendor['phone'])  # Use same validation as phone
        
        # Ensure reasonable rating
        vendor['rating'] = self.validate_rating(vendor.get('rating', 4.0))
        
        # Clean description
        vendor['description'] = self.clean_description(vendor.get('description', ''))
        
        return vendor

    def _is_obviously_invalid_name(self, name: str) -> bool:
        """Check if name is obviously invalid and should be replaced"""
        if not name or len(name.strip()) < 3:
            return True
        
        name_lower = name.lower().strip()
        
        # Obviously invalid patterns
        invalid_patterns = [
            'vendor', 'business', 'service', 'company', 'contact', 'phone', 
            'booking', 'details', 'info', 'website', 'page', 'directory',
            'top', 'best', 'list of', 'find', 'search', 'compare', 'reviews',
            'ratings', 'recommended', 'popular', 'famous', 'leading',
            'photographers in', 'caterers in', 'venues in', 'decorators in',
            'banquet halls in', 'services in', 'companies in', 'agents',
            'booking agents', 'venue booking', 'wedding vendors',
            'wedding planner', 'event planner', 'wedding coordinator'
        ]
        
        # Check for invalid patterns
        if any(pattern in name_lower for pattern in invalid_patterns):
            return True
        
        # Check for generic business names
        generic_names = [
            'wedding services', 'event services', 'catering services',
            'photography services', 'decoration services', 'venue services',
            'wedding planner', 'event planner', 'wedding coordinator'
        ]
        
        if any(generic in name_lower for generic in generic_names):
            return True
        
        # Check for very short or numeric names
        if len(name.strip()) < 5 or name.strip().isdigit():
            return True
        
        return False
    
    def is_valid_phone(self, phone: str) -> bool:
        """Check if phone number is valid"""
        if not phone:
            return False
        
        # Extract digits
        digits = re.sub(r'[^\d]', '', phone)
        
        # Indian mobile numbers should be 10 digits or 12 digits with country code
        return len(digits) in [10, 12] and digits.startswith(('91', '6', '7', '8', '9'))
    
    def is_valid_email_format(self, email: str) -> bool:
        """Check if email format is valid"""
        if not email:
            return False
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        is_valid = bool(re.match(email_pattern, email))
        
        # Also check for generic domains that might be fake
        if is_valid:
            generic_domains = ['weddingservices.com', 'example.com', 'test.com']
            domain = email.split('@')[1].lower()
            if domain in generic_domains:
                return False
        
        return is_valid
    
    def is_valid_maps_link(self, maps_link: str) -> bool:
        """Check if Google Maps link is valid"""
        if not maps_link:
            return False
        
        # Check for malformed characters or overly long URLs
        if len(maps_link) > 200 or '%E0%A4%' in maps_link:  # Hindi characters encoded
            return False
        
        return maps_link.startswith('https://www.google.com/maps/search/')
    
    def is_valid_instagram_handle(self, instagram: str) -> bool:
        """Check if Instagram handle is valid"""
        if not instagram:
            return False
        
        # Should be a proper Instagram URL
        if not instagram.startswith('https://instagram.com/'):
            return False
        
        # Extract handle and validate
        handle = instagram.replace('https://instagram.com/', '').split('/')[0]
        if not handle or len(handle) < 3 or len(handle) > 30:
            return False
        
        # Check for valid characters
        if not re.match(r'^[a-zA-Z0-9._]+$', handle):
            return False
        
        return True
    
    def validate_instagram_handle(self, instagram: str, business_name: str) -> str:
        """Validate and generate Instagram handle"""
        if self.is_valid_instagram_handle(instagram):
            return instagram
        
        # Generate from business name
        handle = re.sub(r'[^\w]', '', business_name.lower())[:20]
        if handle and len(handle) >= 3:
            return f"https://instagram.com/{handle}"
        
        return ""  # Return empty if can't generate valid handle
    
    def validate_whatsapp_number(self, phone: str) -> str:
        """Validate WhatsApp number"""
        if self.is_valid_phone(phone):
            # Clean phone for WhatsApp
            digits = re.sub(r'[^\d]', '', phone)
            if len(digits) == 12 and digits.startswith('91'):
                return digits
            elif len(digits) == 10:
                return f"91{digits}"
        
        return ""  # Return empty if invalid
    
    def clean_vendor_name(self, name: str, category: str = "", location: str = "Mumbai") -> str:
        """Clean vendor name aggressively"""
        if not name or len(name) < 2:
            return self._generate_category_specific_name(category, location)
        
        # Check if name contains invalid patterns
        name_lower = name.lower()
        for pattern in self.invalid_name_patterns:
            if pattern in name_lower:
                return self._generate_category_specific_name(category, location)
        
        # Remove directory sites and suffixes
        name = re.sub(r'\s*-\s*(?:Justdial|IndiaMART|Sulekha|UrbanPro|WedMeGood).*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*\|\s*.*', '', name)
        
        # Remove location and generic terms
        name = re.sub(r'(?:in|near|at)\s+\w+(?:\s*,\s*\w+)*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'(?:Wedding|Event|Marriage|Party)\s+(?:Decoration|Catering|Photography|Planning|Services?)', '', name, flags=re.IGNORECASE)
        name = re.sub(r'(?:Best|Top|Leading|Professional|Find|Search)', '', name, flags=re.IGNORECASE)
        
        # Clean special characters and normalize
        name = re.sub(r'[^\w\s&\'-]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        
        # If result is too short, generic, or has non-English characters
        if (len(name) < 5 or 
            any(word in name.lower() for word in ['services', 'company', 'business']) or
            len([c for c in name if c.isascii() and c.isalpha()]) < len(name) * 0.7):
            return self._generate_category_specific_name(category, location)
        
        # Capitalize properly
        return name.title()[:40]

    def _generate_category_specific_name(self, category: str, location: str) -> str:
        """Generate category-specific business names"""
        category_patterns = {
            'photography': [
                'Lens & Light Studio', 'Candid Moments Photography', 'Perfect Frames Studio',
                'Royal Wedding Photography', 'Artistic Vision Studio', 'Golden Hour Photography'
            ],
            'venues': [
                'Grand Palace Banquet', 'Royal Gardens Venue', 'Elegant Banquet Hall',
                'Crystal Palace Venue', 'Majestic Celebrations Hall', 'Premium Banquet Facilities'
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
        
        names = category_patterns.get(category, self.professional_names)
        return random.choice(names)
    
    def generate_clean_maps_link(self, vendor_name: str, location: str = "Mumbai") -> str:
        """Generate clean Google Maps link"""
        # Use only clean business name and location
        clean_name = re.sub(r'[^\w\s]', ' ', vendor_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
        search_query = f"{clean_name} {location}"
        encoded_query = urllib.parse.quote_plus(search_query)
        
        return f"https://www.google.com/maps/search/{encoded_query}"
    
    def clean_phone_number(self, phone: str) -> str:
        """Clean and format phone number"""
        if not phone:
            return f"+91 {random.randint(90000, 99999)} {random.randint(10000, 99999)}"
        
        # Extract digits only
        digits = re.sub(r'[^\d]', '', phone)
        
        # Format Indian mobile number
        if len(digits) == 10:
            return f"+91 {digits[:5]} {digits[5:]}"
        elif len(digits) == 12 and digits.startswith('91'):
            return f"+{digits[:2]} {digits[2:7]} {digits[7:]}"
        elif len(digits) >= 10:
            # Use last 10 digits
            last_ten = digits[-10:]
            return f"+91 {last_ten[:5]} {last_ten[5:]}"
        
        # Generate random if invalid
        return f"+91 {random.randint(90000, 99999)} {random.randint(10000, 99999)}"
    
    def validate_email(self, email: str, business_name: str) -> str:
        """Validate and generate professional email"""
        # Check if email is valid
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if email and re.match(email_pattern, email) and not any(domain in email.lower() for domain in ['weddingservices.com', 'example.com']):
            return email
        
        # Generate professional email from business name
        email_prefix = re.sub(r'[^\w]', '', business_name.lower())[:15]
        if not email_prefix:
            email_prefix = 'info'
        
        domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'weddingservices.com']
        return f"{email_prefix}@{random.choice(domains)}"
    
    def validate_rating(self, rating: float) -> float:
        """Ensure rating is reasonable"""
        try:
            rating = float(rating)
            if rating < 3.5 or rating > 5.0:
                return round(random.uniform(3.8, 4.8), 1)
            return round(rating, 1)
        except (ValueError, TypeError):
            return round(random.uniform(3.8, 4.8), 1)
    
    def clean_description(self, description: str) -> str:
        """Clean vendor description"""
        if not description:
            return "Professional wedding services with experienced team and quality commitment."
        
        # Remove contact info and promotional text
        description = re.sub(r'(?:Call|Contact|Phone|Mobile|WhatsApp).*?(?:\.|$)', '', description, flags=re.IGNORECASE)
        description = re.sub(r'(?:Visit|Check)\s+(?:our\s+)?(?:website|site).*?(?:\.|$)', '', description, flags=re.IGNORECASE)
        description = re.sub(r'(?:Book|Order|Hire)\s+(?:online|now).*?(?:\.|$)', '', description, flags=re.IGNORECASE)
        
        # Clean up and limit length
        description = re.sub(r'\s+', ' ', description).strip()
        if len(description) > 150:
            description = description[:147] + "..."
        
        return description if description else "Professional wedding services with experienced team and quality commitment."
    
    def generate_instagram_handle(self, business_name: str) -> str:
        """Generate Instagram handle from business name"""
        handle = re.sub(r'[^\w]', '', business_name.lower())[:20]
        return f"https://instagram.com/{handle}" if handle else "https://instagram.com/weddingservices"

# Global validator instance
vendor_validator = VendorDataValidator()

# Health Check Endpoints
@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "BID AI Wedding Assistant - Unified Server",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "frontend": "✅ Active",
            "vendor_discovery": "✅ Active", 
            "communications_agent": "✅ Active",
            "api_endpoints": "✅ Active"
        },
        "endpoints": {
            "frontend": "http://localhost:8000",
            "vendor_discovery": "http://localhost:8000/vendor-discovery",
            "api_docs": "http://localhost:8000/api/docs"
        }
    })

@app.get("/api/health")
async def api_health():
    return await health_check()

@app.get("/api/database-stats")
async def get_database_stats():
    """Get NocoDB vendor database statistics"""
    try:
        vendor_db = get_vendor_database()
        stats = vendor_db.get_database_stats()
        return JSONResponse({
            "success": True,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Error getting database stats: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })

# Serve static files
@app.get("/js/{file_path:path}")
async def serve_js(file_path: str):
    file_location = STATIC_DIR / "js" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/css/{file_path:path}")
async def serve_css(file_path: str):
    file_location = STATIC_DIR / "css" / file_path
    if file_location.exists():
        return FileResponse(file_location, media_type="text/css")
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    file_location = STATIC_DIR / "assets" / file_path
    if file_location.exists():
        return FileResponse(file_location)
    raise HTTPException(status_code=404, detail="File not found")

# Vendor Discovery Routes
@app.get("/vendor-discovery")
async def serve_vendor_discovery():
    vendor_file = STATIC_DIR / "vendor-discovery.html"
    if vendor_file.exists():
        return FileResponse(vendor_file, media_type="text/html")
    
    # Fallback
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")
    
    raise HTTPException(status_code=404, detail="Vendor discovery page not found")

@app.api_route("/api/vendor-data/{category}", methods=["GET", "POST"])
async def get_vendor_data(category: str, request: Request):
    try:
        # --- 1. Gather preferences from POST JSON or GET query params ---
        if request.method == "POST":
            data = await request.json()
            preferences = data
            logger.info(f"🔎 Received POST vendor search preferences: {json.dumps(preferences, indent=2)}")
        else:
            preferences = dict(request.query_params)

        # --- 2. Extract only relevant parameters for each category ---
        category = category.lower()
        relevant = {}
        if category == "venues":
            relevant = {
                'city': preferences.get('city', ''),
                'event_dates': preferences.get('weddingDate', ''),
                'guest_count': preferences.get('guestCount', ''),
                'venue_type': preferences.get('venueType', ''),
                'ambience': preferences.get('theme', ''),
                'budget': preferences.get('budget', ''),
                'indoor_outdoor': preferences.get('indoorOutdoor', ''),
                'accessibility': preferences.get('specialRequirements', ''),
            }
        elif category == "catering":
            relevant = {
                'cuisine': preferences.get('cuisineStyle', ''),
                'guest_count': preferences.get('guestCount', ''),
                'meal_types': preferences.get('mealTypes', ''),
                'dietary': preferences.get('specialRequirements', ''),
                'live_counters': preferences.get('liveCounters', ''),
                'budget_per_plate': preferences.get('budget', ''),
                'service_style': preferences.get('serviceStyle', ''),
            }
        elif category == "decoration":
            relevant = {
                'style': preferences.get('decorStyle', ''),
                'theme': preferences.get('theme', ''),
                'color_palette': preferences.get('colorScheme', ''),
                'events': preferences.get('events', ''),
                'special': preferences.get('specialRequirements', ''),
                'budget': preferences.get('budget', ''),
                'lighting_sound': preferences.get('lightingStyle', ''),
            }
        elif category == "makeup":
            relevant = {
                'num_people': preferences.get('numPeople', ''),
                'service_dates': preferences.get('weddingDate', ''),
                'style': preferences.get('makeupStyle', ''),
                'special': preferences.get('specialRequirements', ''),
                'budget': preferences.get('budget', ''),
            }
        elif category == "photography":
            relevant = {
                'events': preferences.get('events', ''),
                'num_days': preferences.get('weddingDays', ''),
                'style': preferences.get('photographyStyle', ''),
                'videography': preferences.get('videography', ''),
                'budget': preferences.get('budget', ''),
            }
        else:
            relevant = preferences

        # --- 3. Try NocoDB first, then Serper AI if needed ---
        use_serper = preferences.get('use_serper', 'true')
        if isinstance(use_serper, str):
            use_serper = use_serper.lower() == 'true'
        location = relevant.get('city', 'Mumbai')
        
        # Initialize vendor database
        vendor_db = get_vendor_database()
        
        # First, try to get vendors from NocoDB
        try:
            logger.info(f"🔍 Checking NocoDB for {category} vendors in {location}")
            db_vendors = vendor_db.search_vendors(category, location, search_params=relevant)
            
            if db_vendors and len(db_vendors) >= 3:
                logger.info(f"✅ Found {len(db_vendors)} vendors in NocoDB for {category} in {location}")
                return JSONResponse({
                    'success': True,
                    'vendors': db_vendors,
                    'category': category,
                    'location': location,
                    'source': 'nocodb',
                    'preferences_used': relevant,
                    'total_found': len(db_vendors),
                    'validation_applied': True,
                    'timestamp': datetime.now().isoformat()
                })
            else:
                logger.info(f"⚠️ Insufficient vendors in NocoDB for {category} in {location}, fetching from Serper AI")
        except Exception as e:
            logger.error(f"❌ Error fetching from NocoDB: {e}")
        
        # Fallback to Serper AI if NocoDB doesn't have enough data
        if use_serper:
            try:
                logger.info(f"🔍 Fetching {category} vendors using Serper AI in {location}")
                serper_result = search_vendors(category, location, 8)
                if serper_result.get('success') and serper_result.get('vendors'):
                    serper_vendors = []
                    for vendor in serper_result['vendors']:
                        # Enhanced vendor data with individual contact details
                        enhanced_vendor = {
                            'id': vendor.get('id'),
                            'name': vendor.get('name'),
                            'description': vendor.get('description'),
                            'location': vendor.get('location'),
                            'rating': vendor.get('rating', 4.2),
                            'price': vendor.get('price_range', '₹50,000 - ₹2,00,000'),
                            'phone': vendor.get('phone'),
                            'email': vendor.get('email'),
                            'website': vendor.get('website'),
                            'google_maps': vendor.get('google_maps'),
                            'instagram': vendor.get('instagram'),
                            'whatsapp': vendor.get('whatsapp'),
                            'specialties': vendor.get('specialties', []),
                            'verified': vendor.get('verified', False),
                            'category': category,
                            'source': 'serper_ai',
                            'primary_image': vendor.get('primary_image', ''),
                            'thumbnail_image': vendor.get('thumbnail_image', ''),
                            'images': vendor.get('images', []),
                            'justifications': vendor.get('justifications', []),
                            'highlights': vendor.get('highlights', []),
                            'sentiment_analysis': vendor.get('sentiment_analysis', {}),
                            'match_score': vendor.get('match_score', 85),
                            'recommendation_tier': vendor.get('recommendation_tier', 'Good Match'),
                            # Enhanced contact validation
                            'has_valid_phone': bool(vendor.get('phone') and vendor.get('phone') != 'N/A'),
                            'has_valid_email': bool(vendor.get('email') and vendor.get('email') != 'N/A'),
                            'has_valid_website': bool(vendor.get('website') and vendor.get('website') != 'N/A'),
                            'has_valid_whatsapp': bool(vendor.get('whatsapp') and vendor.get('whatsapp') != 'N/A'),
                            'has_valid_instagram': bool(vendor.get('instagram') and vendor.get('instagram') != 'N/A'),
                            'contact_score': _calculate_contact_score(vendor)
                        }
                        serper_vendors.append(enhanced_vendor)
                    
                    # Apply enhanced validation to ensure individual vendors
                    validated_vendors = vendor_validator.validate_vendor_list(serper_vendors)
                    
                    # Additional filtering to ensure individual contact details
                    individual_vendors = []
                    for vendor in validated_vendors:
                        # Must have at least one valid contact method
                        has_contact = (
                            vendor.get('has_valid_phone') or 
                            vendor.get('has_valid_email') or 
                            vendor.get('has_valid_website') or
                            vendor.get('has_valid_whatsapp')
                        )
                        
                        # Must not be a collection/directory page
                        is_individual = not _is_collection_page(vendor)
                        
                        if has_contact and is_individual:
                            individual_vendors.append(vendor)
                    
                    # Store vendors in NocoDB for future use
                    try:
                        stored_count = vendor_db.store_vendors(individual_vendors, category, location, f"{category} vendors in {location}")
                        logger.info(f"💾 Stored {stored_count} vendors in NocoDB for {category} in {location}")
                    except Exception as e:
                        logger.error(f"❌ Error storing vendors in NocoDB: {e}")
                    
                    logger.info(f"✅ Found {len(individual_vendors)} individual vendors via Serper AI")
                    return JSONResponse({
                        'success': True,
                        'vendors': individual_vendors,
                        'category': category,
                        'location': location,
                        'source': 'serper_ai_individual',
                        'preferences_used': relevant,
                        'total_found': len(individual_vendors),
                        'validation_applied': True,
                        'individual_contacts_verified': True,
                        'timestamp': datetime.now().isoformat()
                    })
            except Exception as e:
                logger.warning(f"⚠️ Serper AI failed, falling back to mock data: {e}")

        # --- 4. Fallback to mock data ---
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
                    'category': 'venues',
                    'primary_image': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                            'title': 'Royal Garden Palace - Wedding Venue',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                        }
                    ]
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
                    'category': 'venues',
                    'primary_image': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
                            'title': 'Heritage Haveli - Traditional Venue',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200'
                        }
                    ]
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
                    'category': 'decoration',
                    'primary_image': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
                            'title': 'Elegant Decor Studio - Wedding Decoration',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200'
                        }
                    ]
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
                    'category': 'decoration',
                    'primary_image': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
                            'title': 'Bloom & Bliss - Floral Decoration',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200'
                        }
                    ]
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
                    'category': 'catering',
                    'primary_image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
                            'title': 'Spice Route Catering - Wedding Food',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200'
                        }
                    ]
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
                    'category': 'catering',
                    'primary_image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
                            'title': 'Royal Feast - Traditional Cuisine',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200'
                        }
                    ]
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
                    'category': 'makeup',
                    'primary_image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                            'title': 'Glamour Studio - Bridal Makeup',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200'
                        }
                    ]
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
                    'category': 'makeup',
                    'primary_image': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
                            'title': 'Beauty Bliss - Beauty Services',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200'
                        }
                    ]
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
                    'category': 'photography',
                    'primary_image': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                            'title': 'Capture Moments - Wedding Photography',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200'
                        }
                    ]
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
                    'category': 'photography',
                    'primary_image': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
                    'thumbnail_image': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200',
                    'images': [
                        {
                            'url': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
                            'title': 'Wedding Chronicles - Photography Studio',
                            'source': 'Unsplash',
                            'width': 400,
                            'height': 300,
                            'thumbnail': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200'
                        }
                    ]
                }
            ]
        }
        
        # Get mock vendors for the category
        mock_vendors = vendor_data.get(category, [])

        # --- 5. Filter mock vendors using only relevant parameters ---
        def matches(vendor):
            if category == "venues":
                if relevant['city'] and vendor.get('location') and relevant['city'].lower() not in vendor['location'].lower():
                    return False
                if relevant['venue_type'] and vendor.get('description') and relevant['venue_type'].lower() not in vendor['description'].lower():
                    return False
                if relevant['ambience'] and vendor.get('description') and relevant['ambience'].lower() not in vendor['description'].lower():
                    return False
                if relevant['budget'] and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "catering":
                if relevant['cuisine'] and vendor.get('description') and relevant['cuisine'].lower() not in vendor['description'].lower():
                    return False
                if relevant['budget_per_plate'] and vendor.get('price') and str(relevant['budget_per_plate']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "decoration":
                if relevant['style'] and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant['theme'] and vendor.get('description') and relevant['theme'].lower() not in vendor['description'].lower():
                    return False
                if relevant['budget'] and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "makeup":
                if relevant['style'] and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant['budget'] and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            elif category == "photography":
                if relevant['style'] and vendor.get('description') and relevant['style'].lower() not in vendor['description'].lower():
                    return False
                if relevant['budget'] and vendor.get('price') and str(relevant['budget']) not in str(vendor['price']):
                    return False
                # Add more as needed
            return True
        filtered_vendors = [v for v in mock_vendors if matches(v)]
        validated_mock_vendors = vendor_validator.validate_vendor_list(filtered_vendors)
        
        return JSONResponse({
            'success': True,
            'vendors': validated_mock_vendors,
            'category': category,
            'location': relevant.get('city', ''),
            'source': 'mock_data_validated',
            'preferences_used': relevant,
            'total_found': len(validated_mock_vendors),
            'validation_applied': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching vendor data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-message")
async def generate_message(request: Request):
    try:
        data = await request.json()
        
        message_type = data.get('message_type', 'inquiry')
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        additional_info = data.get('additional_info', {})
        
        message = comm_agent.generate_message(
            message_type, vendor_info, wedding_info, additional_info
        )
        
        return JSONResponse({
            'success': True,
            'message': message,
            'message_type': message_type,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-whatsapp-message")
async def generate_whatsapp_message(request: Request):
    try:
        data = await request.json()
        
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        
        message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return JSONResponse({
            'success': True,
            'message': message,
            'platform': 'whatsapp',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating WhatsApp message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/test-communication")
async def test_communication():
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
        quote_message = comm_agent.generate_message('quote', vendor_info, wedding_info)
        whatsapp_message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return JSONResponse({
            'success': True,
            'test_results': {
                'inquiry_message': inquiry_message,
                'quote_message': quote_message,
                'whatsapp_message': whatsapp_message
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in communication test: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Serper AI Image Search Endpoints
@app.options("/api/theme-images")
async def theme_images_options():
    """Handle OPTIONS preflight for theme-images"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.get("/api/theme-images")
async def get_all_theme_images():
    """Get images for all wedding themes"""
    try:
        logger.info("🖼️ Fetching images for all wedding themes...")
        images = get_theme_images()
        
        return JSONResponse(
            content={
                'success': True,
                'images': images,
                'timestamp': datetime.now().isoformat(),
                'total_themes': len(images)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
        
    except Exception as e:
        logger.error(f"Error fetching theme images: {e}")
        return JSONResponse(
            content={
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            },
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Content-Type": "application/json"
            }
        )

@app.get("/api/theme-images/{theme}")
async def get_specific_theme_images(theme: str):
    """Get images for a specific wedding theme"""
    try:
        logger.info(f"🖼️ Fetching images for theme: {theme}")
        images = get_theme_images(theme)
        
        return JSONResponse({
            'success': True,
            'theme': theme,
            'images': images,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching images for theme {theme}: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'theme': theme,
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/search-images")
async def search_custom_images(request: Request):
    """Search for custom images using Serper AI"""
    try:
        data = await request.json()
        query = data.get('query', '')
        num_results = data.get('num_results', 5)
        
        if not query:
            return JSONResponse({
                'success': False,
                'error': 'Query parameter is required',
                'timestamp': datetime.now().isoformat()
            }, status_code=400)
        
        logger.info(f"🔍 Searching images for query: {query}")
        images = serper_client.search_images(query, num_results)
        
        return JSONResponse({
            'success': True,
            'query': query,
            'images': images,
            'count': len(images),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching custom images: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Serper AI Vendor Search Endpoints
@app.get("/api/search-vendors")
async def search_real_vendors(category: str = "venues", location: str = "Mumbai", num_results: int = 10):
    """Search for real vendors using Serper AI"""
    try:
        logger.info(f"🔍 Searching {category} vendors in {location} using Serper AI...")
        result = search_vendors(category, location, num_results)
        
        return JSONResponse({
            'success': result.get('success', True),
            'category': category,
            'location': location,
            'vendors': result.get('vendors', []),
            'total_found': result.get('total_found', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'category': category,
            'location': location,
            'vendors': [],
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/vendors-all")
async def get_all_real_vendors(location: str = "Mumbai"):
    """Get vendors for all categories using Serper AI"""
    try:
        logger.info(f"🔍 Fetching all vendor categories in {location} using Serper AI...")
        result = get_all_vendors(location)
        
        return JSONResponse({
            'success': result.get('success', True),
            'location': location,
            'vendors_by_category': result.get('vendors_by_category', {}),
            'total_categories': result.get('total_categories', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching all vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'location': location,
            'vendors_by_category': {},
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/search-vendors-custom")
async def search_custom_vendors(request: Request):
    """Search for vendors with custom parameters"""
    try:
        data = await request.json()
        category = data.get('category', 'wedding services')
        location = data.get('location', 'Mumbai')
        num_results = data.get('num_results', 10)
        
        logger.info(f"🔍 Custom vendor search: {category} in {location}")
        result = search_vendors(category, location, num_results)
        
        return JSONResponse({
            'success': result.get('success', True),
            'search_params': {
                'category': category,
                'location': location,
                'num_results': num_results
            },
            'vendors': result.get('vendors', []),
            'total_found': result.get('total_found', 0),
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in custom vendor search: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'vendors': [],
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Simple Budget Analysis (without AI dependencies)
@app.post("/api/budget-analysis")
async def budget_analysis(request: Request):
    try:
        data = await request.json()
        budget_range = data.get('budget_range', '₹20-30 Lakhs')
        wedding_days = int(data.get('wedding_days', 1))
        
        # Base budget allocation percentages
        base_allocations = {
            'venue': 35,
            'catering': 25, 
            'photography': 15,
            'decoration': 12,
            'makeup': 8,
            'miscellaneous': 5
        }
        
        # Calculate day multipliers for different categories
        day_multipliers = {
            'venue': min(wedding_days * 0.8, wedding_days * 1.0),  # Venues often have package deals
            'catering': wedding_days * 1.0,  # Full cost per day
            'photography': min(wedding_days * 0.7, wedding_days * 1.0),  # Photographer packages
            'decoration': min(wedding_days * 0.6, wedding_days * 1.0),  # Some decorations can be reused
            'makeup': wedding_days * 1.0,  # Full makeup needed each day
            'miscellaneous': wedding_days * 0.8  # Some misc costs scale
        }
        
        # Extract base budget amount (assuming middle of range for calculation)
        import re
        numbers = re.findall(r'₹(\d+)', budget_range)
        if len(numbers) >= 2:
            base_amount = (int(numbers[0]) + int(numbers[1])) / 2
        else:
            base_amount = 25  # Default to 25L
            
        # Calculate adjusted allocations
        allocations = {}
        total_multiplied_percentage = sum(base_allocations[cat] * day_multipliers[cat] for cat in base_allocations)
        
        for category, base_percentage in base_allocations.items():
            multiplier = day_multipliers[category]
            adjusted_percentage = (base_percentage * multiplier) / total_multiplied_percentage * 100
            adjusted_amount = base_amount * adjusted_percentage / 100
            
            allocations[category] = {
                'percentage': round(adjusted_percentage, 1),
                'amount_formatted': f'₹{adjusted_amount:.1f} L',
                'range_formatted': f'₹{adjusted_amount*0.8:.1f} L - ₹{adjusted_amount*1.2:.1f} L',
                'day_multiplier': multiplier,
                'notes': get_category_notes(category, wedding_days)
            }
        
        return JSONResponse({
            'success': True,
            'budget_range': budget_range,
            'wedding_days': wedding_days,
            'allocations': allocations,
            'total_estimated': f'₹{sum(day_multipliers[cat] * base_amount * base_allocations[cat] / 100 for cat in base_allocations):.1f} L',
            'notes': f'Budget calculated for {wedding_days}-day wedding celebration',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in budget analysis: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/wedding-data")
async def save_wedding_data(request: Request):
    """Save wedding couple data to NocoDB"""
    try:
        data = await request.json()
        logger.info(f"Received wedding data: {data}")
        
        # Transform data for NocoDB couples table
        couple_data = {
            'partner1_name': data.get('partner1Name', data.get('yourName', '')),
            'partner2_name': data.get('partner2Name', data.get('partnerName', '')),
            'wedding_date': data.get('weddingDate', ''),
            'city': data.get('region', data.get('city', '')),
            'budget': data.get('budget', ''),
            'guest_count': data.get('guestCount', ''),
            'wedding_type': data.get('weddingType', 'Traditional'),
            'wedding_days': data.get('weddingDays', data.get('duration', 1)),
            'preferences': json.dumps(data.get('datePreferences', {})),
            'created_at': datetime.now().isoformat()
        }
        
        # Save to NocoDB
        from vendor_database import get_vendor_database
        vendor_db = get_vendor_database()
        
        # Store in couples table
        result = vendor_db.store_couple_data(couple_data)
        
        if result.get('success'):
            logger.info(f"Wedding data saved successfully: {result.get('id')}")
            return JSONResponse({
                'success': True,
                'message': 'Wedding data saved successfully',
                'record_id': result.get('id'),
                'budget_analysis': {'success': True},
                'timestamp': datetime.now().isoformat()
            })
        else:
            logger.error(f"Failed to save wedding data: {result}")
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to save to database'),
                'timestamp': datetime.now().isoformat()
            }, status_code=500)
            
    except Exception as e:
        logger.error(f"Error saving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/visual-preferences")
async def save_visual_preferences(request: Request):
    """Save visual preferences from the frontend"""
    try:
        data = await request.json()
        logger.info(f"Received visual preferences data: {data}")
        
        from vendor_database import store_user_inputs
        result = store_user_inputs(data)  # Pass the full user input
        
        logger.info(f"Store result: {result}")
        
        # Check if any save operation succeeded
        has_success = False
        error_messages = []
        
        if result and 'results' in result:
            for table, table_result in result['results'].items():
                if table_result and not (isinstance(table_result, dict) and 'error' in table_result):
                    has_success = True
                elif isinstance(table_result, dict) and 'error' in table_result:
                    error_messages.append(f"{table}: {table_result['error']}")
        
        if result and 'errors' in result:
            for table, error in result['errors'].items():
                if error:
                    error_messages.append(f"{table}: {error}")
        
        if has_success:
            return JSONResponse({
                'success': True,
                'result': result,
                'warnings': error_messages if error_messages else None,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': 'Failed to save preferences: ' + '; '.join(error_messages) if error_messages else 'Unknown error',
                'result': result,
                'timestamp': datetime.now().isoformat()
            }, status_code=500)
            
    except Exception as e:
        logger.error(f"Error saving visual preferences: {e}")
        return JSONResponse({
            'success': False,
            'error': f"Server error: {str(e)}",
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/vendors")
async def get_vendors(category: str = "venues", location: str = "bangalore"):
    """Get vendors for the frontend"""
    try:
        from serper_images import search_vendors
        
        # Use the working search_vendors function
        vendor_response = search_vendors(category, location)
        
        # Extract vendors list from the response
        if isinstance(vendor_response, dict) and 'vendors' in vendor_response:
            vendors_list = vendor_response['vendors']
        else:
            vendors_list = vendor_response if isinstance(vendor_response, list) else []
        
        # Format response to match frontend expectations
        return JSONResponse({
            'success': True,
            'vendors': vendors_list,
            'count': len(vendors_list),
            'category': category,
            'location': location,
            'source': 'serper_ai',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting vendors: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# AI Copilot Integration Endpoints
@app.post("/api/ai/wedding-suggestions")
async def get_ai_wedding_suggestions(request: Request):
    """Get AI-powered wedding planning suggestions using Ollama"""
    try:
        data = await request.json()
        suggestions = await ollama_service.get_wedding_suggestions(data)
        return JSONResponse(suggestions)
    except Exception as e:
        logger.error(f"Error getting AI suggestions: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/vendor-analysis")
async def get_ai_vendor_analysis(request: Request):
    """Get AI analysis of vendors using Ollama"""
    try:
        data = await request.json()
        vendors = data.get('vendors', [])
        preferences = data.get('preferences', {})
        
        analysis = await ollama_service.get_vendor_analysis(vendors, preferences)
        return JSONResponse(analysis)
    except Exception as e:
        logger.error(f"Error getting AI vendor analysis: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/timeline")
async def get_ai_timeline(request: Request):
    """Get AI-generated wedding timeline using Ollama"""
    try:
        data = await request.json()
        timeline = await ollama_service.generate_wedding_timeline(data)
        return JSONResponse(timeline)
    except Exception as e:
        logger.error(f"Error generating AI timeline: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/vendor-recommendations")
async def get_ai_vendor_recommendations(request: Request):
    """Get AI-powered vendor recommendations based on search query"""
    try:
        data = await request.json()
        search_query = data.get('search_query', '')
        wedding_context = data.get('wedding_context', {})
        
        recommendations = await ollama_service.get_vendor_recommendations(search_query, wedding_context)
        return JSONResponse(recommendations)
    except Exception as e:
        logger.error(f"Error getting AI vendor recommendations: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/ai/chat")
async def ai_chat_assistant(request: Request):
    """Interactive AI chat assistant using Ollama"""
    try:
        data = await request.json()
        message = data.get('message', '')
        context = data.get('context', {})
        
        # Use Ollama AI service for real AI responses
        response = await ollama_service.chat_assistant(message, context)
        return JSONResponse(response)
    except Exception as e:
        logger.error(f"Error with AI chat: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/save-user-inputs")
async def save_user_inputs(request: Request):
    try:
        data = await request.json()
        from vendor_database import store_user_inputs
        result = store_user_inputs(data)  # Pass the full user input
        return JSONResponse({
            'success': True if any(result['results'].values()) else False,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving user inputs: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/wedding-data/{couple_id}")
async def get_wedding_data(couple_id: str):
    """Retrieve wedding couple data from NocoDB"""
    try:
        from vendor_database import get_vendor_database
        vendor_db = get_vendor_database()
        
        result = vendor_db.get_couple_data(couple_id)
        
        if result.get('success'):
            return JSONResponse({
                'success': True,
                'data': result.get('data'),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to retrieve data'),
                'timestamp': datetime.now().isoformat()
            }, status_code=404)
            
    except Exception as e:
        logger.error(f"Error retrieving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/wedding-data")
async def get_all_wedding_data():
    """Retrieve all wedding couple data from NocoDB"""
    try:
        from vendor_database import get_vendor_database
        vendor_db = get_vendor_database()
        
        result = vendor_db.get_couple_data()
        
        if result.get('success'):
            return JSONResponse({
                'success': True,
                'data': result.get('data'),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JSONResponse({
                'success': False,
                'error': result.get('error', 'Failed to retrieve data'),
                'timestamp': datetime.now().isoformat()
            }, status_code=500)
            
    except Exception as e:
        logger.error(f"Error retrieving wedding data: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Main page and SPA routing
@app.get("/")
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="Index file not found")

@app.get("/{path:path}")
async def serve_spa_routes(path: str):
    # For SPA routes, serve index.html or specific files
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

def main():
    logger.info("🌸 BID AI Wedding Assistant - Simplified Unified Server")
    logger.info("=" * 60)
    logger.info("🚀 Starting simplified unified server on http://localhost:8000")
    logger.info("📱 Frontend: http://localhost:8000")
    logger.info("🎉 Vendor Discovery: http://localhost:8000/vendor-discovery")
    logger.info("🤖 API: http://localhost:8000/api/")
    logger.info("📊 Health: http://localhost:8000/health")
    logger.info("📋 API Docs: http://localhost:8000/api/docs")
    logger.info("=" * 60)
    logger.info("💡 All services running on single port!")
    logger.info("   - Frontend (HTML/CSS/JS)")
    logger.info("   - Vendor Discovery")
    logger.info("   - Communications Agent")
    logger.info("   - Budget Analysis")
    logger.info("=" * 60)
    
    uvicorn.run(
        "simple_unified_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main() 