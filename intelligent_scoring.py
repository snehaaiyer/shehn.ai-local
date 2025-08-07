import json
import math
from typing import Dict, Any, List

class IntelligentScoringEngine:
    """
    AI-powered scoring engine for wedding vendor recommendations
    """
    
    def __init__(self):
        # Scoring weights for different factors
        self.weights = {
            'budget_compatibility': 0.25,    # 25% - Can they afford this vendor?
            'capacity_match': 0.20,          # 20% - Can vendor handle guest count?
            'location_proximity': 0.15,      # 15% - How close to wedding location?
            'style_alignment': 0.15,         # 15% - Does style match wedding theme?
            'availability': 0.10,            # 10% - Available on wedding date?
            'rating_quality': 0.10,          # 10% - Vendor's rating/reviews
            'experience_level': 0.05         # 5%  - Years of experience
        }
    
    def calculate_vendor_score(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive match score for a vendor
        
        Returns:
        {
            'overall_score': 85,
            'breakdown': {...},
            'recommendation_reasons': [...],
            'risk_factors': [...]
        }
        """
        
        scores = {}
        reasons = []
        risks = []
        
        # 1. Budget Compatibility Score (0-100)
        scores['budget_compatibility'] = self._score_budget_compatibility(vendor, wedding_details)
        if scores['budget_compatibility'] > 80:
            reasons.append(f"Excellent budget fit for {wedding_details.get('budget', 'your budget')}")
        elif scores['budget_compatibility'] < 50:
            risks.append("May exceed budget expectations")
        
        # 2. Capacity Match Score (0-100)
        scores['capacity_match'] = self._score_capacity_match(vendor, wedding_details)
        if scores['capacity_match'] > 90:
            reasons.append(f"Perfect capacity for {wedding_details.get('guest_count', 'your')} guests")
        elif scores['capacity_match'] < 60:
            risks.append("Capacity concerns for guest count")
        
        # 3. Location Proximity Score (0-100)
        scores['location_proximity'] = self._score_location_proximity(vendor, wedding_details)
        if scores['location_proximity'] > 85:
            reasons.append(f"Located in {wedding_details.get('location', 'your area')}")
        elif scores['location_proximity'] < 40:
            risks.append("Distance may increase costs and logistics complexity")
        
        # 4. Style Alignment Score (0-100)
        scores['style_alignment'] = self._score_style_alignment(vendor, wedding_details)
        if scores['style_alignment'] > 80:
            reasons.append(f"Specializes in {wedding_details.get('theme', 'your')} style weddings")
        
        # 5. Availability Score (0-100)
        scores['availability'] = self._score_availability(vendor, wedding_details)
        if scores['availability'] < 70:
            risks.append("Limited availability during peak season")
        
        # 6. Rating Quality Score (0-100)
        scores['rating_quality'] = self._score_rating_quality(vendor)
        if scores['rating_quality'] > 85:
            reasons.append(f"Highly rated ({vendor.get('rating', 'N/A')}/5.0 stars)")
        
        # 7. Experience Level Score (0-100)
        scores['experience_level'] = self._score_experience_level(vendor)
        if scores['experience_level'] > 80:
            reasons.append(f"{vendor.get('years_experience', 'Many')} years of experience")
        
        # Calculate weighted overall score
        overall_score = sum(
            scores[factor] * self.weights[factor] 
            for factor in self.weights.keys()
        )
        
        return {
            'overall_score': round(overall_score, 1),
            'breakdown': scores,
            'recommendation_reasons': reasons,
            'risk_factors': risks,
            'confidence_level': self._calculate_confidence(scores)
        }
    
    def _score_budget_compatibility(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> float:
        """Score how well vendor fits the budget (0-100)"""
        
        # Extract budget amount
        budget_str = wedding_details.get('budget', '$40,000')
        budget_amount = int(budget_str.replace('$', '').replace(',', ''))
        
        # Get vendor price range
        price_range = vendor.get('price_range', 'Medium').lower()
        
        # Estimate vendor cost based on price range and category
        category = vendor.get('category', '').lower()
        guest_count = int(wedding_details.get('guest_count', '100'))
        
        if category == 'venue':
            base_cost = budget_amount * 0.4  # Venues typically 40% of budget
        elif category == 'photography':
            base_cost = budget_amount * 0.15  # Photography ~15%
        elif category == 'decoration':
            base_cost = budget_amount * 0.15  # Decoration ~15%
        else:
            base_cost = budget_amount * 0.1   # Other services ~10%
        
        # Adjust by price range
        multipliers = {'low': 0.7, 'medium': 1.0, 'high': 1.4, 'premium': 1.8}
        estimated_cost = base_cost * multipliers.get(price_range, 1.0)
        
        # Score based on how well it fits budget
        if estimated_cost <= base_cost * 0.9:
            return 100  # Under budget
        elif estimated_cost <= base_cost * 1.1:
            return 85   # Within 10%
        elif estimated_cost <= base_cost * 1.3:
            return 60   # Within 30%
        else:
            return 30   # Over budget
    
    def _score_capacity_match(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> float:
        """Score how well vendor capacity matches guest count (0-100)"""
        
        guest_count = int(wedding_details.get('guest_count', '100'))
        vendor_capacity = vendor.get('capacity')
        
        if not vendor_capacity or vendor_capacity == 'Multiple events':
            return 85  # Assume flexible capacity
        
        try:
            # Extract number from capacity string
            if isinstance(vendor_capacity, str):
                capacity_num = int(''.join(filter(str.isdigit, vendor_capacity)))
            else:
                capacity_num = int(vendor_capacity)
            
            # Perfect match range: 100-120% of guest count
            ideal_min = guest_count
            ideal_max = guest_count * 1.2
            
            if ideal_min <= capacity_num <= ideal_max:
                return 100
            elif capacity_num >= guest_count * 0.8:
                return 80
            elif capacity_num >= guest_count * 0.6:
                return 60
            else:
                return 30
                
        except (ValueError, TypeError):
            return 70  # Default if capacity unclear
    
    def _score_location_proximity(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> float:
        """Score location match (0-100)"""
        
        wedding_location = wedding_details.get('location', '').lower()
        vendor_location = vendor.get('location', '').lower()
        
        if wedding_location in vendor_location or vendor_location in wedding_location:
            return 100  # Same city/area
        
        # Simple distance approximation based on major cities
        city_distances = {
            ('mumbai', 'pune'): 80,
            ('mumbai', 'bangalore'): 40,
            ('delhi', 'gurgaon'): 90,
            ('bangalore', 'mysore'): 75,
        }
        
        # Check for known city pairs
        for (city1, city2), score in city_distances.items():
            if (city1 in wedding_location and city2 in vendor_location) or \
               (city2 in wedding_location and city1 in vendor_location):
                return score
        
        return 50  # Default for unknown distance
    
    def _score_style_alignment(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> float:
        """Score style/theme compatibility (0-100)"""
        
        wedding_theme = wedding_details.get('theme', '').lower()
        wedding_style = wedding_details.get('wedding_style', '').lower()
        
        vendor_specialties = vendor.get('specialties', [])
        vendor_category = vendor.get('category', '').lower()
        
        # Theme matching
        theme_matches = {
            'modern_minimalist': ['modern', 'minimalist', 'contemporary', 'sleek'],
            'garden_romance': ['romantic', 'garden', 'outdoor', 'floral', 'vintage'],
            'vintage_elegance': ['vintage', 'elegant', 'classic', 'traditional']
        }
        
        score = 60  # Base score
        
        # Check theme alignment
        if wedding_theme in theme_matches:
            for specialty in vendor_specialties:
                if any(keyword in specialty.lower() for keyword in theme_matches[wedding_theme]):
                    score += 20
                    break
        
        # Category-specific bonuses
        if vendor_category == 'photography' and 'modern' in wedding_style:
            score += 10
        elif vendor_category == 'decoration' and 'garden' in wedding_theme:
            score += 15
        
        return min(score, 100)
    
    def _score_availability(self, vendor: Dict[str, Any], wedding_details: Dict[str, Any]) -> float:
        """Score availability (0-100)"""
        
        # Get wedding date and season
        wedding_date = wedding_details.get('date', '')
        season = wedding_details.get('season', '').lower()
        
        # Peak season penalties
        peak_seasons = ['spring', 'fall', 'winter']
        if any(peak in season for peak in peak_seasons):
            base_score = 70  # Peak season
        else:
            base_score = 90  # Off-peak
        
        # Vendor availability status
        availability_status = vendor.get('availability_status', 'Available').lower()
        
        if 'available' in availability_status:
            return base_score
        elif 'limited' in availability_status:
            return base_score - 20
        else:
            return 40
    
    def _score_rating_quality(self, vendor: Dict[str, Any]) -> float:
        """Score based on ratings and reviews (0-100)"""
        
        rating = vendor.get('rating', 4.0)
        reviews_count = vendor.get('reviews_count', 10)
        
        try:
            rating = float(rating)
            reviews_count = int(reviews_count)
            
            # Rating score (0-5 scale to 0-100)
            rating_score = (rating / 5.0) * 100
            
            # Review count bonus (more reviews = more reliable)
            if reviews_count >= 50:
                reliability_bonus = 10
            elif reviews_count >= 20:
                reliability_bonus = 5
            elif reviews_count >= 5:
                reliability_bonus = 0
            else:
                reliability_bonus = -10  # Few reviews penalty
            
            return min(rating_score + reliability_bonus, 100)
            
        except (ValueError, TypeError):
            return 70  # Default score
    
    def _score_experience_level(self, vendor: Dict[str, Any]) -> float:
        """Score based on years of experience (0-100)"""
        
        years_experience = vendor.get('years_experience', 5)
        
        try:
            years = int(years_experience)
            
            if years >= 10:
                return 100
            elif years >= 5:
                return 80
            elif years >= 2:
                return 60
            else:
                return 40
                
        except (ValueError, TypeError):
            return 60  # Default
    
    def _calculate_confidence(self, scores: Dict[str, float]) -> str:
        """Calculate confidence level in the recommendation"""
        
        # Check score consistency
        score_variance = max(scores.values()) - min(scores.values())
        avg_score = sum(scores.values()) / len(scores)
        
        if avg_score >= 80 and score_variance <= 20:
            return "High"
        elif avg_score >= 60 and score_variance <= 30:
            return "Medium"
        else:
            return "Low"

def demo_intelligent_scoring():
    """Demo the intelligent scoring system"""
    
    print("🧠 INTELLIGENT SCORING ENGINE DEMO")
    print("="*50)
    
    engine = IntelligentScoringEngine()
    
    # Sample wedding
    wedding_details = {
        'guest_count': '120',
        'location': 'Mumbai',
        'budget': '$45,000',
        'theme': 'modern_minimalist',
        'wedding_style': 'Modern',
        'season': 'Winter 2024',
        'date': '2024-12-15'
    }
    
    # Sample vendors
    vendors = [
        {
            'name': 'Elite Mumbai Venues',
            'category': 'Venue',
            'location': 'Mumbai',
            'price_range': 'High',
            'capacity': '130',
            'rating': 4.7,
            'reviews_count': 45,
            'years_experience': 8,
            'specialties': ['Modern weddings', 'Corporate events'],
            'availability_status': 'Available'
        },
        {
            'name': 'Budget Banquet Hall',
            'category': 'Venue', 
            'location': 'Pune',
            'price_range': 'Low',
            'capacity': '80',
            'rating': 3.8,
            'reviews_count': 12,
            'years_experience': 3,
            'specialties': ['Traditional ceremonies'],
            'availability_status': 'Limited'
        },
        {
            'name': 'Modern Photography Studio',
            'category': 'Photography',
            'location': 'Mumbai',
            'price_range': 'Medium',
            'capacity': 'Multiple events',
            'rating': 4.9,
            'reviews_count': 78,
            'years_experience': 12,
            'specialties': ['Modern weddings', 'Minimalist photography'],
            'availability_status': 'Available'
        }
    ]
    
    print(f"Wedding: {wedding_details['guest_count']} guests, {wedding_details['budget']}, {wedding_details['theme']}")
    print("\nVENDOR SCORING RESULTS:")
    print("-" * 50)
    
    for vendor in vendors:
        result = engine.calculate_vendor_score(vendor, wedding_details)
        
        print(f"\n🏢 {vendor['name']} ({vendor['category']})")
        print(f"📊 Overall Score: {result['overall_score']}/100")
        print(f"🎯 Confidence: {result['confidence_level']}")
        
        print("💪 Strengths:")
        for reason in result['recommendation_reasons']:
            print(f"  ✅ {reason}")
        
        if result['risk_factors']:
            print("⚠️ Considerations:")
            for risk in result['risk_factors']:
                print(f"  ⚠️ {risk}")
        
        print("📋 Score Breakdown:")
        for factor, score in result['breakdown'].items():
            print(f"  {factor.replace('_', ' ').title()}: {score:.1f}")

if __name__ == "__main__":
    demo_intelligent_scoring() 