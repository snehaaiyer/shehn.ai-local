
#!/usr/bin/env python3
"""
Comprehensive RAG System Evaluation Test
Tests Serper API responses, filtering algorithms, and match quality with sample inputs
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Tuple
import numpy as np
from rag_enhanced_vendor_search_api import RAGVendorSearchEngine
from enhanced_serper_api import EnhancedSerperAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGSystemEvaluator:
    """Comprehensive RAG system evaluator with sample inputs and self-assessment"""
    
    def __init__(self):
        self.rag_engine = RAGVendorSearchEngine()
        self.serper_api = EnhancedSerperAPI()
        self.evaluation_results = []
        
    def run_comprehensive_evaluation(self):
        """Run comprehensive evaluation with multiple test scenarios"""
        
        print("🧪 RAG SYSTEM COMPREHENSIVE EVALUATION")
        print("=" * 70)
        
        # Test scenarios with different user preferences
        test_scenarios = [
            {
                "name": "Luxury Traditional Wedding - Mumbai",
                "preferences": {
                    "weddingTheme": "traditional royal",
                    "decorStyle": "royal rajasthani",
                    "colorTheme": "red gold",
                    "venueStyle": "heritage palace",
                    "culturalRequirements": ["traditional indian", "religious ceremonies"],
                    "cuisineStyle": "north indian",
                    "photographyStyle": "traditional",
                    "budgetRange": "₹30-50 Lakhs",
                    "guestCount": 500,
                    "city": "Mumbai",
                    "indoorOutdoor": "indoor",
                    "priorities": ["venue", "photography", "catering"]
                },
                "expected_matches": ["luxury venues", "traditional photographers", "premium catering"]
            },
            {
                "name": "Modern Minimalist Wedding - Bangalore",
                "preferences": {
                    "weddingTheme": "minimalist contemporary",
                    "decorStyle": "minimalist pastel",
                    "colorTheme": "white pastel",
                    "venueStyle": "modern luxury hotel",
                    "culturalRequirements": ["fusion ceremonies"],
                    "cuisineStyle": "international fusion",
                    "photographyStyle": "candid artistic",
                    "budgetRange": "₹20-35 Lakhs",
                    "guestCount": 200,
                    "city": "Bangalore",
                    "indoorOutdoor": "indoor",
                    "priorities": ["photography", "venue", "decoration"]
                },
                "expected_matches": ["modern venues", "artistic photographers", "fusion catering"]
            },
            {
                "name": "Destination Beach Wedding - Goa",
                "preferences": {
                    "weddingTheme": "beach destination",
                    "decorStyle": "bohemian coastal",
                    "colorTheme": "ocean blue",
                    "venueStyle": "beach resort",
                    "culturalRequirements": ["outdoor ceremonies", "casual"],
                    "cuisineStyle": "coastal seafood",
                    "photographyStyle": "candid outdoor",
                    "budgetRange": "₹25-40 Lakhs",
                    "guestCount": 150,
                    "city": "Goa",
                    "indoorOutdoor": "outdoor",
                    "priorities": ["venue", "photography"]
                },
                "expected_matches": ["beach resorts", "outdoor photographers", "coastal catering"]
            }
        ]
        
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"\n🎯 TEST SCENARIO {i}: {scenario['name']}")
            print("-" * 50)
            self.evaluate_scenario(scenario)
            
        # Generate comprehensive evaluation report
        self.generate_evaluation_report()
    
    def evaluate_scenario(self, scenario: Dict[str, Any]):
        """Evaluate a specific test scenario"""
        
        preferences = scenario["preferences"]
        expected_matches = scenario["expected_matches"]
        
        print(f"📋 User Preferences:")
        for key, value in preferences.items():
            print(f"   • {key}: {value}")
        
        try:
            # Step 1: Test preference embedding generation
            print(f"\n1️⃣ TESTING PREFERENCE EMBEDDING GENERATION")
            user_embeddings = self.rag_engine.generate_user_preference_embeddings(preferences)
            
            print(f"   ✅ Style embedding generated: {len(user_embeddings.style_embedding)} dims")
            print(f"   ✅ Cultural embedding generated: {len(user_embeddings.cultural_embedding)} dims")
            print(f"   ✅ Service embedding generated: {len(user_embeddings.service_embedding)} dims")
            print(f"   📊 Preference weights: {user_embeddings.preference_weights}")
            
            # Step 2: Test semantic search
            print(f"\n2️⃣ TESTING SEMANTIC VENDOR SEARCH")
            search_filters = {
                "category": "all",
                "location": preferences.get("city", "Mumbai"),
                "guestCount": preferences.get("guestCount", 200),
                "budgetTier": self._map_budget_to_tier(preferences.get("budgetRange", "₹20-30 Lakhs"))
            }
            
            import asyncio
            search_results = asyncio.run(
                self.rag_engine.semantic_vendor_search(user_embeddings, search_filters, 10)
            )
            
            print(f"   ✅ Search completed: {len(search_results)} vendors found")
            
            # Step 3: Analyze search results quality
            print(f"\n3️⃣ ANALYZING SEARCH RESULTS QUALITY")
            quality_analysis = self.analyze_search_quality(search_results, preferences, expected_matches)
            
            # Step 4: Test traditional Serper API for comparison
            print(f"\n4️⃣ TESTING TRADITIONAL SERPER API (COMPARISON)")
            traditional_results = self.test_traditional_serper(preferences)
            
            # Step 5: Compare RAG vs Traditional results
            print(f"\n5️⃣ COMPARING RAG vs TRADITIONAL RESULTS")
            comparison_analysis = self.compare_approaches(search_results, traditional_results, preferences)
            
            # Store evaluation results
            scenario_result = {
                "scenario_name": scenario["name"],
                "preferences": preferences,
                "rag_results_count": len(search_results),
                "traditional_results_count": len(traditional_results),
                "quality_analysis": quality_analysis,
                "comparison_analysis": comparison_analysis,
                "timestamp": datetime.now().isoformat()
            }
            
            self.evaluation_results.append(scenario_result)
            
            print(f"\n📊 SCENARIO SUMMARY:")
            print(f"   RAG Results: {len(search_results)} vendors")
            print(f"   Traditional Results: {len(traditional_results)} vendors")
            print(f"   Quality Score: {quality_analysis['overall_quality_score']:.2f}/10")
            print(f"   Match Relevance: {quality_analysis['relevance_score']:.2f}/10")
            
        except Exception as e:
            logger.error(f"❌ Error in scenario evaluation: {e}")
            print(f"   ❌ Scenario failed: {e}")
    
    def analyze_search_quality(self, results: List[Dict], preferences: Dict, expected_matches: List[str]) -> Dict:
        """Analyze the quality of search results"""
        
        if not results:
            return {
                "overall_quality_score": 0,
                "relevance_score": 0,
                "diversity_score": 0,
                "match_explanations": ["No results found"]
            }
        
        quality_metrics = {
            "overall_quality_score": 0,
            "relevance_score": 0,
            "diversity_score": 0,
            "match_explanations": []
        }
        
        # Analyze each result
        total_rag_score = 0
        category_distribution = {}
        budget_matches = 0
        location_matches = 0
        relevance_matches = 0
        
        for result in results:
            # RAG Score analysis
            rag_scores = result.get('rag_scores', {})
            total_rag_score += rag_scores.get('final_score', 0)
            
            # Category distribution
            category = result.get('category', 'unknown')
            category_distribution[category] = category_distribution.get(category, 0) + 1
            
            # Location matching
            if preferences.get("city", "").lower() in result.get('location', '').lower():
                location_matches += 1
            
            # Budget tier analysis
            user_budget_tier = self._map_budget_to_tier(preferences.get("budgetRange", ""))
            if result.get('budget_tier') == user_budget_tier:
                budget_matches += 1
            
            # Relevance to expected matches
            vendor_name_lower = result.get('name', '').lower()
            for expected in expected_matches:
                if any(word in vendor_name_lower for word in expected.lower().split()):
                    relevance_matches += 1
                    break
        
        # Calculate quality scores
        avg_rag_score = total_rag_score / len(results) if results else 0
        quality_metrics["overall_quality_score"] = min(10, avg_rag_score * 10)
        
        location_match_ratio = location_matches / len(results)
        budget_match_ratio = budget_matches / len(results)
        relevance_match_ratio = relevance_matches / len(results)
        
        quality_metrics["relevance_score"] = (
            location_match_ratio * 3 +
            budget_match_ratio * 3 +
            relevance_match_ratio * 4
        )
        
        quality_metrics["diversity_score"] = min(10, len(category_distribution) * 2)
        
        # Generate match explanations
        quality_metrics["match_explanations"] = [
            f"Average RAG Score: {avg_rag_score:.3f}",
            f"Location Matches: {location_matches}/{len(results)} ({location_match_ratio:.1%})",
            f"Budget Tier Matches: {budget_matches}/{len(results)} ({budget_match_ratio:.1%})",
            f"Relevance Matches: {relevance_matches}/{len(results)} ({relevance_match_ratio:.1%})",
            f"Category Distribution: {category_distribution}"
        ]
        
        print(f"   📊 Quality Analysis:")
        for explanation in quality_metrics["match_explanations"]:
            print(f"      • {explanation}")
        
        return quality_metrics
    
    def test_traditional_serper(self, preferences: Dict) -> List[Dict]:
        """Test traditional Serper API for comparison"""
        
        try:
            category = "venues"  # Test with venues
            location = preferences.get("city", "Mumbai")
            
            traditional_result = self.serper_api.search_wedding_vendors(
                category=category,
                location=location,
                budget_range=(200000, 1000000),
                guest_count=preferences.get("guestCount", 200),
                wedding_theme=preferences.get("weddingTheme", ""),
                max_results=10
            )
            
            if traditional_result.get("success"):
                vendors = traditional_result.get("vendors", [])
                print(f"   ✅ Traditional search: {len(vendors)} vendors found")
                return vendors
            else:
                print(f"   ❌ Traditional search failed: {traditional_result.get('error', 'Unknown error')}")
                return []
                
        except Exception as e:
            print(f"   ❌ Traditional search error: {e}")
            return []
    
    def compare_approaches(self, rag_results: List[Dict], traditional_results: List[Dict], 
                          preferences: Dict) -> Dict:
        """Compare RAG vs Traditional approaches"""
        
        comparison = {
            "rag_advantages": [],
            "traditional_advantages": [],
            "overall_winner": "tie"
        }
        
        # Compare result counts
        if len(rag_results) > len(traditional_results):
            comparison["rag_advantages"].append(f"More results found ({len(rag_results)} vs {len(traditional_results)})")
        elif len(traditional_results) > len(rag_results):
            comparison["traditional_advantages"].append(f"More results found ({len(traditional_results)} vs {len(rag_results)})")
        
        # Compare semantic relevance
        if rag_results:
            avg_rag_semantic_score = np.mean([
                r.get('rag_scores', {}).get('composite_score', 0) for r in rag_results
            ])
            if avg_rag_semantic_score > 0.3:
                comparison["rag_advantages"].append(f"Higher semantic relevance (avg: {avg_rag_semantic_score:.3f})")
        
        # Compare contact info availability
        rag_with_contacts = sum(1 for r in rag_results if r.get('contact', {}).get('phone'))
        trad_with_contacts = sum(1 for r in traditional_results if r.get('phone'))
        
        if rag_with_contacts > trad_with_contacts:
            comparison["rag_advantages"].append(f"More contact info ({rag_with_contacts} vs {trad_with_contacts})")
        elif trad_with_contacts > rag_with_contacts:
            comparison["traditional_advantages"].append(f"More contact info ({trad_with_contacts} vs {rag_with_contacts})")
        
        # Determine overall winner
        if len(comparison["rag_advantages"]) > len(comparison["traditional_advantages"]):
            comparison["overall_winner"] = "rag"
        elif len(comparison["traditional_advantages"]) > len(comparison["rag_advantages"]):
            comparison["overall_winner"] = "traditional"
        
        print(f"   🏆 Comparison Results:")
        print(f"      RAG Advantages: {comparison['rag_advantages']}")
        print(f"      Traditional Advantages: {comparison['traditional_advantages']}")
        print(f"      Overall Winner: {comparison['overall_winner'].upper()}")
        
        return comparison
    
    def _map_budget_to_tier(self, budget_str: str) -> str:
        """Map budget string to tier"""
        budget_lower = budget_str.lower()
        
        if "50" in budget_lower or "luxury" in budget_lower:
            return "ultra_luxury"
        elif "30" in budget_lower or "premium" in budget_lower:
            return "premium"
        elif "20" in budget_lower or "standard" in budget_lower:
            return "mid_range"
        else:
            return "budget"
    
    def generate_evaluation_report(self):
        """Generate comprehensive evaluation report"""
        
        print(f"\n📋 COMPREHENSIVE EVALUATION REPORT")
        print("=" * 70)
        
        if not self.evaluation_results:
            print("❌ No evaluation results to report")
            return
        
        # Overall statistics
        total_scenarios = len(self.evaluation_results)
        avg_quality = np.mean([r['quality_analysis']['overall_quality_score'] for r in self.evaluation_results])
        avg_relevance = np.mean([r['quality_analysis']['relevance_score'] for r in self.evaluation_results])
        
        rag_wins = sum(1 for r in self.evaluation_results if r['comparison_analysis']['overall_winner'] == 'rag')
        traditional_wins = sum(1 for r in self.evaluation_results if r['comparison_analysis']['overall_winner'] == 'traditional')
        ties = sum(1 for r in self.evaluation_results if r['comparison_analysis']['overall_winner'] == 'tie')
        
        print(f"📊 OVERALL STATISTICS:")
        print(f"   Total Test Scenarios: {total_scenarios}")
        print(f"   Average Quality Score: {avg_quality:.2f}/10")
        print(f"   Average Relevance Score: {avg_relevance:.2f}/10")
        print(f"   RAG Wins: {rag_wins}/{total_scenarios} ({rag_wins/total_scenarios:.1%})")
        print(f"   Traditional Wins: {traditional_wins}/{total_scenarios} ({traditional_wins/total_scenarios:.1%})")
        print(f"   Ties: {ties}/{total_scenarios} ({ties/total_scenarios:.1%})")
        
        # Detailed scenario analysis
        print(f"\n🔍 DETAILED SCENARIO ANALYSIS:")
        for i, result in enumerate(self.evaluation_results, 1):
            print(f"\n   Scenario {i}: {result['scenario_name']}")
            print(f"      Quality: {result['quality_analysis']['overall_quality_score']:.1f}/10")
            print(f"      Relevance: {result['quality_analysis']['relevance_score']:.1f}/10")
            print(f"      Winner: {result['comparison_analysis']['overall_winner'].upper()}")
            
            # Key insights
            rag_advantages = result['comparison_analysis']['rag_advantages']
            if rag_advantages:
                print(f"      RAG Strengths: {', '.join(rag_advantages[:2])}")
        
        # System recommendations
        print(f"\n💡 SYSTEM RECOMMENDATIONS:")
        
        if avg_quality >= 7:
            print(f"   ✅ RAG system performing well (Quality: {avg_quality:.1f}/10)")
        elif avg_quality >= 5:
            print(f"   ⚠️ RAG system needs improvement (Quality: {avg_quality:.1f}/10)")
        else:
            print(f"   ❌ RAG system needs significant improvements (Quality: {avg_quality:.1f}/10)")
        
        if rag_wins > traditional_wins:
            print(f"   ✅ RAG approach is superior to traditional search")
        elif traditional_wins > rag_wins:
            print(f"   ⚠️ Traditional approach outperforming RAG - review embeddings")
        else:
            print(f"   📊 RAG and traditional approaches are comparable")
        
        # Export results
        report_file = f"rag_evaluation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                "evaluation_summary": {
                    "total_scenarios": total_scenarios,
                    "average_quality_score": avg_quality,
                    "average_relevance_score": avg_relevance,
                    "rag_wins": rag_wins,
                    "traditional_wins": traditional_wins,
                    "ties": ties
                },
                "detailed_results": self.evaluation_results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"   📄 Detailed report exported: {report_file}")

def main():
    """Run the comprehensive RAG system evaluation"""
    
    print("🚀 STARTING RAG SYSTEM COMPREHENSIVE EVALUATION")
    print("=" * 70)
    
    evaluator = RAGSystemEvaluator()
    evaluator.run_comprehensive_evaluation()
    
    print(f"\n✅ EVALUATION COMPLETE!")
    print(f"Check the exported JSON report for detailed analysis.")

if __name__ == "__main__":
    main()
