
#!/usr/bin/env python3
"""
Standardized Vendor Pricing Calculator
Normalizes pricing across different vendor categories with per-unit calculations
"""

import json
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class VendorCategory(Enum):
    CATERING = "catering"
    PHOTOGRAPHY = "photography"
    VENUES = "venues" 
    PLANNING = "planning"
    DECOR = "decor"
    MUSIC = "music"
    TRANSPORT = "transport"

@dataclass
class StandardizedPricing:
    """Standardized pricing structure for all vendor categories"""
    category: str
    base_price: float
    per_unit_price: float
    unit_type: str  # "plate", "person", "hour", "package", "day"
    min_quantity: int
    max_quantity: int
    price_range_low: float
    price_range_high: float
    currency: str = "INR"
    
    def calculate_total_cost(self, quantity: int, additional_services: List[str] = None) -> Dict:
        """Calculate total cost based on quantity and additional services"""
        if quantity < self.min_quantity:
            quantity = self.min_quantity
        elif quantity > self.max_quantity:
            quantity = self.max_quantity
            
        base_cost = self.per_unit_price * quantity
        
        # Add additional service costs if any
        additional_cost = 0
        if additional_services:
            additional_cost = self._calculate_additional_services(additional_services, quantity)
        
        total_cost = base_cost + additional_cost
        
        return {
            "base_cost": base_cost,
            "additional_cost": additional_cost,
            "total_cost": total_cost,
            "quantity": quantity,
            "per_unit_price": self.per_unit_price,
            "currency": self.currency,
            "breakdown": {
                "base": f"{self.currency} {base_cost:,.2f}",
                "additional": f"{self.currency} {additional_cost:,.2f}",
                "total": f"{self.currency} {total_cost:,.2f}"
            }
        }
    
    def _calculate_additional_services(self, services: List[str], quantity: int) -> float:
        """Calculate cost for additional services"""
        service_rates = {
            "live_counters": 150,  # per person
            "drone_coverage": 25000,  # flat rate
            "extra_photographer": 15000,  # per day
            "decoration_upgrade": 200,  # per person
            "valet_parking": 100,  # per person
            "bridal_suite": 10000,  # flat rate
            "sound_system": 15000,  # flat rate
            "transportation": 5000,  # per vehicle
        }
        
        total_additional = 0
        for service in services:
            if service in service_rates:
                if service in ["drone_coverage", "extra_photographer", "bridal_suite", "sound_system"]:
                    total_additional += service_rates[service]
                else:
                    total_additional += service_rates[service] * quantity
        
        return total_additional

