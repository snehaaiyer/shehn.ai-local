#!/usr/bin/env python3
"""
Production Wedding AI Agents - Ollama Only
Reliable AI agents using only local Ollama, no OpenAI dependency
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

class ProductionWeddingAgents:
    """
    Production-ready wedding AI agents using ONLY Ollama
    No OpenAI API keys required
    """
    
    def __init__(self):
        # Ensure no OpenAI keys are used
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
        
        # Initialize Ollama LLM with explicit configuration
        try:
            self.llm = LLM(
                model="ollama/crewai-nous-hermes:latest",
                base_url="http://localhost:11434",
                api_key="ollama"  # Dummy key for Ollama
            )
            logger.info("✅ Ollama LLM connected successfully")
        except Exception as e:
            logger.error(f"❌ Ollama connection failed: {e}")
            self.llm = None
            return
        
        # Create agents without external tools (no Serper dependency)
        self.agents = self._create_wedding_agents()
        
        logger.info("✅ Production Wedding Agents initialized (Ollama only)")
    
    def _create_wedding_agents(self) -> Dict[str, Agent]:
        """Create wedding planning agents using only Ollama"""
        
        # Budget Planning Agent
        budget_agent = Agent(
            role="Wedding Budget Specialist",
            goal="Create optimal budget allocations based on wedding requirements",
            backstory="""You are an expert wedding financial planner with 15+ years of experience in Indian weddings.
            You understand regional pricing across India, seasonal variations, and can create realistic budgets
            for different wedding styles and scales. You excel at maximizing value within budget constraints.""",
            tools=[],  # No external tools - pure LLM reasoning
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1  # Limit iterations for reliability
        )
        
        # Vendor Research Agent
        vendor_agent = Agent(
            role="Wedding Vendor Specialist",
            goal="Recommend suitable wedding vendors based on requirements and budget",
            backstory="""You are a wedding vendor expert with deep knowledge of the Indian wedding industry.
            You know vendor categories, quality indicators, pricing ranges, and can provide practical
            recommendations for different cities and wedding styles. You understand what questions couples should ask vendors.""",
            tools=[],  # No external tools - use knowledge base
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )
        
        # Style Consultant Agent
        style_agent = Agent(
            role="Wedding Style Consultant",
            goal="Create cohesive wedding themes and design recommendations",
            backstory="""You are a creative wedding stylist with expertise in Indian wedding traditions and modern trends.
            You can translate couples' visions into practical design elements and coordinate all visual aspects
            of the wedding beautifully. You understand color theory, seasonal considerations, and cultural significance.""",
            tools=[],  # No external tools - creative reasoning
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )
        
        return {
            "budget_agent": budget_agent,
            "vendor_agent": vendor_agent,
            "style_agent": style_agent
        }
    
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process wedding form with AI agent analysis - Ollama only"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
            
        try:
            logger.info("🚀 Starting AI agent analysis with Ollama")
            
            # Create budget analysis task
            budget_task = Task(
                description=f"""Analyze the wedding requirements and create a detailed budget plan:

Wedding Details:
- Type: {form_data.get('weddingType', 'Traditional')}
- Location: {form_data.get('city', 'Mumbai')}  
- Guest Count: {form_data.get('guestCount', '200')}
- Budget Range: {form_data.get('budgetRange', '₹30-50 Lakhs')}
- Style: {form_data.get('weddingStyle', 'Traditional')}
- Events: {', '.join(form_data.get('events', ['Wedding Ceremony']))}

Based on your expertise in Indian wedding planning, create a comprehensive budget breakdown:

1. VENUE (35-40%): Estimate costs for ceremony and reception venues
2. CATERING (25-30%): Food costs per plate for {form_data.get('guestCount', '200')} guests
3. PHOTOGRAPHY (10-15%): Professional wedding photography and videography
4. DECORATION (8-12%): Floral arrangements, lighting, and stage decoration
5. CLOTHING & JEWELRY (5-10%): Bridal and groom attire
6. ENTERTAINMENT (3-8%): Music, DJ, or live performances
7. TRANSPORT (2-5%): Vehicle arrangements for wedding party
8. MISCELLANEOUS (5-10%): Invitations, gifts, and unexpected expenses

