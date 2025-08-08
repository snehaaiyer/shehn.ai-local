
#!/usr/bin/env python3
"""
Enhanced NocoDB Vendor Storage
Stores vendors with standardized pricing and comprehensive contact information
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import requests
from config.nocodb_config import NOCODB_CONFIG
from standardized_vendor_pricing import VendorPricingCalculator
from enhanced_vendor_contact_extractor import VendorContactExtractor

logger = logging.getLogger(__name__)

class EnhancedNocoDBVendorStorage:
    """Enhanced vendor storage with pricing and contact standardization"""
    
    def __init__(self):
        self.base_url = NOCODB_CONFIG["BASE_URL"]
        self.auth_token = NOCODB_CONFIG["API_TOKEN"]
        self.vendors_table_id = NOCODB_CONFIG["TABLE_IDS"]["vendors"]
        
        self.headers = {
            'Content-Type': 'application/json',
            'xc-token': self.auth_token
        }
        
        # Initialize processors
        self.pricing_calculator = VendorPricingCalculator()
        self.contact_extractor = VendorContactExtractor()
        
        logger.info("✅ Enhanced NocoDB Vendor Storage initialized")
    
    def store_enhanced_vendor(self, vendor_data: Dict, location: str = "", 
                            search_query: str = "") -> Dict:
        """Store vendor with enhanced pricing and contact information"""
        try:
            # Extract and standardize contact information
            contact_info = self.contact_extractor.format_for_nocodb(vendor_data)
            
            # Calculate standardized pricing
            pricing_info = self.pricing_calculator.parse_vendor_pricing(vendor_data)
            
            # Prepare enhanced vendor record
            enhanced_vendor = {
                # Basic vendor information
                "name": vendor_data.get("name", ""),
                "category": vendor_data.get("category", ""),
                "location": location,
                "description": vendor_data.get("description", ""),
                "rating": float(vendor_data.get("rating", 0.0)),
                
                # Contact information with icons
                "email": contact_info["email"],
                "phone": contact_info["phone"], 
                "website": contact_info["website"],
                "instagram": contact_info["instagram"],
                "facebook": contact_info["facebook"],
                "whatsapp": contact_info["whatsapp"],
                
                # Contact validation flags
                "has_email": contact_info["has_email"],
                "has_phone": contact_info["has_phone"],
                "has_website": contact_info["has_website"],
                "has_instagram": contact_info["has_instagram"],
                "has_whatsapp": contact_info["has_whatsapp"],
                "contact_score": contact_info["contact_score"],
                
                # Standardized pricing
                "price_range": vendor_data.get("price_range", ""),
                "min_price": pricing_info["min_price"],
                "max_price": pricing_info["max_price"],
                "per_unit_price": pricing_info["per_unit_price"],
                "unit_type": pricing_info["unit_type"],
                "pricing_standardized": pricing_info["standardized"],
                
                # Additional vendor details
                "specialties": json.dumps(vendor_data.get("specialties", [])),
                "verified": vendor_data.get("verified", False),
                "source": vendor_data.get("source", "manual"),
                "primary_image": vendor_data.get("primary_image", ""),
                "images": json.dumps(vendor_data.get("images", [])),
                
                # Search and metadata
                "search_query": search_query,
                "match_score": vendor_data.get("match_score", 0.0),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                
                # JSON fields for complex data
                "contact_details_json": json.dumps(contact_info["contact_details_json"]),
                "social_media_json": json.dumps(contact_info["social_media_json"]),
                "pricing_breakdown_json": json.dumps(pricing_info)
            }
            
            # Store in NocoDB
            response = requests.post(
                f"{self.base_url}/api/v2/tables/{self.vendors_table_id}/records",
                headers=self.headers,
                json=enhanced_vendor
            )
            
            if response.status_code in (200, 201):
                result = response.json()
                logger.info(f"✅ Enhanced vendor stored: {enhanced_vendor['name']}")
                return {
                    "success": True,
                    "vendor_id": result.get("id"),
                    "vendor_name": enhanced_vendor["name"],
                    "contact_score": enhanced_vendor["contact_score"],
                    "pricing_standardized": True
                }
            else:
                logger.error(f"❌ Failed to store vendor: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error storing enhanced vendor: {e}")
            return {"success": False, "error": str(e)}
    
    def bulk_store_vendors(self, vendors: List[Dict], location: str = "", 
                          search_query: str = "") -> Dict:
        """Store multiple vendors with enhancements"""
        results = {
            "successful_stores": 0,
            "failed_stores": 0,
            "vendor_details": [],
            "errors": []
        }
        
        for vendor in vendors:
            try:
                result = self.store_enhanced_vendor(vendor, location, search_query)
                
                if result["success"]:
                    results["successful_stores"] += 1
                    results["vendor_details"].append({
                        "name": result["vendor_name"],
                        "contact_score": result["contact_score"],
                        "vendor_id": result["vendor_id"]
                    })
                else:
                    results["failed_stores"] += 1
                    results["errors"].append(result["error"])
                    
            except Exception as e:
                results["failed_stores"] += 1
                results["errors"].append(str(e))
                logger.error(f"❌ Error processing vendor: {e}")
        
        logger.info(f"📊 Bulk storage complete: {results['successful_stores']} success, {results['failed_stores']} failed")
        return results
    
    def get_enhanced_vendors(self, category: str = "", location: str = "", 
                           min_contact_score: int = 0) -> List[Dict]:
        """Get vendors with enhanced filtering options"""
        try:
            params = {"limit": 100}
            
            # Add filters
            where_conditions = []
            if category:
                where_conditions.append(f"(category,eq,{category})")
            if location:
                where_conditions.append(f"(location,like,%{location}%)")
            if min_contact_score > 0:
                where_conditions.append(f"(contact_score,gte,{min_contact_score})")
            
            if where_conditions:
                params["where"] = "~and(" + ",".join(where_conditions) + ")"
            
            response = requests.get(
                f"{self.base_url}/api/v2/tables/{self.vendors_table_id}/records",
                headers=self.headers,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                vendors = data.get("list", [])
                
                # Enhance vendor data for display
                enhanced_vendors = []
                for vendor in vendors:
                    enhanced_vendor = self._enhance_vendor_display(vendor)
                    enhanced_vendors.append(enhanced_vendor)
                
                logger.info(f"✅ Retrieved {len(enhanced_vendors)} enhanced vendors")
                return enhanced_vendors
            else:
                logger.error(f"❌ Failed to get vendors: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting enhanced vendors: {e}")
            return []
    
    def _enhance_vendor_display(self, vendor: Dict) -> Dict:
        """Enhance vendor data for display with icons and formatted pricing"""
        try:
            # Parse JSON fields
            contact_details = json.loads(vendor.get("contact_details_json", "{}"))
            social_media = json.loads(vendor.get("social_media_json", "{}"))
            pricing_breakdown = json.loads(vendor.get("pricing_breakdown_json", "{}"))
            
            # Create display-friendly format
            enhanced_vendor = {
                **vendor,
                "contact_display": self._format_contact_display(contact_details),
                "social_display": self._format_social_display(social_media),
                "pricing_display": self._format_pricing_display(pricing_breakdown, vendor),
                "contact_icons": {
                    "email": "✉️" if vendor.get("has_email") else "",
                    "phone": "📞" if vendor.get("has_phone") else "",
                    "website": "🌐" if vendor.get("has_website") else "",
                    "instagram": "📷" if vendor.get("has_instagram") else "",
                    "whatsapp": "📱" if vendor.get("has_whatsapp") else ""
                }
            }
            
            return enhanced_vendor
            
        except Exception as e:
            logger.error(f"❌ Error enhancing vendor display: {e}")
            return vendor
    
    def _format_contact_display(self, contact_details: Dict) -> str:
        """Format contact details for display"""
        display_parts = []
        
        for contact_type, details in contact_details.items():
            if isinstance(details, dict) and details.get("value"):
                icon = details.get("icon", "")
                value = details.get("value", "")
                display_parts.append(f"{icon} {value}")
        
        return " | ".join(display_parts)
    
    def _format_social_display(self, social_media: Dict) -> str:
        """Format social media for display"""
        display_parts = []
        
        for platform, details in social_media.items():
            if isinstance(details, dict) and details.get("value"):
                icon = details.get("icon", "")
                handle = details.get("handle", details.get("value", ""))
                display_parts.append(f"{icon} {handle}")
        
        return " | ".join(display_parts)
    
    def _format_pricing_display(self, pricing_breakdown: Dict, vendor: Dict) -> str:
        """Format pricing for display"""
        min_price = vendor.get("min_price", 0)
        max_price = vendor.get("max_price", 0)
        unit_type = vendor.get("unit_type", "")
        
        if min_price and max_price:
            return f"₹{min_price:,.0f} - ₹{max_price:,.0f}/{unit_type}"
        elif vendor.get("price_range"):
            return vendor.get("price_range", "")
        else:
            return "Price on request"
    
    def calculate_vendor_cost_estimate(self, vendor_id: str, guest_count: int,
                                     additional_services: List[str] = None) -> Dict:
        """Calculate cost estimate for a specific vendor"""
        try:
            # Get vendor details
            response = requests.get(
                f"{self.base_url}/api/v2/tables/{self.vendors_table_id}/records/{vendor_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                vendor = response.json()
                category = vendor.get("category", "")
                
                if category in self.pricing_calculator.pricing_standards:
                    cost_estimate = self.pricing_calculator.calculate_vendor_cost(
                        category, guest_count, additional_services
                    )
                    
                    return {
                        "success": True,
                        "vendor_name": vendor.get("name", ""),
                        "category": category,
                        "guest_count": guest_count,
                        "cost_estimate": cost_estimate,
                        "additional_services": additional_services or []
                    }
                else:
                    return {"success": False, "error": "Unknown vendor category"}
            else:
                return {"success": False, "error": "Vendor not found"}
                
        except Exception as e:
            logger.error(f"❌ Error calculating vendor cost: {e}")
            return {"success": False, "error": str(e)}

# Example usage
if __name__ == "__main__":
    storage = EnhancedNocoDBVendorStorage()
    
    # Example vendor data from user's message
    sample_vendors = [
        {
            "name": "Food Art / Creative Cuisine",
            "category": "catering",
            "price_range": "₹900–₹2,500/plate",
            "description": "Indian, Continental, Fusion; menu customization available",
            "rating": 4.7,
            "socials": "@foodartcatering (Instagram), foodart.co.in",
            "source": "manual_entry"
        },
        {
            "name": "WeddingNama / Ram Bherwani",
            "category": "photography", 
            "price_range": "₹70,000–₹3,00,000/package",
            "description": "Candid, documentary, traditional; sample albums and portfolios available",
            "rating": 4.8,
            "socials": "@weddingnama (Instagram), weddingnama.com",
            "source": "manual_entry"
        },
        {
            "name": "ITC Grand Bharat / The Leela",
            "category": "venues",
            "price_range": "₹3,00,000–₹25,00,000/day", 
            "description": "Luxury, heritage, outdoor garden; flexible décor themes available",
            "rating": 4.5,
            "socials": "theleela.com, @itcgrandbharat (Instagram)",
            "source": "manual_entry"
        }
    ]
    
    print("🏪 ENHANCED VENDOR STORAGE TEST")
    print("=" * 40)
    
    # Store sample vendors
    result = storage.bulk_store_vendors(sample_vendors, "Delhi", "premium wedding vendors")
    
    print(f"✅ Stored {result['successful_stores']} vendors")
    print(f"❌ Failed {result['failed_stores']} vendors")
    
    # Get enhanced vendors
    vendors = storage.get_enhanced_vendors(min_contact_score=50)
    
    print(f"\n📋 Retrieved {len(vendors)} vendors with contact score ≥ 50")
    for vendor in vendors[:3]:  # Show first 3
        print(f"\n🏢 {vendor['name']}")
        print(f"   📊 Contact Score: {vendor['contact_score']}/100")
        print(f"   📞 Contact: {vendor.get('contact_display', 'N/A')}")
        print(f"   🌐 Social: {vendor.get('social_display', 'N/A')}")
        print(f"   💰 Pricing: {vendor.get('pricing_display', 'N/A')}")