class VendorPricingCalculator:
    """Calculator for standardized vendor pricing across categories"""
    
    def __init__(self):
        self.pricing_standards = self._initialize_pricing_standards()
    
    def _initialize_pricing_standards(self) -> Dict[str, StandardizedPricing]:
        """Initialize standardized pricing for each vendor category"""
        return {
            "catering": StandardizedPricing(
                category="catering",
                base_price=50000,
                per_unit_price=1200,  # per plate
                unit_type="plate",
                min_quantity=50,
                max_quantity=2000,
                price_range_low=900,
                price_range_high=2500
            ),
            "photography": StandardizedPricing(
                category="photography",
                base_price=70000,
                per_unit_price=150,  # per person coverage
                unit_type="person",
                min_quantity=100,
                max_quantity=1000,
                price_range_low=70000,
                price_range_high=300000
            ),
            "venues": StandardizedPricing(
                category="venues",
                base_price=300000,
                per_unit_price=200,  # per person capacity
                unit_type="person",
                min_quantity=100,
                max_quantity=2000,
                price_range_low=300000,
                price_range_high=2500000
            ),
            "planning": StandardizedPricing(
                category="planning",
                base_price=300000,
                per_unit_price=500,  # per person managed
                unit_type="person",
                min_quantity=100,
                max_quantity=1500,
                price_range_low=300000,
                price_range_high=2000000
            ),
            "decor": StandardizedPricing(
                category="decor",
                base_price=100000,
                per_unit_price=300,  # per person
                unit_type="person",
                min_quantity=50,
                max_quantity=1000,
                price_range_low=100000,
                price_range_high=800000
            ),
            "music": StandardizedPricing(
                category="music",
                base_price=50000,
                per_unit_price=100,  # per person
                unit_type="person",
                min_quantity=50,
                max_quantity=1000,
                price_range_low=50000,
                price_range_high=500000
            ),
            "transport": StandardizedPricing(
                category="transport",
                base_price=15000,
                per_unit_price=75,  # per person
                unit_type="person",
                min_quantity=10,
                max_quantity=200,
                price_range_low=15000,
                price_range_high=100000
            )
        }
    
    def calculate_vendor_cost(self, category: str, guest_count: int, 
                            additional_services: List[str] = None) -> Dict:
        """Calculate standardized cost for a vendor category"""
        if category not in self.pricing_standards:
            raise ValueError(f"Unknown vendor category: {category}")
        
        pricing = self.pricing_standards[category]
        return pricing.calculate_total_cost(guest_count, additional_services)
    
    def get_price_comparison(self, categories: List[str], guest_count: int) -> Dict:
        """Get price comparison across multiple vendor categories"""
        comparison = {}
        total_cost = 0
        
        for category in categories:
            if category in self.pricing_standards:
                cost_breakdown = self.calculate_vendor_cost(category, guest_count)
                comparison[category] = cost_breakdown
                total_cost += cost_breakdown["total_cost"]
        
        comparison["total_wedding_cost"] = {
            "amount": total_cost,
            "formatted": f"INR {total_cost:,.2f}",
            "per_person": total_cost / guest_count if guest_count > 0 else 0
        }
        
        return comparison
    
    def parse_vendor_pricing(self, vendor_data: Dict) -> Dict:
        """Parse and standardize vendor pricing from raw data"""
        category = vendor_data.get("category", "").lower()
        pricing_text = vendor_data.get("price_range", "")
        
        # Extract price range using regex
        price_match = re.findall(r'₹([\d,]+)', pricing_text)
        if price_match:
            prices = [int(p.replace(',', '')) for p in price_match]
            min_price = min(prices)
            max_price = max(prices)
        else:
            min_price = 0
            max_price = 0
        
        # Get standardized pricing for category
        if category in self.pricing_standards:
            standard = self.pricing_standards[category]
            per_unit = (min_price + max_price) / 2 if max_price > 0 else standard.per_unit_price
        else:
            per_unit = 1000  # default
        
        return {
            "category": category,
            "original_pricing": pricing_text,
            "min_price": min_price,
            "max_price": max_price,
            "per_unit_price": per_unit,
            "unit_type": self.pricing_standards.get(category, StandardizedPricing("default", 0, 1000, "unit", 1, 1000, 0, 0)).unit_type,
            "standardized": True
        }

# Example usage and testing
if __name__ == "__main__":
    calculator = VendorPricingCalculator()
    
    # Example vendor data
    sample_vendors = [
        {
            "name": "Food Art / Creative Cuisine",
            "category": "catering",
            "price_range": "₹900–₹2,500/plate"
        },
        {
            "name": "WeddingNama / Ram Bherwani", 
            "category": "photography",
            "price_range": "₹70,000–₹3,00,000/package"
        },
        {
            "name": "ITC Grand Bharat / The Leela",
            "category": "venues",
            "price_range": "₹3,00,000–₹25,00,000/day"
        }
    ]
    
    print("🧮 STANDARDIZED VENDOR PRICING CALCULATOR")
    print("=" * 50)
    
    guest_count = 300
    print(f"\n👥 Guest Count: {guest_count}")
    
    # Calculate individual vendor costs
    for vendor in sample_vendors:
        print(f"\n📊 {vendor['name']} ({vendor['category'].title()})")
        cost = calculator.calculate_vendor_cost(vendor['category'], guest_count)
        print(f"   Per Unit: ₹{cost['per_unit_price']:,.2f}")
        print(f"   Total Cost: {cost['breakdown']['total']}")
    
    # Get overall comparison
    categories = ["catering", "photography", "venues", "planning", "decor"]
    comparison = calculator.get_price_comparison(categories, guest_count)
    
    print(f"\n💰 TOTAL WEDDING COST BREAKDOWN")
    print("-" * 30)
    for category, cost in comparison.items():
        if category != "total_wedding_cost":
            print(f"{category.title()}: {cost['breakdown']['total']}")
    
    print(f"\nTotal: {comparison['total_wedding_cost']['formatted']}")
    print(f"Per Person: ₹{comparison['total_wedding_cost']['per_person']:,.2f}")
