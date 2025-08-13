
#!/usr/bin/env python3
"""
Focused Serper API Response and Filtering Algorithm Validation
Tests specific filtering logic and provides detailed justification for match results
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Tuple
from enhanced_serper_api import EnhancedSerperAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SerperFilteringValidator:
    """Validates Serper API responses and filtering algorithms"""
    
    def __init__(self):
        self.serper_api = EnhancedSerperAPI()
        self.validation_results = []
    
    def run_filtering_validation(self):
        """Run focused validation of filtering algorithms"""
        
        print("🔬 SERPER API & FILTERING VALIDATION")
        print("=" * 60)
        
        # Test specific user inputs for validation
        test_cases = [
            {
                "name": "Sneha & Hellu - Traditional Bangalore Wedding",
                "user_input": {
                    "category": "venues",
                    "location": "Bangalore",
                    "budget_range": (300000, 800000),
                    "guest_count": 350,
                    "wedding_theme": "traditional south indian",
                    "venue_style": "heritage palace",
                    "indoor_outdoor": "indoor",
                    "cultural_requirements": ["traditional ceremonies", "vegetarian food"]
                },
                "filtering_expectations": {
                    "min_capacity": 300,
                    "max_capacity": 500,
                    "budget_compatibility": True,
                    "location_match": "bangalore",
                    "style_keywords": ["traditional", "heritage", "palace", "hall"]
                }
            },
            {
                "name": "Modern Mumbai Photographer Search",
                "user_input": {
                    "category": "photography",
                    "location": "Mumbai",
                    "budget_range": (100000, 250000),
                    "guest_count": 200,
                    "wedding_theme": "modern contemporary",
                    "photography_style": "candid artistic",
                    "services_needed": ["pre-wedding", "reception"]
                },
                "filtering_expectations": {
                    "style_keywords": ["candid", "artistic", "modern", "contemporary"],
                    "service_keywords": ["pre-wedding", "reception", "engagement"],
                    "budget_compatibility": True,
                    "location_match": "mumbai"
                }
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🎯 TEST CASE {i}: {test_case['name']}")
            print("-" * 50)
            self.validate_test_case(test_case)
    
    def validate_test_case(self, test_case: Dict[str, Any]):
        """Validate a specific test case with detailed analysis"""
        
        user_input = test_case["user_input"]
        expectations = test_case["filtering_expectations"]
        
        print(f"📋 User Input Analysis:")
        for key, value in user_input.items():
            print(f"   • {key}: {value}")
        
        try:
            # Step 1: Test raw Serper API call
            print(f"\n1️⃣ TESTING RAW SERPER API RESPONSE")
            raw_results = self._test_raw_serper_call(user_input)
            
            # Step 2: Test search query generation
            print(f"\n2️⃣ TESTING SEARCH QUERY GENERATION")
            generated_queries = self._test_query_generation(user_input)
            
            # Step 3: Test enhanced vendor search
            print(f"\n3️⃣ TESTING ENHANCED VENDOR SEARCH")
            enhanced_results = self._test_enhanced_search(user_input)
            
            # Step 4: Validate filtering logic
            print(f"\n4️⃣ VALIDATING FILTERING LOGIC")
            filtering_analysis = self._validate_filtering(enhanced_results, expectations, user_input)
            
            # Step 5: Justify match results
            print(f"\n5️⃣ MATCH RESULT JUSTIFICATION")
            match_justification = self._justify_match_results(enhanced_results, user_input, expectations)
            
            # Store validation results
            validation_result = {
                "test_case_name": test_case["name"],
                "user_input": user_input,
                "raw_results_count": len(raw_results),
                "enhanced_results_count": len(enhanced_results.get("vendors", [])),
                "filtering_analysis": filtering_analysis,
                "match_justification": match_justification,
                "timestamp": datetime.now().isoformat()
            }
            
            self.validation_results.append(validation_result)
            
        except Exception as e:
            logger.error(f"❌ Error in test case validation: {e}")
            print(f"   ❌ Test case failed: {e}")
    
    def _test_raw_serper_call(self, user_input: Dict) -> List[Dict]:
        """Test raw Serper API call with simple query"""
        
        category = user_input.get("category", "venues")
        location = user_input.get("location", "Mumbai")
        
        # Simple direct query
        simple_query = f"{location} wedding {category} contact phone"
        
        try:
            import requests
            from config.api_config import SERPER_API_KEY
            
            headers = {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': simple_query,
                'num': 10,
                'gl': 'in',
                'hl': 'en',
                'safe': 'active'
            }
            
            response = requests.post(
                'https://google.serper.dev/search',
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                organic_results = data.get('organic', [])
                
                print(f"   ✅ Raw API call successful")
                print(f"   📊 Raw results: {len(organic_results)}")
                
                # Analyze first few results
                for i, result in enumerate(organic_results[:3], 1):
                    title = result.get('title', '')
                    snippet = result.get('snippet', '')
                    
                    print(f"   {i}. {title[:60]}...")
                    print(f"      Snippet: {snippet[:100]}...")
                    
                    # Check for business indicators
                    has_contact = any(word in snippet.lower() for word in ['contact', 'phone', 'call'])
                    has_business = any(word in title.lower() for word in ['studio', 'services', 'hall', 'venue'])
                    
                    print(f"      Has Contact Info: {has_contact}")
                    print(f"      Business Indicator: {has_business}")
                
                return organic_results
            else:
                print(f"   ❌ Raw API call failed: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"   ❌ Raw API call error: {e}")
            return []
    
    def _test_query_generation(self, user_input: Dict) -> List[str]:
        """Test search query generation logic"""
        
        category = user_input.get("category", "venues")
        location = user_input.get("location", "Mumbai")
        budget_range = user_input.get("budget_range", (200000, 500000))
        guest_count = user_input.get("guest_count", 200)
        wedding_theme = user_input.get("wedding_theme", "")
        
        queries = self.serper_api._generate_targeted_search_queries(
            category, location, budget_range, guest_count, wedding_theme
        )
        
        print(f"   ✅ Generated {len(queries)} search queries")
        print(f"   📝 Sample queries:")
        for i, query in enumerate(queries[:5], 1):
            print(f"      {i}. {query}")
        
        return queries
    
    def _test_enhanced_search(self, user_input: Dict) -> Dict:
        """Test enhanced vendor search with full pipeline"""
        
        category = user_input.get("category", "venues")
        location = user_input.get("location", "Mumbai")
        budget_range = user_input.get("budget_range", (200000, 500000))
        guest_count = user_input.get("guest_count", 200)
        wedding_theme = user_input.get("wedding_theme", "")
        
        results = self.serper_api.search_wedding_vendors(
            category=category,
            location=location,
            budget_range=budget_range,
            guest_count=guest_count,
            wedding_theme=wedding_theme,
            max_results=15
        )
        
        if results.get("success"):
            vendors = results.get("vendors", [])
            print(f"   ✅ Enhanced search successful: {len(vendors)} vendors found")
            
            # Analyze result quality
            vendors_with_phone = sum(1 for v in vendors if v.get('phone'))
            vendors_with_rating = sum(1 for v in vendors if v.get('rating', 0) > 0)
            avg_rating = sum(v.get('rating', 0) for v in vendors) / len(vendors) if vendors else 0
            
            print(f"   📞 Vendors with phone: {vendors_with_phone}/{len(vendors)} ({vendors_with_phone/len(vendors)*100:.1f}%)")
            print(f"   ⭐ Vendors with rating: {vendors_with_rating}/{len(vendors)} ({vendors_with_rating/len(vendors)*100:.1f}%)")
            print(f"   📊 Average rating: {avg_rating:.1f}")
            
        else:
            print(f"   ❌ Enhanced search failed: {results.get('error', 'Unknown error')}")
        
        return results
    
    def _validate_filtering(self, results: Dict, expectations: Dict, user_input: Dict) -> Dict:
        """Validate filtering logic against expectations"""
        
        if not results.get("success"):
            return {"validation_passed": False, "reason": "Search failed"}
        
        vendors = results.get("vendors", [])
        if not vendors:
            return {"validation_passed": False, "reason": "No vendors found"}
        
        validation_analysis = {
            "validation_passed": True,
            "validations": [],
            "failures": []
        }
        
        # Location validation
        location_expected = expectations.get("location_match", "").lower()
        location_matches = sum(1 for v in vendors if location_expected in v.get('location', '').lower())
        location_ratio = location_matches / len(vendors)
        
        if location_ratio >= 0.8:
            validation_analysis["validations"].append(f"Location filter working: {location_matches}/{len(vendors)} matches")
        else:
            validation_analysis["failures"].append(f"Location filter weak: only {location_matches}/{len(vendors)} matches")
        
        # Budget validation
        if expectations.get("budget_compatibility"):
            budget_range = user_input.get("budget_range", (0, 999999))
            budget_compatible = 0
            for vendor in vendors:
                price_min = vendor.get('price_min', 0)
                price_max = vendor.get('price_max', 999999)
                if price_min <= budget_range[1] and price_max >= budget_range[0]:
                    budget_compatible += 1
            
            budget_ratio = budget_compatible / len(vendors)
            if budget_ratio >= 0.7:
                validation_analysis["validations"].append(f"Budget filter working: {budget_compatible}/{len(vendors)} compatible")
            else:
                validation_analysis["failures"].append(f"Budget filter weak: only {budget_compatible}/{len(vendors)} compatible")
        
        # Style keyword validation
        style_keywords = expectations.get("style_keywords", [])
        if style_keywords:
            style_matches = 0
            for vendor in vendors:
                vendor_text = f"{vendor.get('name', '')} {' '.join(vendor.get('specialties', []))}".lower()
                if any(keyword.lower() in vendor_text for keyword in style_keywords):
                    style_matches += 1
            
            style_ratio = style_matches / len(vendors)
            if style_ratio >= 0.5:
                validation_analysis["validations"].append(f"Style filter working: {style_matches}/{len(vendors)} style matches")
            else:
                validation_analysis["failures"].append(f"Style filter weak: only {style_matches}/{len(vendors)} style matches")
        
        # Overall validation
        if validation_analysis["failures"]:
            validation_analysis["validation_passed"] = False
        
        print(f"   📊 Filtering Validation:")
        for validation in validation_analysis["validations"]:
            print(f"      ✅ {validation}")
        for failure in validation_analysis["failures"]:
            print(f"      ❌ {failure}")
        
        return validation_analysis
    
    def _justify_match_results(self, results: Dict, user_input: Dict, expectations: Dict) -> Dict:
        """Provide detailed justification for match results"""
        
        if not results.get("success"):
            return {"justification": "Search failed - cannot justify matches"}
        
        vendors = results.get("vendors", [])
        if not vendors:
            return {"justification": "No vendors found - filters may be too restrictive"}
        
        justifications = []
        
        # Analyze top 3 results
        for i, vendor in enumerate(vendors[:3], 1):
            vendor_justification = {
                "rank": i,
                "vendor_name": vendor.get('name', 'Unknown'),
                "match_reasons": [],
                "match_score_breakdown": vendor.get('score_breakdown', {}),
                "overall_score": vendor.get('search_score', 0)
            }
            
            # Location match justification
            user_location = user_input.get('location', '').lower()
            vendor_location = vendor.get('location', '').lower()
            if user_location in vendor_location:
                vendor_justification["match_reasons"].append(f"Exact location match: {vendor.get('location')}")
            elif vendor_location:
                vendor_justification["match_reasons"].append(f"Location: {vendor.get('location')} (nearby)")
            
            # Category match
            if vendor.get('category') == user_input.get('category'):
                vendor_justification["match_reasons"].append(f"Exact category match: {vendor.get('category')}")
            
            # Budget compatibility
            budget_range = user_input.get('budget_range', (0, 999999))
            vendor_min = vendor.get('price_min', 0)
            vendor_max = vendor.get('price_max', 999999)
            
            if vendor_min <= budget_range[1] and vendor_max >= budget_range[0]:
                overlap_min = max(vendor_min, budget_range[0])
                overlap_max = min(vendor_max, budget_range[1])
                vendor_justification["match_reasons"].append(
                    f"Budget compatible: ₹{overlap_min:,}-₹{overlap_max:,} overlap"
                )
            else:
                vendor_justification["match_reasons"].append("Budget may not align - check pricing")
            
            # Quality indicators
            if vendor.get('rating', 0) >= 4.0:
                vendor_justification["match_reasons"].append(f"High rating: {vendor.get('rating', 0):.1f} stars")
            
            if vendor.get('verified'):
                vendor_justification["match_reasons"].append("Verified vendor from trusted platform")
            
            # Contact availability
            contact_types = []
            if vendor.get('phone'):
                contact_types.append('phone')
            if vendor.get('email'):
                contact_types.append('email')
            if vendor.get('whatsapp'):
                contact_types.append('WhatsApp')
            
            if contact_types:
                vendor_justification["match_reasons"].append(f"Contact available: {', '.join(contact_types)}")
            
            justifications.append(vendor_justification)
        
        # Print justifications
        print(f"   🎯 Match Result Justifications:")
        for justification in justifications:
            print(f"\n      #{justification['rank']}: {justification['vendor_name']}")
            print(f"         Overall Score: {justification['overall_score']:.1f}")
            for reason in justification['match_reasons']:
                print(f"         • {reason}")
        
        return {
            "top_matches_justified": True,
            "detailed_justifications": justifications,
            "overall_quality": "Good" if len(justifications) >= 3 else "Moderate"
        }

def main():
    """Run the Serper filtering validation"""
    
    print("🚀 STARTING SERPER API & FILTERING VALIDATION")
    print("=" * 60)
    
    validator = SerperFilteringValidator()
    validator.run_filtering_validation()
    
    print(f"\n✅ VALIDATION COMPLETE!")
    
    # Export validation results
    report_file = f"serper_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump({
            "validation_summary": {
                "total_test_cases": len(validator.validation_results),
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": validator.validation_results
        }, f, indent=2)
    
    print(f"📄 Validation report exported: {report_file}")

if __name__ == "__main__":
    main()
