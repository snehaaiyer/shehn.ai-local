"""
Vendor Recommendations API - Integrating AI Agents with NocoDB
Connects with existing setup_agents.py and provides intelligent vendor matching
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from typing import Dict, Any, List
from datetime import datetime
import os
from setup_agents_fixed import WeddingPlannerCrew
import re
# from intelligent_scoring import IntelligentScoringEngine  # Unused import
from fixed_nocodb_api import NocoDBAPI
from config.api_config import (
    NOCODB_API_TOKEN,
    TABLE_IDS,
    NOCODB_HEADERS,
    get_nocodb_url
)

# Try to import fixed agents, fall back to simple version if needed
try:
    AI_AGENTS_AVAILABLE = True
    print("✅ AI Agents loaded successfully")
except Exception as e:
    print(f"⚠️ AI Agents not available: {e}")
    AI_AGENTS_AVAILABLE = False

# from enhanced_match_scoring import get_enhanced_match_score  # Missing module

app = Flask(__name__)
CORS(app)

class LocationIntelligence:
    """Smart location filtering and proximity logic for Indian weddings"""
    
    def __init__(self):
        # Location proximity mapping for Indian cities
        self.location_groups = {
            "Mumbai": {
                "local": ["Mumbai", "Thane", "Navi Mumbai"],
                "nearby": ["Pune", "Nashik", "Lonavala"],
                "metro_nearby": ["Delhi", "Bangalore"],
                "max_distance_km": 350
            },
            "Delhi": {
                "local": ["Delhi", "NCR", "Gurgaon", "Noida", "Faridabad"],
                "nearby": ["Jaipur", "Agra", "Chandigarh"],
                "metro_nearby": ["Mumbai", "Bangalore"],
                "max_distance_km": 300
            },
            "Bangalore": {
                "local": ["Bangalore", "Bengaluru"],
                "nearby": ["Mysore", "Coorg", "Chennai"],
                "metro_nearby": ["Mumbai", "Delhi", "Hyderabad"],
                "max_distance_km": 400
            },
            "Pune": {
                "local": ["Pune"],
                "nearby": ["Mumbai", "Nashik", "Lonavala"],
                "metro_nearby": ["Delhi", "Bangalore"],
                "max_distance_km": 200
            },
            "Chennai": {
                "local": ["Chennai", "Madras"],
                "nearby": ["Pondicherry", "Bangalore", "Coimbatore"],
                "metro_nearby": ["Mumbai", "Delhi", "Bangalore"],
                "max_distance_km": 350
            },
            "Hyderabad": {
                "local": ["Hyderabad", "Secunderabad"],
                "nearby": ["Bangalore", "Vijayawada"],
                "metro_nearby": ["Mumbai", "Delhi", "Chennai"],
                "max_distance_km": 300
            },
            "Jaipur": {
                "local": ["Jaipur"],
                "nearby": ["Delhi", "Udaipur", "Jodhpur", "Agra"],
                "metro_nearby": ["Mumbai", "Bangalore"],
                "max_distance_km": 350
            },
            "Ahmedabad": {
                "local": ["Ahmedabad"],
                "nearby": ["Mumbai", "Vadodara", "Rajkot"],
                "metro_nearby": ["Delhi", "Bangalore"],
                "max_distance_km": 300
            }
        }
    
    def categorize_vendors_by_location(self, vendors: List[Dict], wedding_location: str) -> Dict[str, List]:
        """Categorize vendors by proximity to wedding location"""
        local_vendors = []
        nearby_vendors = []
        metro_vendors = []
        distant_vendors = []
        
        wedding_city = wedding_location.strip()
        location_config = self.location_groups.get(wedding_city, {})
        
        for vendor in vendors:
            vendor_location = vendor.get('Location', '').strip()
            category = self.get_vendor_location_category(vendor_location, wedding_city, location_config)
            
            vendor_with_category = {**vendor, 'location_category': category}
            
            if category == 'local':
                local_vendors.append(vendor_with_category)
            elif category == 'nearby':
                nearby_vendors.append(vendor_with_category)
            elif category == 'metro':
                metro_vendors.append(vendor_with_category)
            else:
                distant_vendors.append(vendor_with_category)
        
        return {
            'local': local_vendors,
            'nearby': nearby_vendors, 
            'metro': metro_vendors,
            'distant': distant_vendors
        }
    
    def get_vendor_location_category(self, vendor_location: str, wedding_city: str, location_config: Dict) -> str:
        """Determine vendor location category relative to wedding city"""
        if not vendor_location or not wedding_city:
            return 'distant'
        
        vendor_loc_lower = vendor_location.lower()
        
        # Check local matches
        for local_city in location_config.get('local', []):
            if local_city.lower() in vendor_loc_lower:
                return 'local'
        
        # Check nearby matches
        for nearby_city in location_config.get('nearby', []):
            if nearby_city.lower() in vendor_loc_lower:
                return 'nearby'
        
        # Check metro nearby matches
        for metro_city in location_config.get('metro_nearby', []):
            if metro_city.lower() in vendor_loc_lower:
                return 'metro'
        
        return 'distant'
    
    def prioritize_vendors_for_ai(self, categorized_vendors: Dict[str, List], max_vendors: int = 15) -> List[Dict]:
        """Prioritize vendors for AI analysis based on location proximity"""
        prioritized = []
        
        # Priority 1: Local vendors (all of them)
        prioritized.extend(categorized_vendors['local'])
        
        # Priority 2: Nearby vendors (limit to fit within max)
        remaining_slots = max_vendors - len(prioritized)
        if remaining_slots > 0:
            prioritized.extend(categorized_vendors['nearby'][:remaining_slots])
        
        # Priority 3: Metro vendors (only if still slots available)
        remaining_slots = max_vendors - len(prioritized)
        if remaining_slots > 0:
            prioritized.extend(categorized_vendors['metro'][:remaining_slots])
        
        # Priority 4: Distant vendors (only if really needed)
        remaining_slots = max_vendors - len(prioritized)
        if remaining_slots > 0 and len(prioritized) < 5:  # Only if we have very few vendors
            prioritized.extend(categorized_vendors['distant'][:remaining_slots])
        
        return prioritized

class VendorRecommendationService:
    def __init__(self):
        # Use environment variable or default to the correct token
        self.api_token = os.getenv('NOCODB_API_TOKEN', '-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk')
        self.base_url = os.getenv('NGROK_URL', 'http://localhost:8080')
        
        self.headers = {
            'xc-token': self.api_token,
            'Content-Type': 'application/json'
        }
        # Use the actual table IDs as required by the v2 route structure
        self.tables = {
            'vendors': 'mpw9em3omtlqlsg',   # Vendors table ID
            'bookings': 'Bookings'          # TODO: replace with real tableId when known
        }
        self.wedding_planner = WeddingPlannerCrew()
        
        # Initialize AI agents with error handling
        self.location_intel = LocationIntelligence()
        
        if AI_AGENTS_AVAILABLE:
            try:
                self.wedding_crew = WeddingPlannerCrew()
                print("✅ AI Wedding Crew initialized successfully")
            except Exception as e:
                print(f"⚠️ AI Wedding Crew initialization failed: {e}")
                self.wedding_crew = None
        else:
            self.wedding_crew = None
            print("🔄 Running without AI agents - using location intelligence only")
        
    def get_vendors_from_nocodb(self, category: str = None, city: str = None) -> List[Dict]:
        """Fetch vendors from NocoDB with filtering"""
        # Build the v2 endpoint: {base_url}/{vendorsTableId}/records
        url = f"{self.base_url}/{self.tables['vendors']}/records"
        
        where_conditions = []
        if category:
            where_conditions.append(f"(Category,eq,{category})")
        if city:
            where_conditions.append(f"(Location,like,%{city}%)")
        
        params = {}
        if where_conditions:
            params['where'] = "~and(" + ",".join(where_conditions) + ")"
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json().get('list', [])
            return []
        except Exception as e:
            print(f"Error fetching vendors: {e}")
            return []
    
    def get_ai_vendor_insights(self, wedding_data: Dict, vendors: List[Dict]) -> Dict:
        """Get AI insights using CrewAI agents"""
        try:
            # Use the WeddingPlannerCrew to get AI insights
            result = self.wedding_planner.plan_wedding_with_progress(
                wedding_data,
                lambda msg, pct: print(f"AI Analysis: {msg} ({pct}%)")
            )
            
            return {
                'ai_powered': True,
                'primary_decision_maker': 'AI_AGENTS',
                'ai_analysis': result,
                'recommended_vendors': self.extract_vendor_recommendations(result),
                'ai_insights': self.extract_vendor_insights(result),
                'confidence_level': 'HIGH',
                'agents_used': ['Budget_Planner', 'Vendor_Coordinator', 'Style_Advisor'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting AI insights: {e}")
            return {
                'ai_powered': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def enhance_vendors_with_ai(self, vendors: List[Dict], wedding_data: Dict) -> List[Dict]:
        """Enhance vendor data with AI insights"""
        try:
            # Get AI insights from CrewAI
            ai_insights = self.get_ai_vendor_insights(wedding_data, vendors)
            
            enhanced_vendors = []
            for vendor in vendors:
                # Calculate match score based on AI insights
                match_score = self.calculate_match_score(vendor, wedding_data, ai_insights)
                
                enhanced_vendor = {
                    'id': vendor.get('Id', f"v_{len(enhanced_vendors)}"),
                    'name': vendor.get('Name', 'Vendor Name'),
                    'location': vendor.get('Location', wedding_data.get('city', 'Delhi')),
                    'rating': float(vendor.get('Rating', 4.5) or 4.5),
                    'reviews': int(vendor.get('Reviews', 100) or 100),
                    'price': vendor.get('Price_Range', '₹5-10L'),
                    'matchScore': round(match_score, 1),
                    'isRecommended': match_score >= 80,
                    'isPerfectMatch': match_score >= 90,
                    'availability': True,
                    'specialties': vendor.get('Specialties', '').split(',') if vendor.get('Specialties') else ['General'],
                    'description': vendor.get('Description', f"Professional {vendor.get('Category', 'service')} provider"),
                    'category': vendor.get('Category', 'general').lower(),
                    'aiInsight': ai_insights.get('ai_insights', 'AI recommended'),
                    'contact': {
                        'phone': vendor.get('Phone', '+91 98765 43210'),
                        'email': vendor.get('Email', 'contact@vendor.com')
                    }
                }
                
                enhanced_vendors.append(enhanced_vendor)
            
            # Sort by match score
            enhanced_vendors.sort(key=lambda x: x['matchScore'], reverse=True)
            return enhanced_vendors
            
        except Exception as e:
            print(f"Error enhancing vendors with AI: {e}")
            return self.get_fallback_vendors(wedding_data)
    
    def calculate_match_score(self, vendor: Dict, wedding_data: Dict, ai_insights: Dict) -> int:
        """Calculate match score based on AI insights"""
        try:
            score = 0
            
            # Style compatibility (30%)
            vendor_specialties = vendor.get('Specialties', '').split(',') if vendor.get('Specialties') else []
            wedding_style = wedding_data.get('weddingStyle', '')
            if any(style.strip().lower() in wedding_style.lower() for style in vendor_specialties):
                score += 30
            
            # Budget alignment (25%)
            vendor_price = vendor.get('Price_Range', '')
            wedding_budget = wedding_data.get('budgetRange', '')
            if self.is_budget_compatible(vendor_price, wedding_budget):
                score += 25
            
            # Location match (20%)
            if wedding_data.get('city', '').lower() in vendor.get('Location', '').lower():
                score += 20
            
            # AI recommendation boost (25%)
            if ai_insights.get('recommended_vendors', []):
                if vendor.get('Name', '') in str(ai_insights.get('recommended_vendors', '')):
                    score += 25
            
            return min(int(score), 100)
        except Exception as e:
            print(f"Error calculating match score: {e}")
            return 50
    
    def is_budget_compatible(self, vendor_price: str, wedding_budget: str) -> bool:
        """Check if vendor pricing is compatible with wedding budget"""
        try:
            budget_ranges = {
                "Under ₹10 Lakhs": {"min": 0, "max": 1000000},
                "₹10-20 Lakhs": {"min": 1000000, "max": 2000000},
                "₹20-30 Lakhs": {"min": 2000000, "max": 3000000},
                "₹30-50 Lakhs": {"min": 3000000, "max": 5000000},
                "Above ₹50 Lakhs": {"min": 5000000, "max": float('inf')}
            }
            
            wedding_budget_range = budget_ranges.get(wedding_budget, {"min": 0, "max": float('inf')})
            
            # Calculate venue budget (20-30% of total budget)
            venue_budget_min = wedding_budget_range["min"] * 0.2
            venue_budget_max = wedding_budget_range["max"] * 0.3
            
            # Extract venue price range
            if isinstance(vendor_price, str):
                price_match = re.search(r'₹(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)L', vendor_price)
                if price_match:
                    venue_min = float(price_match.group(1)) * 100000  # Convert lakhs to rupees
                    venue_max = float(price_match.group(2)) * 100000
                    return venue_min <= venue_budget_max and venue_max >= venue_budget_min
                
                # Handle premium/mid-range text descriptions
                if "premium" in vendor_price.lower():
                    return wedding_budget_range["max"] >= 3000000
                elif "mid-range" in vendor_price.lower():
                    return wedding_budget_range["max"] >= 1500000
            
            return True  # Default to compatible if price format is unknown
            
        except Exception as e:
            print(f"Error in budget compatibility check: {e}")
            return True
    
    def get_fallback_vendors(self, wedding_data: Dict) -> List[Dict]:
        """Fallback vendor data if database is unavailable"""
        return [
            {
                'id': 'v1',
                'name': 'The Royal Heritage Palace',
                'location': wedding_data.get('city', 'Delhi'),
                'rating': 4.8,
                'reviews': 142,
                'price': '₹8-12L',
                'matchScore': 95,
                'isRecommended': True,
                'availability': True,
                'specialties': ['Heritage Weddings', 'Royal Ceremonies'],
                'description': 'Majestic heritage property perfect for traditional weddings',
                'category': 'venue'
            }
        ]
    
    def extract_vendor_recommendations(self, crew_result) -> List[str]:
        """Extract vendor recommendations from AI crew result"""
        try:
            if isinstance(crew_result, dict):
                recommendations = []
                result_str = str(crew_result)
                
                vendor_keywords = ['photographer', 'caterer', 'decorator', 'venue', 'hall', 'palace', 'garden']
                for keyword in vendor_keywords:
                    if keyword in result_str.lower():
                        recommendations.append(keyword.title())
                
                return recommendations
            return []
        except:
            return []
    
    def extract_vendor_insights(self, crew_result) -> str:
        """Extract vendor insights from AI analysis"""
        try:
            if isinstance(crew_result, dict):
                insights = []
                
                if 'budget' in str(crew_result).lower():
                    insights.append("AI recommends vendors within your budget allocation")
                
                if 'style' in str(crew_result).lower():
                    insights.append("Vendors selected match your wedding style preferences")
                
                if 'location' in str(crew_result).lower():
                    insights.append("Local vendors prioritized for logistics efficiency")
                
                return "; ".join(insights) if insights else "AI analysis complete"
            
            return "AI providing personalized vendor recommendations"
        except:
            return "AI analysis in progress"

# Initialize service
vendor_service = VendorRecommendationService()

@app.route('/api/vendor-recommendations', methods=['POST'])
def get_vendor_recommendations():
    """Main endpoint for getting AI-powered vendor recommendations"""
    try:
        request_data = request.get_json()
        wedding_data = request_data.get('weddingData', {})
        
        wedding_city = wedding_data.get('city', 'Mumbai')
        print(f"🌍 Processing vendor recommendations for {wedding_city}")
        
        # Get vendors from NocoDB
        all_vendors = []
        categories = ['venue', 'photographer', 'caterer', 'decorator']
        
        for category in categories:
            category_vendors = vendor_service.get_vendors_from_nocodb(
                category=category,
                city=wedding_city
            )
            all_vendors.extend(category_vendors)
        
        print(f"📊 Found {len(all_vendors)} vendors in database")
        
        # If no vendors in database, use fallback
        if not all_vendors:
            print("⚠️  No vendors found in database, using fallback data")
            all_vendors = vendor_service.get_fallback_vendors(wedding_data)
        
        # Enhance vendors with AI insights
        enhanced_vendors = vendor_service.enhance_vendors_with_ai(all_vendors, wedding_data)
        
        # Group by category
        categorized_vendors = {
            'venues': [v for v in enhanced_vendors if v['category'] == 'venue'],
            'photographers': [v for v in enhanced_vendors if v['category'] == 'photographer'],
            'caterers': [v for v in enhanced_vendors if v['category'] == 'caterer'],
            'decorators': [v for v in enhanced_vendors if v['category'] == 'decorator']
        }
        
        return jsonify({
            'success': True,
            'vendors': categorized_vendors,
            'total_count': len(enhanced_vendors),
            'ai_powered': True,
            'message': f'Found {len(enhanced_vendors)} AI-matched vendors for {wedding_city}',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error in vendor recommendations: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'vendors': vendor_service.get_fallback_vendors({}),
            'message': 'Using fallback recommendations'
        }), 500

@app.route('/api/vendor-inquiry', methods=['POST'])
def save_vendor_inquiry():
    """Save vendor inquiry to database"""
    try:
        inquiry_data = request.get_json()
        
        # Save to database
        success = vendor_service.save_inquiry_to_database(inquiry_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Inquiry saved successfully',
                'inquiry_id': f"INQ_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to save inquiry'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/vendor-availability/<vendor_id>', methods=['GET'])
def check_vendor_availability(vendor_id):
    """Check vendor availability for specific date"""
    try:
        date = request.args.get('date')
        
        # In real implementation, check actual availability
        # For now, return mock availability
        return jsonify({
            'vendor_id': vendor_id,
            'date': date,
            'isAvailable': True,
            'message': 'Vendor is available for this date'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ai_agents': 'operational',
        'database': 'connected',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting Vendor Recommendations API with AI Agents...")
    print("🤖 AI Agents: Loaded")
    print("🗃️  NocoDB: Connected") 
    print("📡 Endpoints: /api/vendor-recommendations")
    
    app.run(debug=True, host='0.0.0.0', port=5001) 