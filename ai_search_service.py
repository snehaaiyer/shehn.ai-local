#!/usr/bin/env python3
"""
AI-Powered Search Service for Wedding Vendor Discovery
Demonstrates how AI enhances search capabilities
"""

import asyncio
import json
from typing import Dict, List, Optional
from ollama_ai_service import ollama_service

class AISearchService:
    """
    AI-Powered Search Service that enhances vendor discovery
    """
    
    def __init__(self):
        self.search_history = []
        self.user_context = {}
    
    async def enhance_search_query(self, user_query: str, user_context: Dict = None) -> Dict:
        """
        Step 1: AI understands and enhances the user's search query
        """
        system_prompt = """You are an AI search enhancement expert.
        
        TASK: Analyze user search query and enhance it for better vendor discovery.
        
        OUTPUT FORMAT:
        {
            "original_query": "user input",
            "enhanced_query": "AI enhanced search terms",
            "search_intent": "what user actually wants",
            "suggested_filters": ["category", "location", "style", "budget_range"],
            "related_terms": ["synonyms", "related keywords"],
            "search_strategy": "specific approach for this query"
        }
        
        BE BRIEF AND ACTIONABLE."""
        
        prompt = f"""
        User Query: {user_query}
        User Context: {json.dumps(user_context or {}, indent=2)}
        
        Enhance this search query for wedding vendor discovery.
        """
        
        try:
            response = await ollama_service._make_request(prompt, system_prompt)
            return json.loads(response)
        except:
            # Fallback to simple enhancement
            return {
                "original_query": user_query,
                "enhanced_query": user_query,
                "search_intent": "vendor search",
                "suggested_filters": [],
                "related_terms": [],
                "search_strategy": "keyword matching"
            }
    
    async def generate_search_strategy(self, enhanced_query: Dict) -> Dict:
        """
        Step 2: AI generates optimal search strategy
        """
        system_prompt = """You are a search strategy expert.
        
        TASK: Create optimal search strategy for wedding vendors.
        
        OUTPUT FORMAT:
        {
            "primary_search": "main search approach",
            "secondary_searches": ["backup search terms"],
            "filter_priority": ["most important filters first"],
            "search_sources": ["database", "external_apis", "recommendations"],
            "ranking_criteria": ["how to rank results"]
        }"""
        
        prompt = f"""
        Enhanced Query: {json.dumps(enhanced_query, indent=2)}
        
        Generate search strategy for finding the best vendors.
        """
        
        try:
            response = await ollama_service._make_request(prompt, system_prompt)
            return json.loads(response)
        except:
            return {
                "primary_search": enhanced_query["enhanced_query"],
                "secondary_searches": [],
                "filter_priority": ["category", "location"],
                "search_sources": ["database"],
                "ranking_criteria": ["rating", "relevance"]
            }
    
    async def rank_search_results(self, vendors: List[Dict], user_query: str, user_context: Dict) -> List[Dict]:
        """
        Step 3: AI ranks search results based on user intent
        """
        system_prompt = """You are a vendor ranking expert.
        
        TASK: Rank vendors based on user query and context.
        
        RANKING CRITERIA:
        - Relevance to user query (40%)
        - Match with user preferences (30%)
        - Quality indicators (20%)
        - Availability and pricing (10%)
        
        OUTPUT: Return vendor IDs in ranked order with brief reasoning."""
        
        prompt = f"""
        User Query: {user_query}
        User Context: {json.dumps(user_context, indent=2)}
        Vendors: {json.dumps(vendors[:10], indent=2)}
        
        Rank these vendors from best to worst match.
        """
        
        try:
            response = await ollama_service._make_request(prompt, system_prompt)
            # Parse ranking and apply to vendors
            ranked_vendors = self._apply_ai_ranking(vendors, response)
            return ranked_vendors
        except:
            return vendors
    
    async def generate_search_suggestions(self, user_query: str, search_results: List[Dict]) -> List[str]:
        """
        Step 4: AI generates follow-up search suggestions
        """
        system_prompt = """You are a search suggestion expert.
        
        TASK: Generate 3-5 follow-up search suggestions based on user query and results.
        
        SUGGESTION TYPES:
        - Refine current search
        - Explore related categories
        - Alternative approaches
        - Budget-friendly options
        
        OUTPUT: List of search suggestions."""
        
        prompt = f"""
        User Query: {user_query}
        Results Count: {len(search_results)}
        
        Generate helpful search suggestions for the user.
        """
        
        try:
            response = await ollama_service._make_request(prompt, system_prompt)
            return [s.strip() for s in response.split('\n') if s.strip()]
        except:
            return [
                f"More {user_query.split()[0]} options",
                f"Budget-friendly {user_query.split()[0]}",
                f"Top-rated {user_query.split()[0]}"
            ]
    
    async def provide_search_insights(self, user_query: str, search_results: List[Dict]) -> Dict:
        """
        Step 5: AI provides insights about search results
        """
        system_prompt = """You are a search insights expert.
        
        TASK: Provide brief insights about search results.
        
        INSIGHTS TO PROVIDE:
        - Price range analysis
        - Quality indicators
        - Popular choices
        - Red flags to watch
        
        OUTPUT FORMAT:
        {
            "price_analysis": "brief price insights",
            "quality_indicators": "what to look for",
            "recommendations": "top 2-3 picks",
            "warnings": "things to avoid"
        }"""
        
        prompt = f"""
        User Query: {user_query}
        Results: {json.dumps(search_results[:5], indent=2)}
        
        Provide brief insights about these results.
        """
        
        try:
            response = await ollama_service._make_request(prompt, system_prompt)
            return json.loads(response)
        except:
            return {
                "price_analysis": f"Found {len(search_results)} options",
                "quality_indicators": "Check reviews and portfolios",
                "recommendations": "Top rated vendors",
                "warnings": "Verify availability and pricing"
            }
    
    def _apply_ai_ranking(self, vendors: List[Dict], ai_ranking: str) -> List[Dict]:
        """Apply AI ranking to vendor list"""
        # Simple implementation - in real app, parse AI ranking properly
        return sorted(vendors, key=lambda x: x.get('rating', 0), reverse=True)
    
    async def full_ai_search(self, user_query: str, user_context: Dict = None) -> Dict:
        """
        Complete AI-powered search workflow
        """
        print(f"🔍 AI Search: '{user_query}'")
        
        # Step 1: Enhance query
        enhanced_query = await self.enhance_search_query(user_query, user_context)
        print(f"📝 Enhanced: {enhanced_query['enhanced_query']}")
        
        # Step 2: Generate strategy
        strategy = await self.generate_search_strategy(enhanced_query)
        print(f"🎯 Strategy: {strategy['primary_search']}")
        
        # Step 3: Mock search results (in real app, this would search databases/APIs)
        mock_vendors = self._generate_mock_vendors(user_query)
        
        # Step 4: Rank results
        ranked_vendors = await self.rank_search_results(mock_vendors, user_query, user_context)
        print(f"🏆 Ranked {len(ranked_vendors)} vendors")
        
        # Step 5: Generate suggestions
        suggestions = await self.generate_search_suggestions(user_query, ranked_vendors)
        print(f"💡 Suggestions: {suggestions[:2]}")
        
        # Step 6: Provide insights
        insights = await self.provide_search_insights(user_query, ranked_vendors)
        print(f"📊 Insights: {insights['price_analysis']}")
        
        return {
            "original_query": user_query,
            "enhanced_query": enhanced_query,
            "search_strategy": strategy,
            "results": ranked_vendors[:5],  # Top 5 results
            "suggestions": suggestions,
            "insights": insights,
            "total_found": len(ranked_vendors)
        }
    
    def _generate_mock_vendors(self, query: str) -> List[Dict]:
        """Generate mock vendors for demonstration"""
        if "photographer" in query.lower():
            return [
                {"id": 1, "name": "Elite Wedding Photography", "rating": 4.8, "price": "₹2-3L", "style": "Candid + Traditional"},
                {"id": 2, "name": "Candid Moments Studio", "rating": 4.6, "price": "₹1.5-2.5L", "style": "Candid"},
                {"id": 3, "name": "Traditional Wedding Photos", "rating": 4.4, "price": "₹1-2L", "style": "Traditional"},
                {"id": 4, "name": "Mumbai Wedding Lens", "rating": 4.7, "price": "₹2.5-4L", "style": "Luxury"},
                {"id": 5, "name": "Heritage Photography", "rating": 4.3, "price": "₹1.2-2L", "style": "Traditional"}
            ]
        elif "venue" in query.lower():
            return [
                {"id": 1, "name": "Taj Palace Mumbai", "rating": 4.9, "price": "₹5-8L", "capacity": "500"},
                {"id": 2, "name": "Grand Hyatt", "rating": 4.7, "price": "₹4-6L", "capacity": "400"},
                {"id": 3, "name": "ITC Maratha", "rating": 4.6, "price": "₹3-5L", "capacity": "300"},
                {"id": 4, "name": "Leela Palace", "rating": 4.8, "price": "₹6-10L", "capacity": "600"},
                {"id": 5, "name": "JW Marriott", "rating": 4.5, "price": "₹3-4L", "capacity": "350"}
            ]
        else:
            return [
                {"id": 1, "name": "Sample Vendor 1", "rating": 4.5, "price": "₹2-3L"},
                {"id": 2, "name": "Sample Vendor 2", "rating": 4.3, "price": "₹1.5-2L"},
                {"id": 3, "name": "Sample Vendor 3", "rating": 4.7, "price": "₹3-4L"}
            ]

# Global instance
ai_search_service = AISearchService()

# Test function
async def test_ai_search():
    """Test the AI search workflow"""
    print("🧪 Testing AI-Powered Search...")
    
    # Test different search queries
    test_queries = [
        "photographer candid traditional mumbai",
        "venue luxury mumbai 500 guests",
        "catering vegetarian mumbai"
    ]
    
    user_context = {
        "budget": "₹5-10L",
        "location": "Mumbai",
        "wedding_type": "Traditional",
        "guest_count": "500"
    }
    
    for query in test_queries:
        print(f"\n{'='*50}")
        result = await ai_search_service.full_ai_search(query, user_context)
        print(f"✅ Search completed for: {query}")
        print(f"📊 Found {result['total_found']} vendors")
        print(f"💡 Top suggestion: {result['suggestions'][0] if result['suggestions'] else 'None'}")

if __name__ == "__main__":
    asyncio.run(test_ai_search()) 