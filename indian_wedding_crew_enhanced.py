#!/usr/bin/env python3
"""
Enhanced Indian Wedding Planner CrewAI Structure
Specialized for Indian wedding traditions with domain-specific knowledge
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

class EnhancedIndianWeddingCrew:
    """
    Enhanced CrewAI structure specifically designed for Indian wedding planning
    with cultural knowledge and domain expertise
    """
    
    def __init__(self):
        # Ensure no OpenAI interference
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
            
        # Initialize Ollama LLM with enhanced configuration
        try:
            self.llm = LLM(
                model="ollama/crewai-nous-hermes:latest",
                base_url="http://localhost:11434",
                api_key="ollama"
            )
            logger.info("✅ Enhanced Ollama LLM connected for Indian wedding planning")
        except Exception as e:
            logger.error(f"❌ Ollama connection failed: {e}")
            self.llm = None
            return
        
        # Load Indian wedding domain knowledge
        self.indian_wedding_knowledge = self._load_domain_knowledge()
        
        # Create specialized agents
        self.agents = self._create_specialized_agents()
        
        logger.info("✅ Enhanced Indian Wedding Crew initialized with domain expertise")
    
    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """Load comprehensive Indian wedding domain knowledge"""
        return {
            "venue_requirements": {
                "mandap_space": "Minimum 20x20 feet for traditional setup",
                "guest_seating": "Calculate 8-10 sq ft per person for Indian seating",
                "catering_space": "Large kitchen facilities for Indian cuisine",
                "parking": "Minimum 1 car space per 4 guests",
                "accommodation": "Guest rooms for out-of-town family"
            },
            "budget_distribution": {
                "venue": "25-35%",
                "catering": "30-40%",
                "decoration": "10-15%", 
                "photography": "8-12%",
                "clothing_jewelry": "10-15%",
                "music_entertainment": "5-8%",
                "miscellaneous": "5-10%"
            },
            "traditional_elements": {
                "colors": ["Red", "Gold", "Orange", "Yellow", "Pink"],
                "flowers": ["Marigold", "Rose", "Jasmine", "Lotus", "Mango leaves"],
                "decorations": ["Kalash", "Toran", "Rangoli", "Diyas", "Banana trees"],
                "ceremonies": ["Mehendi", "Sangam", "Haldi", "Wedding", "Reception"]
            },
            "regional_specialties": {
                "North Indian": {
                    "colors": ["Red", "Gold"],
                    "food": ["Paneer dishes", "Naan", "Biryani"],
                    "traditions": ["Baraat", "Saat Phere"]
                },
                "South Indian": {
                    "colors": ["Red", "Yellow", "Gold"],
                    "food": ["Sambar", "Rasam", "Coconut rice"],
                    "traditions": ["Mangalsutra", "Saptapadi"]
                },
                "Gujarati": {
                    "colors": ["Red", "Yellow", "Orange"],
                    "food": ["Dhokla", "Thepla", "Gujarati thali"],
                    "traditions": ["Garba", "Pithi ceremony"]
                }
            },
            "seasonal_planning": {
                "winter": {
                    "months": ["Nov", "Dec", "Jan", "Feb"],
                    "advantages": ["Pleasant weather", "Outdoor ceremonies possible"],
                    "pricing": "Peak season - 20-30% higher costs"
                },
                "summer": {
                    "months": ["Mar", "Apr", "May"],
                    "advantages": ["Lower venue costs", "Better vendor availability"],
                    "considerations": ["Indoor venues preferred", "AC requirements"]
                },
                "monsoon": {
                    "months": ["Jun", "Jul", "Aug", "Sep"],
                    "advantages": ["Lowest costs", "Easy booking"],
                    "considerations": ["Indoor venues only", "Backup plans essential"]
                }
            }
        }
    
    def _create_specialized_agents(self) -> Dict[str, Agent]:
        """Create domain-expert agents for Indian wedding planning"""
        
        # Indian Wedding Venue Expert
        venue_expert = Agent(
            role="Indian Wedding Venue Expert",
            goal="Recommend perfect venues for Indian wedding ceremonies with cultural understanding",
            backstory=f"""You are a venue specialist with 15+ years of experience in Indian weddings.
            You have deep knowledge of venue requirements for Indian ceremonies:
            
            VENUE KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['venue_requirements'], indent=2)}
            
            You understand that Indian weddings need:
            - Space for mandap setup and traditional ceremonies
            - Large catering facilities for authentic Indian cuisine
            - Accommodation for extended family
            - Parking for large guest lists
            - Cultural sensitivity and flexibility
            
            You always provide specific venue names, exact capacities, pricing ranges, and practical advice.
            You consider regional preferences and seasonal factors.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Budget Specialist
        budget_specialist = Agent(
            role="Indian Wedding Budget Specialist", 
            goal="Create realistic and detailed budget plans for Indian weddings",
            backstory=f"""You are a financial expert specializing in Indian wedding budgets.
            You understand the unique cost structure:
            
            BUDGET DISTRIBUTION KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['budget_distribution'], indent=2)}
            
            SEASONAL PRICING KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['seasonal_planning'], indent=2)}
            
            You know that Indian weddings have:
            - Multiple ceremonies requiring separate budgets
            - Large guest counts affecting all costs
            - Traditional requirements that cannot be compromised
            - Regional cost variations across India
            - Seasonal pricing fluctuations
            
            You always provide specific amounts in Indian Rupees with detailed breakdowns.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Traditional Indian Decoration Expert
        decoration_expert = Agent(
            role="Traditional Indian Decoration Expert",
            goal="Design authentic Indian wedding decorations respecting cultural traditions",
            backstory=f"""You are a master decorator specializing in traditional Indian weddings.
            You have comprehensive knowledge of cultural elements:
            
            TRADITIONAL DECORATION KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['traditional_elements'], indent=2)}
            
            REGIONAL SPECIALTIES:
            {json.dumps(self.indian_wedding_knowledge['regional_specialties'], indent=2)}
            
            You understand:
            - Cultural significance of colors and symbols
            - Traditional flower arrangements and their meanings
            - Regional decoration styles and customs
            - Seasonal flower availability and pricing
            - Mandap designs for different ceremonies
            
            You create decoration plans that honor traditions while being visually stunning.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Catering Expert
        catering_expert = Agent(
            role="Indian Wedding Catering Expert",
            goal="Plan authentic Indian wedding menus with cultural sensitivity",
            backstory=f"""You are a catering expert with deep knowledge of Indian cuisine and wedding traditions.
            
            REGIONAL CUISINE KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['regional_specialties'], indent=2)}
            
            You understand:
            - Regional Indian cuisines and their wedding specialties
            - Vegetarian, Jain, and other dietary requirements
            - Traditional wedding feast courses and timing
            - Large-scale cooking for 200-1000+ guests
            - Religious dietary considerations
            - Seasonal ingredient availability and pricing
            
            You create detailed menus with specific dishes, quantities, and cultural significance.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Indian Wedding Timeline Coordinator
        timeline_coordinator = Agent(
            role="Indian Wedding Timeline Coordinator",
            goal="Create comprehensive schedules for multi-day Indian wedding celebrations",
            backstory=f"""You are an expert coordinator for Indian wedding celebrations.
            
            CEREMONY KNOWLEDGE:
            {json.dumps(self.indian_wedding_knowledge['traditional_elements']['ceremonies'], indent=2)}
            
            You understand:
            - Multiple ceremonies spanning several days
            - Auspicious timing (muhurat) considerations
            - Family coordination for large extended families
            - Vendor scheduling across multiple events
            - Traditional ceremony sequences and duration
            - Regional variations in wedding customs
            
            You create detailed timelines with buffer time and contingency planning.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        return {
            "venue_expert": venue_expert,
            "budget_specialist": budget_specialist,
            "decoration_expert": decoration_expert,
            "catering_expert": catering_expert,
            "timeline_coordinator": timeline_coordinator
        }
    
    def get_comprehensive_indian_wedding_plan(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get a complete Indian wedding plan using specialized agents"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            logger.info("🎊 Creating comprehensive Indian wedding plan...")
            
            # Extract wedding details
            wedding_type = wedding_data.get('weddingType', 'Traditional Hindu')
            city = wedding_data.get('city', 'Mumbai')
            budget = wedding_data.get('budgetRange', '₹50-70 Lakhs')
            guests = wedding_data.get('guestCount', 200)
            events = wedding_data.get('events', ['Wedding Ceremony', 'Reception'])
            
            # Create enhanced venue task
            venue_task = Task(
                description=f"""As an Indian Wedding Venue Expert, recommend 5 specific venues in {city} for a {wedding_type} wedding.

WEDDING REQUIREMENTS:
- Guest capacity: {guests} people
- Budget range: {budget}
- Events: {', '.join(events)}
- Wedding type: {wedding_type}

Using your expertise in Indian wedding venues, provide detailed recommendations:

VENUE RECOMMENDATIONS (provide 5 specific venues):
1. [Venue Name] - [Location]
   - Capacity: [exact number] guests
   - Mandap space: [dimensions and setup options]
   - Catering facilities: [kitchen capacity and cuisine types]
   - Pricing: [range in Rupees]
   - Best for: [type of ceremonies]
   - Parking: [capacity]
   - Contact: [if known]

2. [Continue for 5 venues]

BOOKING ADVICE:
- Best months to book based on season
- Advance booking timeline
- Negotiation tips
- Package deals available

Focus on venues that understand Indian wedding requirements and cultural needs.""",
                agent=self.agents["venue_expert"],
                expected_output="List of 5 specific venues with complete details for Indian wedding requirements"
            )
            
            # Create enhanced budget task  
            budget_task = Task(
                description=f"""As an Indian Wedding Budget Specialist, create a detailed budget breakdown for this {wedding_type} wedding.

WEDDING DETAILS:
- Total Budget: {budget}
- Guest Count: {guests}
- Location: {city}
- Events: {', '.join(events)}
- Wedding Type: {wedding_type}

Create a comprehensive budget plan:

DETAILED BUDGET BREAKDOWN:
1. Venue (25-35% of budget)
   - Amount: ₹[specific amount]
   - Includes: [what's covered]
   - Tips: [cost-saving advice]

2. Catering (30-40% of budget)
   - Amount: ₹[specific amount]
   - Per person cost: ₹[amount]
   - Includes: [menu items and service]
   - Tips: [cost optimization]

3. Decoration (10-15% of budget)
   - Amount: ₹[specific amount]
   - Includes: [mandap, flowers, lighting]
   - Tips: [seasonal savings]

4. Photography/Videography (8-12% of budget)
   - Amount: ₹[specific amount]
   - Includes: [coverage and deliverables]

5. Clothing & Jewelry (10-15% of budget)
   - Amount: ₹[specific amount]
   - For: [bride, groom, family]

6. Music & Entertainment (5-8% of budget)
   - Amount: ₹[specific amount]
   - Includes: [DJ, band, dancers]

7. Miscellaneous (5-10% of budget)
   - Amount: ₹[specific amount]
   - Includes: [transport, gifts, etc.]

COST-SAVING STRATEGIES:
- Seasonal booking advantages
- Package deal opportunities
- DIY elements that can reduce costs
- Priority allocation based on family preferences

Provide specific amounts in Indian Rupees for a {guests}-guest wedding in {city}.""",
                agent=self.agents["budget_specialist"],
                expected_output="Detailed budget breakdown with specific amounts and cost-saving strategies"
            )
            
            # Execute tasks
            planning_crew = Crew(
                agents=[self.agents["venue_expert"], self.agents["budget_specialist"]],
                tasks=[venue_task, budget_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )
            
            results = planning_crew.kickoff()
            
            # Structure the results
            return {
                "success": True,
                "wedding_type": wedding_type,
                "location": city,
                "budget_range": budget,
                "guest_count": guests,
                "events": events,
                "comprehensive_plan": str(results),
                "domain_knowledge_used": list(self.indian_wedding_knowledge.keys()),
                "agents_used": ["venue_expert", "budget_specialist"],
                "cultural_considerations": self.indian_wedding_knowledge['traditional_elements'],
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive planning: {e}")
            return {"error": str(e)}
    
    def get_decoration_plan(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get specialized Indian wedding decoration plan"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            decoration_task = Task(
                description=f"""As a Traditional Indian Decoration Expert, create a complete decoration plan for this {wedding_data.get('weddingType', 'Traditional Hindu')} wedding.

WEDDING DETAILS:
- Type: {wedding_data.get('weddingType', 'Traditional Hindu')}
- Guest Count: {wedding_data.get('guestCount', 200)}
- Events: {', '.join(wedding_data.get('events', ['Wedding', 'Reception']))}
- Location: {wedding_data.get('city', 'Mumbai')}
- Budget: {wedding_data.get('budgetRange', '₹50-70 Lakhs')}

Create a comprehensive decoration plan:

TRADITIONAL DECORATION PLAN:

1. OVERALL THEME & COLORS:
   - Primary colors: [based on tradition and season]
   - Secondary colors: [complementary shades]
   - Cultural significance: [meaning of chosen colors]

2. MANDAP DESIGN:
   - Structure: [traditional design elements]
   - Flowers: [specific types and arrangements]
   - Fabrics: [colors and draping style]
   - Lighting: [traditional and modern elements]

3. ENTRANCE DECORATION:
   - Welcome gate design
   - Toran and kalash placement
   - Flower arrangements
   - Lighting setup

4. STAGE DECORATION (for each event):
   - Mehendi: [specific theme and setup]
   - Wedding: [traditional mandap focus]
   - Reception: [modern elegant setup]

5. FLORAL ARRANGEMENTS:
   - Marigold: [usage and quantities]
   - Roses: [colors and arrangements]
   - Jasmine: [traditional uses]
   - Seasonal flowers: [availability and cost]

6. TRADITIONAL ELEMENTS:
   - Kalash placement and decoration
   - Rangoli designs and locations
   - Diya arrangements
   - Banana tree placement

7. LIGHTING DESIGN:
   - Day ceremony lighting
   - Evening event illumination
   - Traditional diyas and modern lights
   - Photography-friendly setup

8. SEATING AREA DECORATION:
   - Guest seating arrangements
   - Table decorations (if applicable)
   - Aisle decoration
   - Family seating areas

For each element, provide:
- Specific flower types and quantities
- Color combinations and cultural significance
- Estimated costs
- Setup timeline and vendor requirements
- Traditional importance and modern adaptations

Ensure the plan respects cultural traditions while creating visual appeal.""",
                agent=self.agents["decoration_expert"],
                expected_output="Complete decoration plan with traditional elements, cultural significance, and practical details"
            )
            
            decoration_crew = Crew(
                agents=[self.agents["decoration_expert"]],
                tasks=[decoration_task],
                verbose=True,
                memory=False
            )
            
            results = decoration_crew.kickoff()
            
            return {
                "success": True,
                "decoration_plan": str(results),
                "traditional_elements_used": self.indian_wedding_knowledge['traditional_elements'],
                "agent_used": "decoration_expert",
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in decoration planning: {e}")
            return {"error": str(e)}

# Global instance
enhanced_crew = None

def get_enhanced_indian_crew():
    """Get or create enhanced Indian wedding crew"""
    global enhanced_crew
    if enhanced_crew is None:
        enhanced_crew = EnhancedIndianWeddingCrew()
    return enhanced_crew

def test_enhanced_indian_wedding_crew():
    """Test the enhanced Indian wedding crew"""
    print("🎊 TESTING ENHANCED INDIAN WEDDING CREWAI STRUCTURE")
    print("="*65)
    
    try:
        # Initialize crew
        crew = get_enhanced_indian_crew()
        
        if not crew.llm:
            print("❌ Ollama not available - please start: ollama serve")
            return False
        
        print("✅ Enhanced Indian Wedding Crew Initialized")
        print(f"   Specialized Agents: {list(crew.agents.keys())}")
        print(f"   Domain Knowledge Areas: {list(crew.indian_wedding_knowledge.keys())}")
        
        # Test data
        test_data = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "budgetRange": "₹60-80 Lakhs", 
            "guestCount": 300,
            "events": ["Mehendi", "Sangam", "Wedding Ceremony", "Reception"],
            "weddingDate": "2024-12-15"
        }
        
        print(f"\n🎯 Testing with: {test_data['weddingType']} wedding in {test_data['city']}")
        print(f"   Budget: {test_data['budgetRange']}, Guests: {test_data['guestCount']}")
        
        # Get comprehensive plan
        result = crew.get_comprehensive_indian_wedding_plan(test_data)
        
        if result.get("success"):
            print("\n✅ ENHANCED SYSTEM WORKING!")
            print(f"   Wedding Type: {result.get('wedding_type')}")
            print(f"   Location: {result.get('location')}")
            print(f"   Events: {result.get('events')}")
            print(f"   Agents Used: {result.get('agents_used')}")
            print(f"   Domain Knowledge: {result.get('domain_knowledge_used')}")
            
            # Show cultural elements
            cultural = result.get('cultural_considerations', {})
            print(f"   Traditional Colors: {cultural.get('colors', [])}")
            print(f"   Traditional Flowers: {cultural.get('flowers', [])}")
            print(f"   Ceremonies: {cultural.get('ceremonies', [])}")
            
            return True
        else:
            print(f"❌ Planning failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_enhanced_indian_wedding_crew()
    
    if success:
        print("\n" + "="*65)
        print("🎉 ENHANCED INDIAN WEDDING CREWAI STRUCTURE READY!")
        print("   ✅ 5 Specialized Domain-Expert Agents")
        print("   ✅ Comprehensive Indian Wedding Knowledge Base")
        print("   ✅ Cultural Traditions & Regional Variations")
        print("   ✅ Multi-Ceremony Planning Capability")
        print("   ✅ Budget Distribution Expertise")
        print("   ✅ Traditional Decoration Knowledge")
        print("   ✅ Seasonal Planning Considerations")
        print("   ✅ Enhanced Prompting for Better Responses")
        print("="*65)
    else:
        print("\n❌ Please check Ollama setup") 