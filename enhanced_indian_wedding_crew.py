#!/usr/bin/env python3
"""
Enhanced Indian Wedding Planner CrewAI Structure
Specialized for Indian wedding traditions, vendors, and requirements
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

from crewai import Agent, Task, Crew, LLM, Process
from crewai_tools import SerperDevTool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IndianWeddingPlannerCrew:
    """
    Enhanced CrewAI structure for Indian wedding planning
    Specialized agents with domain knowledge and cultural understanding
    """
    
    def __init__(self, serper_api_key: str = None):
        # Ensure no OpenAI interference
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
            
        # Initialize Ollama LLM with better configuration
        try:
            self.llm = LLM(
                model="ollama/crewai-nous-hermes:latest",
                base_url="http://localhost:11434",
                api_key="ollama",
                temperature=0.7,  # More creative responses
                max_tokens=2000   # Longer responses
            )
            logger.info("✅ Enhanced Ollama LLM connected")
        except Exception as e:
            logger.error(f"❌ Ollama connection failed: {e}")
            self.llm = None
            return
        
        # Initialize search tool
        self.search_available = False
        if serper_api_key:
            try:
                os.environ["SERPER_API_KEY"] = serper_api_key
                self.search_tool = SerperDevTool()
                self.search_available = True
                logger.info("✅ Serper search enabled for vendor research")
            except Exception as e:
                logger.warning(f"⚠️ Serper not available: {e}")
                self.search_tool = None
        else:
            self.search_tool = None
        
        # Create specialized Indian wedding agents
        self.agents = self._create_indian_wedding_agents()
        
        # Indian wedding knowledge base
        self.indian_wedding_knowledge = self._load_indian_wedding_knowledge()
        
        logger.info("✅ Enhanced Indian Wedding Planner Crew initialized")
    
    def _create_indian_wedding_agents(self) -> Dict[str, Agent]:
        """Create specialized agents for Indian wedding planning"""
        
        tools = [self.search_tool] if self.search_available else []
        
        # Indian Wedding Venue Specialist
        venue_specialist = Agent(
            role="Indian Wedding Venue Specialist",
            goal="Find and recommend venues perfect for Indian wedding ceremonies and receptions",
            backstory="""You are an expert in Indian wedding venues with 15+ years of experience.
            You understand the specific requirements for different Indian wedding ceremonies:
            - Mandap setup space and requirements
            - Guest capacity for large Indian families
            - Catering facilities for traditional Indian cuisine
            - Parking and accommodation for out-of-town guests
            - Cultural and religious considerations
            - Seasonal factors affecting outdoor ceremonies
            
            You know venues across major Indian cities and their specialties.
            You always provide specific venue names, capacity, pricing, and booking advice.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=3
        )
        
        # Indian Wedding Budget Expert
        budget_expert = Agent(
            role="Indian Wedding Budget Expert",
            goal="Create realistic budget allocations for Indian weddings based on traditions and scale",
            backstory="""You are a financial expert specializing in Indian wedding budgets.
            You understand the unique cost structure of Indian weddings:
            - Multiple ceremony costs (Mehendi, Sangam, Wedding, Reception)
            - Large guest lists (200-1000+ people)
            - Traditional requirements (gold jewelry, silk sarees, decorations)
            - Regional variations in costs across India
            - Seasonal pricing differences
            - Vendor package deals vs individual bookings
            
            You provide detailed breakdowns with specific amounts in Indian Rupees.
            You always include cost-saving tips without compromising traditions.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=3
        )
        
        # Traditional Indian Wedding Decorator
        decoration_expert = Agent(
            role="Traditional Indian Wedding Decorator",
            goal="Design authentic Indian wedding decorations respecting cultural traditions",
            backstory="""You are a master decorator specializing in traditional Indian weddings.
            You have deep knowledge of:
            - Regional decoration styles (South Indian, North Indian, Bengali, Gujarati, etc.)
            - Traditional color combinations and their significance
            - Mandap designs for different ceremonies
            - Floral arrangements using traditional flowers (marigold, roses, jasmine)
            - Lighting setups for different times of day
            - Cultural symbols and their proper usage
            - Seasonal flower availability and pricing
            
            You create cohesive decoration themes that honor traditions while being visually stunning.
            You always provide specific flower types, color schemes, and decoration elements.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=3
        )
        
        # Indian Wedding Catering Specialist
        catering_specialist = Agent(
            role="Indian Wedding Catering Specialist", 
            goal="Plan authentic Indian wedding menus considering dietary restrictions and traditions",
            backstory="""You are an expert in Indian wedding catering with knowledge of:
            - Regional Indian cuisines and their wedding specialties
            - Vegetarian and Jain dietary requirements
            - Traditional wedding feast courses and timing
            - Seasonal menu planning and ingredient availability
            - Large-scale cooking for 200-1000+ guests
            - Traditional serving styles and presentation
            - Religious dietary considerations for different communities
            - Cost-effective menu planning without compromising quality
            
            You create detailed menus with specific dishes, quantities, and serving suggestions.
            You always consider the cultural significance of foods in wedding celebrations.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=3
        )
        
        # Indian Wedding Timeline Coordinator
        timeline_coordinator = Agent(
            role="Indian Wedding Timeline Coordinator",
            goal="Create comprehensive timelines for multi-day Indian wedding celebrations",
            backstory="""You are an expert coordinator for Indian wedding celebrations.
            You understand the complexity of Indian weddings:
            - Multiple ceremonies over several days
            - Auspicious timing (muhurat) considerations
            - Family coordination and logistics
            - Vendor scheduling across multiple events
            - Guest management for large families
            - Traditional ceremony sequences and duration
            - Regional variations in wedding customs
            - Seasonal considerations and weather planning
            
            You create detailed day-by-day, hour-by-hour schedules.
            You always include buffer time and contingency planning.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=3
        )
        
        return {
            "venue_specialist": venue_specialist,
            "budget_expert": budget_expert,  
            "decoration_expert": decoration_expert,
            "catering_specialist": catering_specialist,
            "timeline_coordinator": timeline_coordinator
        }
    
    def _load_indian_wedding_knowledge(self) -> Dict[str, Any]:
        """Load Indian wedding domain knowledge"""
        return {
            "typical_budget_breakdown": {
                "venue": "25-35%",
                "catering": "30-40%", 
                "decoration": "10-15%",
                "photography": "8-12%",
                "clothing_jewelry": "10-15%",
                "music_entertainment": "5-8%",
                "miscellaneous": "5-10%"
            },
            "common_ceremonies": [
                "Engagement", "Mehendi", "Sangam", "Haldi", 
                "Wedding Ceremony", "Reception", "Griha Pravesh"
            ],
            "traditional_colors": {
                "auspicious": ["Red", "Gold", "Orange", "Yellow"],
                "combinations": ["Red & Gold", "Pink & Orange", "Yellow & Red"]
            },
            "typical_guest_counts": {
                "small": "100-200",
                "medium": "200-500", 
                "large": "500-1000+",
                "intimate": "50-100"
            },
            "seasonal_considerations": {
                "winter": "Peak season, higher costs, better weather",
                "summer": "Off-season, lower costs, indoor venues preferred",
                "monsoon": "Lowest costs, indoor venues essential"
            }
        }
    
    def get_comprehensive_wedding_plan(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get a comprehensive Indian wedding plan using all specialized agents"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            logger.info("🎊 Starting comprehensive Indian wedding planning...")
            
            # Extract key information
            wedding_type = wedding_data.get('weddingType', 'Traditional Hindu')
            city = wedding_data.get('city', 'Mumbai')
            budget = wedding_data.get('budgetRange', '₹50-70 Lakhs')
            guests = wedding_data.get('guestCount', 200)
            events = wedding_data.get('events', ['Wedding Ceremony', 'Reception'])
            
            # Create specialized tasks for Indian wedding planning
            venue_task = Task(
                description=f"""As an Indian Wedding Venue Specialist, recommend 5 specific venues in {city} for a {wedding_type} wedding.

REQUIREMENTS:
- Guest capacity: {guests} people
- Budget range: {budget}
- Events: {', '.join(events)}
- Must accommodate traditional mandap setup
- Need catering facilities for Indian cuisine

PROVIDE SPECIFIC RECOMMENDATIONS:
1. Venue name and location
2. Capacity and facilities
3. Pricing range
4. Mandap setup options
5. Catering capabilities
6. Parking and accommodation
7. Best months to book
8. Contact information if known

Focus on venues that understand Indian wedding requirements.""",
                agent=self.agents["venue_specialist"],
                expected_output="List of 5 specific venues with detailed information for Indian wedding requirements"
            )
            
            budget_task = Task(
                description=f"""As an Indian Wedding Budget Expert, create a detailed budget breakdown for this {wedding_type} wedding.

WEDDING DETAILS:
- Total Budget: {budget}
- Guest Count: {guests}
- Location: {city}
- Events: {', '.join(events)}

CREATE DETAILED BREAKDOWN:
1. Venue costs (25-35% of budget)
2. Catering costs (30-40% of budget) 
3. Decoration costs (10-15% of budget)
4. Photography/videography (8-12% of budget)
5. Clothing & jewelry (10-15% of budget)
6. Music & entertainment (5-8% of budget)
7. Miscellaneous (5-10% of budget)

For each category, provide:
- Specific amount in Rupees
- What's included
- Cost-saving tips
- Regional pricing factors

Include seasonal pricing advice and booking timeline recommendations.""",
                agent=self.agents["budget_expert"],
                expected_output="Detailed budget breakdown with specific amounts and cost-saving recommendations"
            )
            
            decoration_task = Task(
                description=f"""As a Traditional Indian Wedding Decorator, design a complete decoration plan for this {wedding_type} wedding.

REQUIREMENTS:
- Wedding type: {wedding_type}
- Guest count: {guests}
- Events: {', '.join(events)}
- Location: {city}

DESIGN COMPREHENSIVE DECORATION PLAN:
1. Overall theme and color scheme
2. Mandap design and setup
3. Entrance decoration
4. Stage decoration for each event
5. Floral arrangements and types
6. Lighting setup for day/evening events
7. Traditional elements and symbols
8. Seating area decoration

For each element, specify:
- Specific flowers and colors
- Traditional significance
- Estimated costs
- Setup timeline
- Vendor requirements

Ensure cultural authenticity while creating visual appeal.""",
                agent=self.agents["decoration_expert"],
                expected_output="Complete decoration plan with traditional elements, colors, and cultural significance"
            )
            
            # Execute tasks in parallel for efficiency
            wedding_crew = Crew(
                agents=[
                    self.agents["venue_specialist"],
                    self.agents["budget_expert"], 
                    self.agents["decoration_expert"]
                ],
                tasks=[venue_task, budget_task, decoration_task],
                verbose=True,
                process=Process.sequential,  # Sequential for better context sharing
                memory=False
            )
            
            # Execute the crew
            results = wedding_crew.kickoff()
            
            # Parse and structure results
            parsed_results = self._parse_comprehensive_results(str(results))
            
            return {
                "success": True,
                "wedding_type": wedding_type,
                "location": city,
                "budget_range": budget,
                "guest_count": guests,
                "comprehensive_plan": parsed_results,
                "indian_wedding_knowledge": self.indian_wedding_knowledge,
                "agents_used": ["venue_specialist", "budget_expert", "decoration_expert"],
                "search_enabled": self.search_available,
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive planning: {e}")
            return {"error": str(e)}
    
    def get_catering_menu_plan(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get specialized Indian wedding catering recommendations"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            catering_task = Task(
                description=f"""As an Indian Wedding Catering Specialist, create a complete menu plan for this wedding.

WEDDING DETAILS:
- Type: {wedding_data.get('weddingType', 'Traditional Hindu')}
- Guest Count: {wedding_data.get('guestCount', 200)}
- Events: {', '.join(wedding_data.get('events', ['Wedding', 'Reception']))}
- Budget: {wedding_data.get('budgetRange', '₹50-70 Lakhs')}
- Location: {wedding_data.get('city', 'Mumbai')}

CREATE DETAILED MENU PLAN:
1. Welcome drinks and snacks
2. Main course options (vegetarian focus)
3. Traditional sweets and desserts
4. Regional specialties
5. Live cooking stations
6. Dietary accommodation (Jain, vegan)
7. Beverage options
8. Serving style recommendations

For each menu item, include:
- Specific dish names
- Portion calculations for guest count
- Cost estimates
- Preparation timeline
- Serving suggestions
- Cultural significance where relevant

Focus on authentic Indian flavors while ensuring variety and dietary inclusivity.""",
                agent=self.agents["catering_specialist"],
                expected_output="Complete Indian wedding menu with specific dishes, quantities, and cultural context"
            )
            
            catering_crew = Crew(
                agents=[self.agents["catering_specialist"]],
                tasks=[catering_task],
                verbose=True,
                memory=False
            )
            
            results = catering_crew.kickoff()
            
            return {
                "success": True,
                "catering_plan": str(results),
                "agent_used": "catering_specialist",
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in catering planning: {e}")
            return {"error": str(e)}
    
    def get_timeline_schedule(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed timeline for multi-day Indian wedding"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            timeline_task = Task(
                description=f"""As an Indian Wedding Timeline Coordinator, create a detailed schedule for this multi-day celebration.

WEDDING DETAILS:
- Type: {wedding_data.get('weddingType', 'Traditional Hindu')}
- Events: {', '.join(wedding_data.get('events', ['Wedding', 'Reception']))}
- Guest Count: {wedding_data.get('guestCount', 200)}
- Wedding Date: {wedding_data.get('weddingDate', 'TBD')}
- Location: {wedding_data.get('city', 'Mumbai')}

CREATE COMPREHENSIVE TIMELINE:
1. Pre-wedding events (2-3 days before)
   - Mehendi ceremony timing and setup
   - Sangam/Haldi ceremony schedule
   - Family gathering coordination

2. Wedding day schedule
   - Morning preparations
   - Ceremony timing (consider muhurat)
   - Photography sessions
   - Guest management
   - Vendor coordination

3. Reception day (if separate)
   - Setup and decoration
   - Guest arrival management
   - Entertainment schedule
   - Dinner service timing

For each event, provide:
- Specific start and end times
- Setup requirements and duration
- Vendor coordination points
- Family responsibility assignments
- Buffer time for delays
- Contingency planning

Include traditional timing considerations and cultural requirements.""",
                agent=self.agents["timeline_coordinator"],
                expected_output="Detailed day-by-day timeline with specific timings and coordination requirements"
            )
            
            timeline_crew = Crew(
                agents=[self.agents["timeline_coordinator"]],
                tasks=[timeline_task],
                verbose=True,
                memory=False
            )
            
            results = timeline_crew.kickoff()
            
            return {
                "success": True,
                "timeline_schedule": str(results),
                "agent_used": "timeline_coordinator", 
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in timeline planning: {e}")
            return {"error": str(e)}
    
    def _parse_comprehensive_results(self, results: str) -> Dict[str, Any]:
        """Parse comprehensive wedding planning results"""
        try:
            # Enhanced parsing for Indian wedding specific content
            parsed = {
                "venue_recommendations": [],
                "budget_breakdown": {},
                "decoration_plan": [],
                "key_insights": [],
                "cultural_considerations": []
            }
            
            lines = results.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Identify sections
                if any(keyword in line.lower() for keyword in ['venue', 'hall', 'location']):
                    current_section = 'venues'
                elif any(keyword in line.lower() for keyword in ['budget', 'cost', 'price', 'rupees']):
                    current_section = 'budget'
                elif any(keyword in line.lower() for keyword in ['decoration', 'mandap', 'flower']):
                    current_section = 'decoration'
                elif any(keyword in line.lower() for keyword in ['insight', 'tip', 'recommendation']):
                    current_section = 'insights'
                
                # Parse content based on section
                if current_section == 'venues' and line:
                    parsed["venue_recommendations"].append(line)
                elif current_section == 'budget' and ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        parsed["budget_breakdown"][parts[0].strip()] = parts[1].strip()
                elif current_section == 'decoration' and line:
                    parsed["decoration_plan"].append(line)
                elif current_section == 'insights' and line:
                    parsed["key_insights"].append(line)
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing results: {e}")
            return {"raw_results": results, "parsing_error": str(e)}

# Global instance
enhanced_indian_crew = None

def get_enhanced_indian_wedding_crew(serper_api_key: str = None):
    """Get or create enhanced Indian wedding crew instance"""
    global enhanced_indian_crew
    if enhanced_indian_crew is None:
        enhanced_indian_crew = IndianWeddingPlannerCrew(serper_api_key)
    return enhanced_indian_crew

def test_enhanced_indian_wedding_system():
    """Test the enhanced Indian wedding planning system"""
    print("🎊 TESTING ENHANCED INDIAN WEDDING PLANNER CREWAI")
    print("="*60)
    
    # Test with realistic Indian wedding data
    test_data = {
        "weddingType": "Traditional Hindu",
        "city": "Mumbai", 
        "budgetRange": "₹60-80 Lakhs",
        "guestCount": 300,
        "events": ["Mehendi", "Sangam", "Wedding Ceremony", "Reception"],
        "weddingDate": "2024-12-15",
        "priorities": ["Venue", "Catering", "Decoration"],
        "specialRequirements": ["Vegetarian only", "Traditional mandap", "Live music"]
    }
    
    try:
        # Initialize enhanced crew
        crew = get_enhanced_indian_wedding_crew("19dd65af8ee73ed572d5b91d25a32d01eec1a31f")
        
        if not crew.llm:
            print("❌ Ollama not available - please start: ollama serve")
            return False
        
        print("✅ Enhanced Indian Wedding Crew initialized")
        print(f"   Specialized Agents: {list(crew.agents.keys())}")
        print(f"   Search Enabled: {crew.search_available}")
        print(f"   Domain Knowledge: {list(crew.indian_wedding_knowledge.keys())}")
        
        print("\n🎯 Getting comprehensive wedding plan...")
        result = crew.get_comprehensive_wedding_plan(test_data)
        
        if result.get("success"):
            print("✅ Enhanced system working!")
            print(f"   Wedding Type: {result.get('wedding_type')}")
            print(f"   Location: {result.get('location')}")
            print(f"   Budget: {result.get('budget_range')}")
            print(f"   Agents Used: {result.get('agents_used')}")
            
            # Show structured results
            plan = result.get('comprehensive_plan', {})
            print(f"   Venue Recommendations: {len(plan.get('venue_recommendations', []))}")
            print(f"   Budget Categories: {len(plan.get('budget_breakdown', {}))}")
            print(f"   Decoration Elements: {len(plan.get('decoration_plan', []))}")
            
            return True
        else:
            print(f"❌ Planning failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_enhanced_indian_wedding_system()
    
    if success:
        print("\n" + "="*60)
        print("🎉 ENHANCED INDIAN WEDDING PLANNER READY!")
        print("   ✅ 5 Specialized Indian Wedding Agents")
        print("   ✅ Cultural domain knowledge integrated")
        print("   ✅ Multi-ceremony planning capability")
        print("   ✅ Regional customization support")
        print("   ✅ Traditional requirement understanding")
        print("   ✅ Comprehensive planning workflows")
        print("="*60)
    else:
        print("\n❌ Please check Ollama setup") 