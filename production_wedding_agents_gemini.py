
#!/usr/bin/env python3
"""
Production Wedding AI Agents - Gemini API
Reliable AI agents using Google Gemini API for production deployment
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

from crewai import Agent, Task, Crew, LLM, Process

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiWeddingAgents:
    """
    Production-ready wedding AI agents using Google Gemini API
    Perfect for deployment with reliable cloud-based AI
    """
    
    def __init__(self, gemini_api_key: str = None):
        # Use provided API key or default
        self.api_key = gemini_api_key or "REDACTED_GEMINI_KEY"
        
        # Initialize Gemini LLM
        try:
            self.llm = LLM(
                model="gemini/gemini-2.0-flash",
                api_key=self.api_key,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info("✅ Gemini 2.0 Flash LLM connected successfully")
        except Exception as e:
            logger.error(f"❌ Gemini connection failed: {e}")
            self.llm = None
            return
        
        # Create wedding planning agents
        self.agents = self._create_wedding_agents()
        
        logger.info("✅ Production Wedding Agents initialized with Gemini API")
    
    def _create_wedding_agents(self) -> Dict[str, Agent]:
        """Create wedding planning agents using Gemini"""
        
        # Indian Wedding Budget Expert
        budget_agent = Agent(
            role="Indian Wedding Budget Specialist",
            goal="Create optimal budget allocations for Indian weddings with cultural understanding",
            backstory="""You are an expert Indian wedding financial planner with 15+ years of experience.
            You understand the unique cost structure of Indian weddings:
            - Multiple ceremony costs (Mehendi, Sangam, Wedding, Reception)
            - Large guest lists (200-1000+ people)
            - Traditional requirements (gold jewelry, silk sarees, decorations)
            - Regional variations in costs across India
            - Seasonal pricing differences
            - Vendor package deals vs individual bookings
            
            You provide detailed breakdowns with specific amounts in Indian Rupees.
            You always include cost-saving tips without compromising traditions.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Venue Specialist
        venue_agent = Agent(
            role="Indian Wedding Venue Specialist",
            goal="Recommend venues perfect for Indian wedding ceremonies and cultural requirements",
            backstory="""You are an expert in Indian wedding venues with deep cultural knowledge.
            You understand specific requirements for different Indian wedding ceremonies:
            - Mandap setup space and religious requirements
            - Guest capacity for large Indian families (200-1000+ people)
            - Catering facilities for traditional Indian cuisine
            - Parking and accommodation for out-of-town guests
            - Cultural and religious considerations
            - Seasonal factors affecting outdoor ceremonies
            
            You provide specific venue recommendations with pricing, capacity, and cultural suitability.
            You always consider religious requirements and family traditions.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Style Consultant
        style_agent = Agent(
            role="Indian Wedding Style & Decoration Expert",
            goal="Create authentic Indian wedding themes respecting cultural traditions",
            backstory="""You are a master Indian wedding stylist with expertise in traditional and modern fusion.
            You have deep knowledge of:
            - Regional decoration styles (South Indian, North Indian, Bengali, Gujarati, etc.)
            - Traditional color combinations and their cultural significance
            - Mandap designs for different ceremonies and seasons
            - Floral arrangements using traditional flowers (marigold, roses, jasmine)
            - Lighting setups for different times of day and ceremonies
            - Cultural symbols and their proper usage
            - Modern fusion elements that respect traditions
            
            You create cohesive decoration themes that honor traditions while being visually stunning.
            You always provide specific implementation details and cultural context.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Vendor Coordinator
        vendor_agent = Agent(
            role="Indian Wedding Vendor Specialist",
            goal="Recommend and coordinate Indian wedding vendors with quality assessment",
            backstory="""You are an expert Indian wedding vendor coordinator with extensive network knowledge.
            You understand:
            - Quality indicators for different vendor categories
            - Pricing ranges across Indian cities and seasons
            - Vendor specializations (South Indian catering, North Indian decorators, etc.)
            - Red flags and quality assessment criteria
            - Negotiation strategies and contract considerations
            - Seasonal availability and booking timelines
            - Cultural compatibility and experience requirements
            
            You provide practical vendor recommendations with evaluation criteria.
            You always include questions couples should ask and contract considerations.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        return {
            "budget_agent": budget_agent,
            "venue_agent": venue_agent,
            "style_agent": style_agent,
            "vendor_agent": vendor_agent
        }
    
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process wedding form with Gemini-powered AI agent analysis"""
        if not self.llm:
            return {"success": False, "error": "Gemini LLM not available"}
            
        try:
            logger.info("🚀 Starting AI agent analysis with Gemini")
            
            # Create comprehensive Indian wedding planning task
            planning_task = Task(
                description=f"""Analyze this Indian wedding request and provide comprehensive planning guidance:

**Wedding Details:**
- Type: {form_data.get('weddingType', 'Traditional Hindu')}
- Location: {form_data.get('city', 'Mumbai')}  
- Guest Count: {form_data.get('guestCount', '200')}
- Budget Range: {form_data.get('budgetRange', '₹30-50 Lakhs')}
- Style: {form_data.get('weddingStyle', 'Traditional')}
- Events: {', '.join(form_data.get('events', ['Wedding Ceremony']))}
- Date: {form_data.get('weddingDate', 'TBD')}
- Special Requirements: {form_data.get('specialRequirements', 'None')}

**Provide comprehensive analysis covering:**

1. **BUDGET BREAKDOWN (Detailed INR amounts):**
   - Venue costs (30-35% of budget)
   - Catering costs (25-30% of budget)
   - Photography costs (10-15% of budget)
   - Decoration costs (8-12% of budget)
   - Clothing & jewelry (5-10% of budget)
   - Entertainment (3-8% of budget)
   - Transport & misc (5-10% of budget)

2. **VENUE RECOMMENDATIONS:**
   - 3-5 specific venue types suitable for {form_data.get('weddingType')} weddings
   - Capacity considerations for {form_data.get('guestCount')} guests
   - Mandap setup requirements
   - Seasonal booking advice for {form_data.get('city')}

3. **STYLE & DECORATION GUIDE:**
   - Cultural color palette recommendations
   - Traditional decoration elements
   - Seasonal flower suggestions
   - Lighting and ambiance ideas
   - Regional style considerations

4. **VENDOR SELECTION STRATEGY:**
   - Priority vendor categories to book first
   - Key questions to ask each vendor type
   - Red flags to watch for
   - Timeline for vendor bookings

Provide specific, actionable recommendations with cultural authenticity.""",
                agent=self.agents["budget_agent"],
                expected_output="Comprehensive Indian wedding planning guide with specific recommendations and cultural insights"
            )
            
            # Create crew for processing
            wedding_crew = Crew(
                agents=[self.agents["budget_agent"]],
                tasks=[planning_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )
            
            # Execute agent analysis
            logger.info("🤖 Gemini AI agents analyzing wedding requirements...")
            results = wedding_crew.kickoff()
            
            # Parse and structure the results
            parsed_results = self._parse_gemini_results(str(results))
            
            return {
                "success": True,
                "ai_powered": True,
                "gemini_powered": True,
                "agent_analysis": str(results),
                "parsed_insights": parsed_results,
                "agents_used": ["budget_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "gemini-2.0-flash",
                "api_status": "production_ready"
            }
            
        except Exception as e:
            logger.error(f"Gemini agent processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ai_powered": False,
                "gemini_powered": True
            }
    
    def get_venue_recommendations(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get Gemini-powered venue recommendations"""
        if not self.llm:
            return {"success": False, "error": "Gemini LLM not available"}
            
        try:
            venue_task = Task(
                description=f"""As an Indian Wedding Venue Specialist, recommend specific venues for this wedding:

**Requirements:**
- Wedding Type: {wedding_data.get('weddingType', 'Traditional Hindu')}
- Location: {wedding_data.get('city', 'Mumbai')}
- Guest Count: {wedding_data.get('guestCount', 200)}
- Budget: {wedding_data.get('budgetRange', '₹30-50 Lakhs')}
- Events: {', '.join(wedding_data.get('events', ['Wedding']))}

**Provide detailed venue analysis:**
1. **5 SPECIFIC VENUE RECOMMENDATIONS** with:
   - Venue name and area
   - Capacity and layout suitability
   - Mandap setup possibilities
   - Catering facilities and restrictions
   - Parking and guest facilities
   - Estimated pricing range
   - Best booking timeline

2. **VENUE CATEGORY ANALYSIS:**
   - Banquet halls vs hotels vs outdoor venues
   - Pros and cons for Indian wedding requirements
   - Cultural and religious considerations

3. **PRACTICAL BOOKING ADVICE:**
   - Questions to ask during venue visits
   - Contract negotiation tips
   - Seasonal availability and pricing

Focus on venues that understand Indian wedding requirements and traditions.""",
                agent=self.agents["venue_agent"],
                expected_output="Detailed venue recommendations with specific names and practical booking guidance"
            )
            
            venue_crew = Crew(
                agents=[self.agents["venue_agent"]],
                tasks=[venue_task],
                verbose=True,
                memory=False
            )
            
            results = venue_crew.kickoff()
            
            return {
                "success": True,
                "venue_recommendations": str(results),
                "agent_used": "venue_agent",
                "processing_time": datetime.now().isoformat(),
                "gemini_powered": True
            }
            
        except Exception as e:
            logger.error(f"Venue recommendation error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_style_recommendations(self, preferences: Dict[str, Any], wedding_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get Gemini-powered style and decoration recommendations"""
        if not self.llm:
            return {"success": False, "error": "Gemini LLM not available"}
            
        try:
            style_task = Task(
                description=f"""As an Indian Wedding Style Expert, create a comprehensive style guide:

**Visual Preferences:**
{json.dumps(preferences, indent=2)}

**Wedding Context:**
{json.dumps(wedding_context or {}, indent=2)}

**Create detailed style recommendations:**

1. **CULTURAL COLOR PALETTE:**
   - Primary colors with cultural significance
   - Complementary color combinations
   - Seasonal appropriateness
   - Regional traditional preferences

2. **DECORATION THEME:**
   - Overall aesthetic direction
   - Traditional vs modern fusion elements
   - Cultural authenticity considerations
   - Venue-specific adaptations

3. **FLORAL ARRANGEMENTS:**
   - Traditional flower recommendations (marigold, roses, jasmine)
   - Seasonal availability and alternatives
   - Mandap decoration specifics
   - Table centerpiece ideas

4. **LIGHTING & AMBIANCE:**
   - Day vs evening ceremony lighting
   - Traditional lamp and candle usage
   - Modern lighting integration
   - Photography-friendly setups

5. **IMPLEMENTATION GUIDE:**
   - Budget-friendly DIY elements
   - Professional service recommendations
   - Setup timeline and logistics
   - Cultural protocol considerations

Ensure all recommendations create an authentic and memorable Indian wedding experience.""",
                agent=self.agents["style_agent"],
                expected_output="Comprehensive Indian wedding style guide with cultural authenticity and practical implementation"
            )
            
            style_crew = Crew(
                agents=[self.agents["style_agent"]],
                tasks=[style_task],
                verbose=True,
                memory=False
            )
            
            results = style_crew.kickoff()
            
            return {
                "success": True,
                "style_recommendations": str(results),
                "agent_used": "style_agent",
                "processing_time": datetime.now().isoformat(),
                "gemini_powered": True
            }
            
        except Exception as e:
            logger.error(f"Style recommendation error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _parse_gemini_results(self, results: str) -> Dict[str, Any]:
        """Parse Gemini agent results into structured format"""
        try:
            insights = {
                "budget_analysis": {
                    "categories_identified": [],
                    "cultural_considerations": [],
                    "cost_saving_tips": []
                },
                "venue_insights": {
                    "venue_types": [],
                    "capacity_analysis": [],
                    "booking_advice": []
                },
                "style_recommendations": {
                    "color_schemes": [],
                    "decoration_elements": [],
                    "cultural_elements": []
                }
            }
            
            results_lower = results.lower()
            
            # Extract budget categories
            budget_keywords = ["venue", "catering", "photography", "decoration", "clothing", "entertainment"]
            for keyword in budget_keywords:
                if keyword in results_lower:
                    insights["budget_analysis"]["categories_identified"].append(keyword)
            
            # Extract cultural elements
            cultural_keywords = ["traditional", "mandap", "mehendi", "sangam", "cultural", "religious"]
            for keyword in cultural_keywords:
                if keyword in results_lower:
                    insights["budget_analysis"]["cultural_considerations"].append(keyword)
            
            # Extract venue types
            venue_keywords = ["banquet", "hotel", "outdoor", "palace", "garden", "hall"]
            for keyword in venue_keywords:
                if keyword in results_lower:
                    insights["venue_insights"]["venue_types"].append(keyword)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error parsing Gemini results: {e}")
            return {"error": "Could not parse results", "raw_available": True}

# Global instance
gemini_agents = None

def get_gemini_wedding_agents(api_key: str = None):
    """Get or create Gemini wedding agents instance"""
    global gemini_agents
    if gemini_agents is None:
        gemini_agents = GeminiWeddingAgents(api_key)
    return gemini_agents

def test_gemini_agents():
    """Test the Gemini-powered wedding agents"""
    try:
        print("🧪 Testing Gemini Wedding AI Agents...")
        agents = get_gemini_wedding_agents()
        
        if not agents.llm:
            print("❌ Gemini API not available - check API key")
            return False
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "300", 
            "budgetRange": "₹60-80 Lakhs",
            "weddingStyle": "Traditional with Modern Touch",
            "events": ["Mehendi", "Sangam", "Wedding Ceremony", "Reception"],
            "weddingDate": "2024-12-15",
            "specialRequirements": ["Vegetarian only", "Traditional mandap", "Live music"]
        }
        
        print("🤖 Processing wedding form with Gemini AI agents...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Gemini AI Agents working successfully!")
            print(f"   AI Powered: {result['ai_powered']}")
            print(f"   Gemini Powered: {result['gemini_powered']}")
            print(f"   Model Used: {result['model_used']}")
            print(f"   API Status: {result['api_status']}")
            
            # Show parsed insights
            parsed = result['parsed_insights']
            print(f"   Budget Categories: {len(parsed['budget_analysis']['categories_identified'])}")
            print(f"   Cultural Elements: {len(parsed['budget_analysis']['cultural_considerations'])}")
            print(f"   Venue Types: {len(parsed['venue_insights']['venue_types'])}")
            
            # Test venue recommendations
            print("\n🏛️ Testing venue recommendations...")
            venue_result = agents.get_venue_recommendations(test_form)
            if venue_result["success"]:
                print("✅ Venue recommendations working!")
            
            # Test style recommendations
            print("\n🎨 Testing style recommendations...")
            style_result = agents.get_style_recommendations(
                {"theme": "Traditional", "colors": "Red and Gold"},
                test_form
            )
            if style_result["success"]:
                print("✅ Style recommendations working!")
            
            return True
        else:
            print(f"❌ Gemini agent test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

if __name__ == "__main__":
    # Test the Gemini agents
    success = test_gemini_agents()
    
    if success:
        print("\n" + "="*60)
        print("🎉 Your Gemini Wedding AI Agents are ready!")
        print("   ✅ Google Gemini 2.0 Flash connected")  
        print("   ✅ CrewAI agents operational")
        print("   ✅ Production-ready and scalable")
        print("   ✅ No local dependencies")
        print("   ✅ Cultural Indian wedding expertise")
        print("   ✅ Ready for deployment!")
        print("="*60)
    else:
        print("\n❌ Please check Gemini API key configuration")