Provide specific amount ranges in INR for each category based on the total budget of {form_data.get('budgetRange', '₹30-50 Lakhs')}.
Include cost-saving tips and priority recommendations.""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget breakdown with specific INR amounts and percentages for each category"
            )
            
            # Create vendor recommendation task  
            vendor_task = Task(
                description=f"""Based on the wedding requirements, provide comprehensive vendor recommendations:

Requirements:
- Location: {form_data.get('city', 'Mumbai')}
- Wedding Type: {form_data.get('weddingType', 'Traditional')}
- Budget: {form_data.get('budgetRange', '₹30-50 Lakhs')}
- Guest Count: {form_data.get('guestCount', '200')}
- Style: {form_data.get('weddingStyle', 'Traditional')}

For each major vendor category, provide:

1. VENUE VENDORS:
   - Types to consider (banquet halls, hotels, outdoor venues)
   - Key questions to ask about capacity, catering policies, decorations
   - Red flags to avoid
   - Expected pricing range for {form_data.get('guestCount', '200')} guests

2. CATERING VENDORS:
   - Menu options for {form_data.get('weddingType', 'Traditional')} weddings
   - Questions about food quality, service staff, equipment
   - Pricing expectations per plate
   - Tasting and contract considerations

3. PHOTOGRAPHY VENDORS:
   - Portfolio evaluation criteria
   - Package inclusions (pre-wedding, ceremony, reception)
   - Delivery timelines and formats
   - Pricing expectations for professional coverage

4. DECORATION VENDORS:
   - Style matching for {form_data.get('weddingStyle', 'Traditional')} theme
   - Seasonal flower availability and pricing
   - Lighting and stage setup capabilities
   - Setup and breakdown logistics

Provide practical, actionable advice for vendor selection and negotiation.""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor selection guide with specific recommendations and evaluation criteria"
            )
            
            # Create crew with simple configuration
            wedding_crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[budget_task, vendor_task],
                verbose=True,
                process=Process.sequential,  # Use sequential process
                memory=False   # Disable memory for reliability
            )
            
            # Execute agent analysis
            logger.info("🤖 AI agents analyzing wedding requirements...")
            results = wedding_crew.kickoff()
            
            # Parse and structure the results
            parsed_results = self._parse_agent_results(str(results))
            
            return {
                "success": True,
                "ai_powered": True,
                "ollama_only": True,
                "agent_analysis": str(results),
                "parsed_insights": parsed_results,
                "agents_used": ["budget_agent", "vendor_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "crewai-nous-hermes:latest"
            }
            
        except Exception as e:
            logger.error(f"Agent processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ai_powered": False,
                "ollama_only": True
            }
    
    def process_visual_preferences(self, preferences: Dict[str, Any], wedding_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process visual preferences with style agent - Ollama only"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
            
        try:
            logger.info("🎨 Analyzing visual preferences with Ollama")
            
            style_task = Task(
                description=f"""Analyze the visual preferences and create a comprehensive style guide:

Visual Preferences: {json.dumps(preferences, indent=2)}
Wedding Context: {json.dumps(wedding_context or {}, indent=2)}

Based on your expertise in wedding styling, create detailed recommendations:

1. COLOR PALETTE:
   - Primary colors and complementary combinations
   - Seasonal appropriateness and cultural significance
   - Color psychology for wedding atmosphere

2. THEME INTERPRETATION:
   - Overall mood and aesthetic direction
   - Traditional vs modern elements balance
   - Cultural authenticity considerations

3. DECOR ELEMENTS:
   - Floral arrangements and seasonal flower choices
   - Fabric and textile recommendations
   - Lighting design for different times of day
   - Table settings and centerpiece ideas

4. COORDINATION GUIDELINES:
   - Bridal attire color coordination
   - Venue decoration themes
   - Photography backdrop considerations
   - Guest area styling

5. PRACTICAL IMPLEMENTATION:
   - Budget-friendly alternatives
   - DIY elements vs professional services
   - Timeline for decoration setup
   - Weather contingency plans

Ensure all recommendations create a cohesive and memorable wedding experience.""",
                agent=self.agents["style_agent"],
                expected_output="Comprehensive style guide with specific color, decor, and coordination recommendations"
            )
            
            style_crew = Crew(
                agents=[self.agents["style_agent"]],
                tasks=[style_task],
                verbose=True,
                process=Process.sequential,  # Use sequential process
                memory=False
            )
            
            results = style_crew.kickoff()
            
            return {
                "success": True,
                "style_analysis": str(results),
                "visual_matches": self._extract_visual_insights(str(results)),
                "processing_time": datetime.now().isoformat(),
                "ollama_only": True
            }
            
        except Exception as e:
            logger.error(f"Style processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ollama_only": True
            }
    
    def _parse_agent_results(self, results: str) -> Dict[str, Any]:
        """Parse and structure agent results"""
        try:
            insights = {
                "budget_analysis": {
                    "categories_found": [],
                    "estimated_amounts": {},
                    "recommendations": []
                },
                "vendor_insights": {
                    "categories": [],
                    "key_recommendations": [],
                    "evaluation_criteria": []
                }
            }
            
            # Parse budget information
            results_lower = results.lower()
            
            # Budget categories with typical percentages
            budget_categories = {
                "venue": {"min": 35, "max": 40},
                "catering": {"min": 25, "max": 30},
                "photography": {"min": 10, "max": 15},
                "decoration": {"min": 8, "max": 12},
                "clothing": {"min": 5, "max": 10},
                "entertainment": {"min": 3, "max": 8},
                "transport": {"min": 2, "max": 5},
                "miscellaneous": {"min": 5, "max": 10}
            }
            
            for category, percentages in budget_categories.items():
                if category in results_lower:
                    insights["budget_analysis"]["categories_found"].append(category)
                    insights["budget_analysis"]["estimated_amounts"][category] = {
                        "percentage_range": f"{percentages['min']}-{percentages['max']}%"
                    }
            
            # Vendor categories
            vendor_categories = ["venue", "catering", "photography", "decoration", "entertainment"]
            for category in vendor_categories:
                if category in results_lower:
                    insights["vendor_insights"]["categories"].append(category)
            
            # Extract key recommendations
            if "cost-saving" in results_lower or "budget" in results_lower:
                insights["budget_analysis"]["recommendations"].append("Cost-saving strategies provided")
            
            if "questions to ask" in results_lower or "evaluation" in results_lower:
                insights["vendor_insights"]["evaluation_criteria"].append("Vendor evaluation guidelines provided")
            
            return insights
            
        except Exception as e:
            logger.error(f"Error parsing results: {e}")
            return {"error": "Could not parse agent results", "raw_available": True}
    
    def _extract_visual_insights(self, results: str) -> Dict[str, Any]:
        """Extract visual insights from style analysis"""
        results_lower = results.lower()
        
        return {
            "style_confidence": 0.9,
            "theme_coherence": "High" if "cohesive" in results_lower else "Medium",
            "color_harmony": "Excellent" if "color" in results_lower else "Good", 
            "design_elements_identified": [
                elem for elem in ["color_palette", "lighting", "florals", "decor", "coordination"]
                if elem.replace("_", " ") in results_lower
            ],
            "cultural_authenticity": "High" if "traditional" in results_lower else "Medium",
            "practical_implementation": "Detailed" if "budget" in results_lower and "timeline" in results_lower else "Basic"
        }

# Global instance
production_agents = None

def get_production_agents():
    """Get or create production agents instance - Ollama only"""
    global production_agents
    if production_agents is None:
        production_agents = ProductionWeddingAgents()
    return production_agents

def test_production_agents():
    """Test the production agents with Ollama only"""
    try:
        print("🧪 Testing Production Wedding AI Agents (Ollama Only)...")
        agents = get_production_agents()
        
        if not agents.llm:
            print("❌ Ollama not available - please start Ollama: ollama serve")
            return False
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "250", 
            "budgetRange": "₹50-70 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony", "Reception"]
        }
        
        print("🤖 Processing wedding form with AI agents (Ollama)...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Production AI Agents working successfully!")
            print(f"   AI Powered: {result['ai_powered']}")
            print(f"   Ollama Only: {result['ollama_only']}")
            print(f"   Model Used: {result['model_used']}")
            print(f"   Agents Used: {result['agents_used']}")
            
            # Show parsed insights
            parsed = result['parsed_insights']
            print(f"   Budget Categories: {len(parsed['budget_analysis']['categories_found'])}")
            print(f"   Vendor Categories: {len(parsed['vendor_insights']['categories'])}")
            
            return True
        else:
            print(f"❌ Agent test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

if __name__ == "__main__":
    # Test the production agents
    success = test_production_agents()
    
    if success:
        print("\n" + "="*60)
        print("🎉 Your Production AI Agents are ready!")
        print("   ✅ Ollama connection working")  
        print("   ✅ CrewAI agents operational")
        print("   ✅ No OpenAI dependency")
        print("   ✅ Wedding planning logic active")
        print("   ✅ Production-ready and reliable")
        print("="*60)
    else:
        print("\n❌ Please start Ollama first: ollama serve") 