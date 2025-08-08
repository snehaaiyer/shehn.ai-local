
#!/usr/bin/env python3
"""
Enhanced Vendor Contact Information Extractor
Extracts and standardizes contact information with social media links and icons
"""

import re
import requests
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class VendorContactExtractor:
    """Extract and standardize vendor contact information"""
    
    def __init__(self):
        self.contact_icons = {
            "email": "✉️",
            "phone": "📞", 
            "whatsapp": "📱",
            "website": "🌐",
            "instagram": "📷",
            "facebook": "👥",
            "linkedin": "💼",
            "twitter": "🐦",
            "youtube": "🎥"
        }
        
        self.social_platforms = {
            "instagram": ["instagram.com", "ig.me"],
            "facebook": ["facebook.com", "fb.com", "fb.me"],
            "linkedin": ["linkedin.com"],
            "twitter": ["twitter.com", "t.co"],
            "youtube": ["youtube.com", "youtu.be"],
            "whatsapp": ["wa.me", "whatsapp.com"]
        }
    
    def extract_contact_info(self, vendor_data: Dict) -> Dict:
        """Extract comprehensive contact information from vendor data"""
        contact_info = {
            "vendor_name": vendor_data.get("name", ""),
            "category": vendor_data.get("category", ""),
            "contact_details": {},
            "social_media": {},
            "contact_score": 0,
            "verification_status": {}
        }
        
        # Extract basic contact information
        email = self._extract_email(vendor_data)
        phone = self._extract_phone(vendor_data) 
        website = self._extract_website(vendor_data)
        
        # Extract social media information
        instagram = self._extract_instagram(vendor_data)
        facebook = self._extract_facebook(vendor_data)
        whatsapp = self._extract_whatsapp(vendor_data)
        
        # Populate contact details with icons
        if email:
            contact_info["contact_details"]["email"] = {
                "value": email,
                "icon": self.contact_icons["email"],
                "type": "email",
                "verified": self._verify_email(email)
            }
        
        if phone:
            contact_info["contact_details"]["phone"] = {
                "value": phone,
                "icon": self.contact_icons["phone"], 
                "type": "phone",
                "verified": self._verify_phone(phone)
            }
            
        if website:
            contact_info["contact_details"]["website"] = {
                "value": website,
                "icon": self.contact_icons["website"],
                "type": "website", 
                "verified": self._verify_website(website)
            }
        
        # Populate social media with icons
        if instagram:
            contact_info["social_media"]["instagram"] = {
                "value": instagram,
                "icon": self.contact_icons["instagram"],
                "platform": "instagram",
                "handle": self._extract_handle(instagram, "instagram")
            }
            
        if facebook:
            contact_info["social_media"]["facebook"] = {
                "value": facebook,
                "icon": self.contact_icons["facebook"],
                "platform": "facebook",
                "handle": self._extract_handle(facebook, "facebook")
            }
            
        if whatsapp:
            contact_info["social_media"]["whatsapp"] = {
                "value": whatsapp,
                "icon": self.contact_icons["whatsapp"],
                "platform": "whatsapp",
                "number": self._extract_whatsapp_number(whatsapp)
            }
        
        # Calculate contact score
        contact_info["contact_score"] = self._calculate_contact_score(contact_info)
        
        return contact_info
    
    def _extract_email(self, vendor_data: Dict) -> Optional[str]:
        """Extract email from vendor data"""
        text = str(vendor_data)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else None
    
    def _extract_phone(self, vendor_data: Dict) -> Optional[str]:
        """Extract phone number from vendor data"""
        text = str(vendor_data)
        # Indian phone number patterns
        phone_patterns = [
            r'\+91[-\s]?[6-9]\d{9}',  # +91 format
            r'91[-\s]?[6-9]\d{9}',    # 91 format
            r'[6-9]\d{9}',            # 10 digit format
            r'\d{5}[-\s]?\d{5}',      # Split format
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                phone = phones[0].replace('-', '').replace(' ', '')
                return self._format_phone(phone)
        return None
    
    def _extract_website(self, vendor_data: Dict) -> Optional[str]:
        """Extract website from vendor data"""
        text = str(vendor_data)
        website_pattern = r'https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}'
        websites = re.findall(website_pattern, text)
        
        for website in websites:
            if not any(platform in website.lower() for platforms in self.social_platforms.values() for platform in platforms):
                if not website.startswith('http'):
                    website = 'https://' + website
                return website
        return None
    
    def _extract_instagram(self, vendor_data: Dict) -> Optional[str]:
        """Extract Instagram handle/URL from vendor data"""
        text = str(vendor_data)
        instagram_patterns = [
            r'@([a-zA-Z0-9_.]+)',  # @handle format
            r'instagram\.com/([a-zA-Z0-9_.]+)',  # URL format
            r'ig\.me/([a-zA-Z0-9_.]+)'  # Short URL format
        ]
        
        for pattern in instagram_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                handle = matches[0]
                return f"https://instagram.com/{handle}"
        return None
    
    def _extract_facebook(self, vendor_data: Dict) -> Optional[str]:
        """Extract Facebook page from vendor data"""
        text = str(vendor_data)
        facebook_patterns = [
            r'facebook\.com/([a-zA-Z0-9_.]+)',
            r'fb\.com/([a-zA-Z0-9_.]+)'
        ]
        
        for pattern in facebook_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                handle = matches[0]
                return f"https://facebook.com/{handle}"
        return None
    
    def _extract_whatsapp(self, vendor_data: Dict) -> Optional[str]:
        """Extract WhatsApp contact from vendor data"""
        text = str(vendor_data)
        whatsapp_patterns = [
            r'wa\.me/(\d+)',
            r'whatsapp\.com/(\d+)',
            r'whatsapp.*?(\+?91\d{10})'
        ]
        
        for pattern in whatsapp_patterns:
            matches = re.findall(pattern, text)
            if matches:
                number = matches[0].replace('+', '')
                return f"https://wa.me/{number}"
        return None
    
    def _extract_handle(self, url: str, platform: str) -> str:
        """Extract handle from social media URL"""
        try:
            parsed = urlparse(url)
            path = parsed.path.strip('/')
            return path.split('/')[0] if path else ""
        except:
            return ""
    
    def _extract_whatsapp_number(self, whatsapp_url: str) -> str:
        """Extract phone number from WhatsApp URL"""
        match = re.search(r'wa\.me/(\d+)', whatsapp_url)
        return match.group(1) if match else ""
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number consistently"""
        phone = re.sub(r'\D', '', phone)
        if len(phone) == 10:
            phone = '91' + phone
        if not phone.startswith('+'):
            phone = '+' + phone
        return phone
    
    def _verify_email(self, email: str) -> bool:
        """Basic email validation"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _verify_phone(self, phone: str) -> bool:
        """Basic phone validation"""
        clean_phone = re.sub(r'\D', '', phone)
        return len(clean_phone) >= 10
    
    def _verify_website(self, website: str) -> bool:
        """Basic website validation"""
        try:
            result = urlparse(website)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def _calculate_contact_score(self, contact_info: Dict) -> int:
        """Calculate contact completeness score (0-100)"""
        score = 0
        
        # Contact details scoring
        if contact_info["contact_details"].get("email"):
            score += 25
        if contact_info["contact_details"].get("phone"):
            score += 25  
        if contact_info["contact_details"].get("website"):
            score += 20
            
        # Social media scoring
        if contact_info["social_media"].get("instagram"):
            score += 15
        if contact_info["social_media"].get("facebook"):
            score += 10
        if contact_info["social_media"].get("whatsapp"):
            score += 5
            
        return min(score, 100)
    
    def format_for_nocodb(self, vendor_data: Dict) -> Dict:
        """Format extracted contact info for NocoDB storage"""
        contact_info = self.extract_contact_info(vendor_data)
        
        return {
            "name": contact_info["vendor_name"],
            "category": contact_info["category"],
            "email": contact_info["contact_details"].get("email", {}).get("value", ""),
            "phone": contact_info["contact_details"].get("phone", {}).get("value", ""),
            "website": contact_info["contact_details"].get("website", {}).get("value", ""),
            "instagram": contact_info["social_media"].get("instagram", {}).get("value", ""),
            "facebook": contact_info["social_media"].get("facebook", {}).get("value", ""),
            "whatsapp": contact_info["social_media"].get("whatsapp", {}).get("value", ""),
            "contact_score": contact_info["contact_score"],
            "contact_details_json": contact_info["contact_details"],
            "social_media_json": contact_info["social_media"],
            "has_email": "email" in contact_info["contact_details"],
            "has_phone": "phone" in contact_info["contact_details"],
            "has_website": "website" in contact_info["contact_details"],
            "has_instagram": "instagram" in contact_info["social_media"],
            "has_whatsapp": "whatsapp" in contact_info["social_media"]
        }

# Example usage
if __name__ == "__main__":
    extractor = VendorContactExtractor()
    
    # Sample vendor data
    sample_vendors = [
        {
            "name": "Food Art / Creative Cuisine",
            "category": "catering",
            "socials": "@foodartcatering (Instagram), foodart.co.in",
            "description": "Contact: +91 98765 43210, info@foodart.co.in"
        },
        {
            "name": "WeddingNama / Ram Bherwani",
            "category": "photography", 
            "socials": "@weddingnama (Instagram), weddingnama.com",
            "phone": "91-98765-43210"
        }
    ]
    
    print("📱 VENDOR CONTACT EXTRACTOR")
    print("=" * 40)
    
    for vendor in sample_vendors:
        print(f"\n🏢 {vendor['name']}")
        contact_info = extractor.extract_contact_info(vendor)
        
        print(f"📊 Contact Score: {contact_info['contact_score']}/100")
        
        if contact_info["contact_details"]:
            print("📞 Contact Details:")
            for key, details in contact_info["contact_details"].items():
                print(f"   {details['icon']} {key.title()}: {details['value']}")
        
        if contact_info["social_media"]:
            print("🌐 Social Media:")
            for key, details in contact_info["social_media"].items():
                print(f"   {details['icon']} {key.title()}: {details['value']}")
