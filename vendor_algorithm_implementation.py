#!/usr/bin/env python3
"""
Intelligent Vendor Selection Algorithm
Implements proper business logic for wedding vendor recommendations
"""

import re
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class WeddingDetails:
    """Wedding requirements and constraints"""
    total_budget: str           # "₹20-30 Lakhs"
    guest_count: int           # 300
    location: str              # "Mumbai"
    wedding_date: Optional[str] # "2024-12-15"
    style: str                 # "Traditional"
    priorities: List[str]      # ["venue", "catering"]

class VendorSelectionEngine:
    """
    Intelligent vendor selection with proper business logic
    """
    
    # Budget allocation percentages by budget range
    BUDGET_ALLOCATIONS = {
        'Under ₹10 Lakhs': {
            'venues': 0.40, 'catering': 0.30, 'photography': 0.10,
            'decoration': 0.10, 'makeup': 0.05, 'miscellaneous': 0.05
        },
        '₹10-20 Lakhs': {
            'venues': 0.38, 'catering': 0.28, 'photography': 0.12,
            'decoration': 0.12, 'makeup': 0.06, 'miscellaneous': 0.04
        },
        '₹20-30 Lakhs': {
            'venues': 0.35, 'catering': 0.25, 'photography': 0.15,
            'decoration': 0.12, 'makeup': 0.08, 'miscellaneous': 0.05
        },
        '₹30-50 Lakhs': {
            'venues': 0.32, 'catering': 0.25, 'photography': 0.18,
            'decoration': 0.15, 'makeup': 0.07, 'miscellaneous': 0.03
        },
        'Above ₹50 Lakhs': {
            'venues': 0.30, 'catering': 0.25, 'photography': 0.20,
            'decoration': 0.15, 'makeup': 0.07, 'miscellaneous': 0.03
        }
    }
    
    # Scoring weights for different factors
    SCORING_WEIGHTS = {
        'budget_compatibility': 0.30,
        'capacity_match': 0.20,
        'location_proximity': 0.15,
        'style_alignment': 0.15,
        'rating_quality': 0.10,
        'availability': 0.10
    }
    
    def parse_budget_range(self, budget_str: str) -> Dict[str, int]:
        """Parse budget string to numeric values"""
        try:
            # Handle ranges like "₹20-30 Lakhs"
            match = re.search(r'₹(\d+)-(\d+)\s*Lakhs?', budget_str, re.IGNORECASE)
            if match:
                min_lakhs = int(match.group(1))
                max_lakhs = int(match.group(2))
                return {
                    'min': min_lakhs * 100000,
                    'max': max_lakhs * 100000,
                    'avg': (min_lakhs + max_lakhs) / 2 * 100000
                }
            
            # Handle single values like "Above ₹50 Lakhs"
            match = re.search(r'Above\s*₹(\d+)\s*Lakhs?', budget_str, re.IGNORECASE)
            if match:
                min_lakhs = int(match.group(1))
                return {
                    'min': min_lakhs * 100000,
                    'max': min_lakhs * 200000,  # Assume 2x for "above"
                    'avg': min_lakhs * 150000   # 1.5x for calculations
                }
            
            # Handle "Under ₹X Lakhs"
            match = re.search(r'Under\s*₹(\d+)\s*Lakhs?', budget_str, re.IGNORECASE)
            if match:
                max_lakhs = int(match.group(1))
                return {
                    'min': max_lakhs * 50000,   # Assume 0.5x for "under"
                    'max': max_lakhs * 100000,
                    'avg': max_lakhs * 75000    # 0.75x for calculations
                }
            
        except Exception as e:
            print(f"Error parsing budget: {e}")
        
        # Fallback: assume mid-range
        return {'min': 2000000, 'max': 3000000, 'avg': 2500000}
    
    def parse_vendor_price(self, price_str: str) -> Dict[str, int]:
        """Parse vendor price string to numeric values"""
        try:
            # Handle ranges like "₹2,00,000 - ₹5,00,000"
            match = re.search(r'₹([\d,]+)\s*-\s*₹([\d,]+)', price_str)
            if match:
                min_price = int(match.group(1).replace(',', ''))
                max_price = int(match.group(2).replace(',', ''))
                return {
                    'min': min_price,
                    'max': max_price,
                    'avg': (min_price + max_price) / 2
                }
            
            # Handle per-person pricing like "₹800 - ₹2,500 per person"
            match = re.search(r'₹([\d,]+)\s*-\s*₹([\d,]+)\s*per\s*person', price_str, re.IGNORECASE)
            if match:
                min_per_person = int(match.group(1).replace(',', ''))
                max_per_person = int(match.group(2).replace(',', ''))
                return {
                    'min_per_person': min_per_person,
                    'max_per_person': max_per_person,
                    'avg_per_person': (min_per_person + max_per_person) / 2
                }
                
        except Exception as e:
            print(f"Error parsing vendor price: {e}")
        
        # Fallback
        return {'min': 100000, 'max': 500000, 'avg': 300000}
    
    def parse_capacity(self, capacity_str: str) -> Dict[str, int]:
        """Parse capacity string to numeric values"""
        try:
            # Handle ranges like "500-1000 guests"
            match = re.search(r'(\d+)-(\d+)\s*guests?', capacity_str, re.IGNORECASE)
            if match:
                min_capacity = int(match.group(1))
                max_capacity = int(match.group(2))
                return {'min': min_capacity, 'max': max_capacity}
                
        except Exception as e:
            print(f"Error parsing capacity: {e}")
        
        # Fallback: assume flexible capacity
        return {'min': 50, 'max': 1000}
    
    def calculate_category_budget(self, wedding_details: WeddingDetails, category: str) -> int:
        """Calculate allocated budget for a specific vendor category"""
        
        budget_info = self.parse_budget_range(wedding_details.total_budget)
        total_budget = budget_info['avg']
        
        # Get allocation percentage for this budget range and category
        allocation_data = self.BUDGET_ALLOCATIONS.get(
            wedding_details.total_budget, 
            self.BUDGET_ALLOCATIONS['₹20-30 Lakhs']  # Default fallback
        )
        
        category_percentage = allocation_data.get(category, 0.15)  # 15% default
        allocated_budget = total_budget * category_percentage
        
        return int(allocated_budget)
    
    def calculate_budget_compatibility(self, vendor: Dict, wedding_details: WeddingDetails) -> float:
        """Calculate budget compatibility score (0-100)"""
        
        allocated_budget = self.calculate_category_budget(wedding_details, vendor['category'])
        vendor_price = self.parse_vendor_price(vendor.get('price', ''))
        
        # Handle per-person pricing (catering)
        if 'avg_per_person' in vendor_price:
            vendor_cost = vendor_price['avg_per_person'] * wedding_details.guest_count
        else:
            vendor_cost = vendor_price['avg']
        
        # Calculate budget fit score
        price_ratio = vendor_cost / allocated_budget
        
        if price_ratio <= 0.8:         # 20% under budget
            return 100
        elif price_ratio <= 0.9:       # 10% under budget
            return 95
        elif price_ratio <= 1.0:       # At budget
            return 90
        elif price_ratio <= 1.1:       # 10% over budget
            return 75
        elif price_ratio <= 1.2:       # 20% over budget
            return 60
        elif price_ratio <= 1.3:       # 30% over budget
            return 40
        else:                          # More than 30% over budget
            return max(10, 100 - (price_ratio - 1.3) * 100)
    
    def calculate_capacity_match(self, vendor: Dict, wedding_details: WeddingDetails) -> float:
        """Calculate capacity match score (0-100)"""
        
        if 'capacity' not in vendor:
            return 70  # Unknown capacity, assume moderate fit
        
        capacity_info = self.parse_capacity(vendor['capacity'])
        guest_count = wedding_details.guest_count
        
        if capacity_info['min'] <= guest_count <= capacity_info['max']:
            return 100  # Perfect fit
        elif guest_count < capacity_info['min']:
            # Under-capacity (may be expensive per guest)
            under_ratio = guest_count / capacity_info['min']
            return max(50, under_ratio * 90)
        else:
            # Over-capacity (vendor can't handle)
            return 0
    
    def calculate_location_proximity(self, vendor: Dict, wedding_details: WeddingDetails) -> float:
        """Calculate location proximity score (0-100)"""
        
        vendor_location = vendor.get('location', '').lower()
        wedding_location = wedding_details.location.lower()
        
        if vendor_location == wedding_location:
            return 100  # Same city
        elif self.is_nearby_city(vendor_location, wedding_location):
            return 80   # Nearby cities
        elif self.is_same_state(vendor_location, wedding_location):
            return 60   # Same state
        else:
            return 30   # Different state
    
    def is_nearby_city(self, city1: str, city2: str) -> bool:
        """Check if cities are nearby (simplified logic)"""
        nearby_pairs = [
            ('mumbai', 'pune'), ('delhi', 'gurgaon'), ('delhi', 'noida'),
            ('bangalore', 'mysore'), ('chennai', 'pondicherry')
        ]
        
        for pair in nearby_pairs:
            if (city1 in pair[0] and city2 in pair[1]) or (city1 in pair[1] and city2 in pair[0]):
                return True
        return False
    
    def is_same_state(self, city1: str, city2: str) -> bool:
        """Check if cities are in the same state (simplified logic)"""
        state_cities = {
            'maharashtra': ['mumbai', 'pune', 'nagpur'],
            'delhi': ['delhi', 'gurgaon', 'noida'],
            'karnataka': ['bangalore', 'mysore'],
            'tamil_nadu': ['chennai', 'coimbatore']
        }
        
        for state, cities in state_cities.items():
            if city1 in cities and city2 in cities:
                return True
        return False
    
    def calculate_style_alignment(self, vendor: Dict, wedding_details: WeddingDetails) -> float:
        """Calculate style alignment score (0-100)"""
        
        vendor_specialty = vendor.get('specialty', '').lower()
        vendor_type = vendor.get('type', '').lower()
        wedding_style = wedding_details.style.lower()
        
        # Style matching logic
        style_matches = {
            'traditional': ['traditional', 'heritage', 'royal', 'classic'],
            'modern': ['modern', 'contemporary', 'premium', 'luxury'],
            'fusion': ['fusion', 'modern', 'contemporary'],
            'royal': ['royal', 'heritage', 'luxury', 'premium']
        }
        
        matching_keywords = style_matches.get(wedding_style, [wedding_style])
        
        score = 50  # Base score
        
        # Check specialty alignment
        for keyword in matching_keywords:
            if keyword in vendor_specialty:
                score += 25
                break
        
        # Check type alignment
        for keyword in matching_keywords:
            if keyword in vendor_type:
                score += 25
                break
        
        return min(100, score)
    
    def calculate_rating_quality(self, vendor: Dict) -> float:
        """Calculate rating quality score (0-100)"""
        
        rating = vendor.get('rating', 4.0)
        return (rating / 5.0) * 100
    
    def calculate_availability_score(self, vendor: Dict, wedding_details: WeddingDetails) -> float:
        """Calculate availability score (0-100)"""
        
        # For now, assume all vendors are available
        # In production, this would check actual availability
        return 90
    
    def calculate_comprehensive_score(self, vendor: Dict, wedding_details: WeddingDetails) -> Dict[str, Any]:
        """Calculate comprehensive vendor score with breakdown"""
        
        scores = {}
        
        # Calculate individual scores
        scores['budget_compatibility'] = self.calculate_budget_compatibility(vendor, wedding_details)
        scores['capacity_match'] = self.calculate_capacity_match(vendor, wedding_details)
        scores['location_proximity'] = self.calculate_location_proximity(vendor, wedding_details)
        scores['style_alignment'] = self.calculate_style_alignment(vendor, wedding_details)
        scores['rating_quality'] = self.calculate_rating_quality(vendor)
        scores['availability'] = self.calculate_availability_score(vendor, wedding_details)
        
        # Calculate weighted overall score
        overall_score = 0
        for factor, score in scores.items():
            weight = self.SCORING_WEIGHTS.get(factor, 0)
            overall_score += score * weight
        
        # Generate recommendation reasons
        reasons = []
        if scores['budget_compatibility'] >= 80:
            reasons.append(f"Fits well within your {vendor['category']} budget")
        if scores['capacity_match'] >= 90:
            reasons.append(f"Perfect capacity for {wedding_details.guest_count} guests")
        if scores['location_proximity'] >= 80:
            reasons.append(f"Located in {wedding_details.location}")
        if scores['style_alignment'] >= 70:
            reasons.append(f"Specializes in {wedding_details.style} style")
        if scores['rating_quality'] >= 85:
            reasons.append(f"Highly rated ({vendor.get('rating', 'N/A')}/5)")
        
        # Generate warnings
        warnings = []
        if scores['budget_compatibility'] < 50:
            warnings.append("May exceed your allocated budget")
        if scores['capacity_match'] < 60:
            warnings.append("Capacity may not be ideal for your guest count")
        if scores['location_proximity'] < 40:
            warnings.append("Located far from wedding venue")
        
        # Determine recommendation tier
        if overall_score >= 85:
            tier = "PERFECT_MATCH"
            tier_description = "Top recommendation"
        elif overall_score >= 70:
            tier = "GREAT_MATCH"
            tier_description = "Highly recommended"
        elif overall_score >= 55:
            tier = "GOOD_MATCH"
            tier_description = "Recommended"
        elif overall_score >= 40:
            tier = "FAIR_MATCH"
            tier_description = "Consider if others unavailable"
        else:
            tier = "POOR_MATCH"
            tier_description = "Not recommended"
        
        return {
            'overall_score': round(overall_score, 1),
            'scores_breakdown': scores,
            'recommendation_tier': tier,
            'tier_description': tier_description,
            'reasons': reasons,
            'warnings': warnings,
            'allocated_budget': self.calculate_category_budget(wedding_details, vendor['category'])
        }
    
    def filter_and_rank_vendors(self, vendors: List[Dict], wedding_details: WeddingDetails) -> List[Dict]:
        """Main function to filter and rank vendors"""
        
        enhanced_vendors = []
        
        for vendor in vendors:
            # Calculate comprehensive score
            scoring_result = self.calculate_comprehensive_score(vendor, wedding_details)
            
            # Enhance vendor with scoring information
            enhanced_vendor = {
                **vendor,
                **scoring_result
            }
            
            enhanced_vendors.append(enhanced_vendor)
        
        # Sort by overall score (highest first)
        enhanced_vendors.sort(key=lambda x: x['overall_score'], reverse=True)
        
        return enhanced_vendors

# Example usage and testing
if __name__ == "__main__":
    # Sample vendor data
    sample_vendors = [
        {
            'id': 1,
            'name': 'Royal Garden Palace',
            'description': 'Luxury banquet hall with beautiful gardens',
            'location': 'Mumbai',
            'rating': 4.8,
            'price': '₹2,00,000 - ₹5,00,000',
            'capacity': '500-1000 guests',
            'type': 'premium',
            'specialty': 'heritage luxury',
            'category': 'venues'
        },
        {
            'id': 2,
            'name': 'Heritage Haveli',
            'description': 'Traditional Rajasthani architecture',
            'location': 'Delhi',
            'rating': 4.6,
            'price': '₹1,50,000 - ₹3,00,000',
            'capacity': '200-500 guests',
            'type': 'mid',
            'specialty': 'traditional heritage',
            'category': 'venues'
        }
    ]
    
    # Sample wedding details
    wedding_details = WeddingDetails(
        total_budget="₹20-30 Lakhs",
        guest_count=400,
        location="Mumbai",
        wedding_date="2024-12-15",
        style="Traditional",
        priorities=["venue", "catering"]
    )
    
    # Run algorithm
    engine = VendorSelectionEngine()
    ranked_vendors = engine.filter_and_rank_vendors(sample_vendors, wedding_details)
    
    # Display results
    print("🎯 VENDOR RECOMMENDATIONS")
    print("=" * 50)
    
    for vendor in ranked_vendors:
        print(f"\n📍 {vendor['name']} ({vendor['location']})")
        print(f"   Overall Score: {vendor['overall_score']}/100")
        print(f"   Tier: {vendor['recommendation_tier']} - {vendor['tier_description']}")
        print(f"   Price: {vendor['price']}")
        print(f"   Allocated Budget: ₹{vendor['allocated_budget']:,}")
        
        if vendor['reasons']:
            print(f"   ✅ Reasons: {', '.join(vendor['reasons'])}")
        
        if vendor['warnings']:
            print(f"   ⚠️  Warnings: {', '.join(vendor['warnings'])}")
        
        print(f"   📊 Score Breakdown:")
        for factor, score in vendor['scores_breakdown'].items():
            print(f"      {factor}: {score:.1f}/100") 