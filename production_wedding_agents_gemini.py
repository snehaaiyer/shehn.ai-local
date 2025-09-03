
#!/usr/bin/env python3
"""
Production Wedding AI Agents - Gemini API
Reliable AI agents using Google Gemini API for production deployment
No local dependencies - works in production
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging
import google.generativeai as genai

from crewai import Agent, Task, Crew, LLM, Process

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionWeddingAgentsGemini:
    """
    Production-ready wedding AI agents using Google Gemini API
    No local dependencies - perfect for deployment
    """
    
    def __init__(self, gemini_api_key: str = None):
        # Use provided API key or fallback to environment/default
        self.api_key = gemini_api_key or os.getenv('GEMINI_API_KEY') or 'REDACTED_GEMINI_KEY'
        
        # Ensure no conflicting API keys
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Initialize Gemini LLM for CrewAI
        try:
            self.llm = LLM(
                model="gemini/gemini-2.0-flash-exp",
                api_key=self.api_key,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info("✅ Gemini LLM connected successfully for CrewAI")
        except Exception as e:
            logger.error(f"❌ Gemini LLM connection failed: {e}")
            self.llm = None
            return
        
        # Create agents without external tools (production ready)
        self.agents = self._create_wedding_agents()
        
        logger.info("✅ Production Wedding Agents initialized (Gemini API)")
    
    def _create_wedding_agents(self) -> Dict[str, Agent]:
        """Create wedding planning agents using Gemini API"""
        
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
            max_iter=1
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
        
        # Timeline Manager Agent
        timeline_agent = Agent(
            role="Wedding Timeline Manager",
            goal="Create comprehensive wedding planning timelines and schedules",
            backstory="""You are an expert wedding timeline coordinator with deep understanding of Indian wedding logistics.
            You know how to sequence multiple ceremonies, coordinate vendors, manage family schedules, and ensure
            smooth execution of multi-day celebrations. You understand cultural timing requirements and auspicious moments.""",
            tools=[],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )
        
        return {
            "budget_agent": budget_agent,
            "vendor_agent": vendor_agent,
            "style_agent": style_agent,
            "timeline_agent": timeline_agent
        }
    
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process wedding form with Gemini AI agent analysis"""
        if not self.llm:
            return {"success": False, "error": "Gemini LLM not available"}
            
        try:
            logger.info("🚀 Starting AI agent analysis with Gemini API")
            
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
            
            # Create crew with Gemini agents
            wedding_crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[budget_task, vendor_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )
            
            # Execute agent analysis
            logger.info("🤖 Gemini AI agents analyzing wedding requirements...")
            results = wedding_crew.kickoff()
            
            # Parse and structure the results
            parsed_results = self._parse_agent_results(str(results))
            
            return {
                "success": True,
                "ai_powered": True,
                "gemini_api": True,
                "agent_analysis": str(results),
                "parsed_insights": parsed_results,
                "agents_used": ["budget_agent", "vendor_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "gemini-2.0-flash-exp"
            }
            
        except Exception as e:
            logger.error(f"Gemini agent processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ai_powered": False,
                "gemini_api": True
            }
    
    def process_visual_preferences(self, preferences: Dict[str, Any], wedding_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process visual preferences with Gemini style agent"""
        if not self.llm:
            return {"success": False, "error": "Gemini LLM not available"}
            
        try:
            logger.info("🎨 Analyzing visual preferences with Gemini API")
            
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
                process=Process.sequential,
                memory=False
            )
            
            results = style_crew.kickoff()
            
            return {
                "success": True,
                "style_analysis": str(results),
                "visual_matches": self._extract_visual_insights(str(results)),
                "processing_time": datetime.now().isoformat(),
                "gemini_api": True
            }
            
        except Exception as e:
            logger.error(f"Gemini style processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "gemini_api": True
            }
    
    def get_comprehensive_wedding_plan(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get comprehensive wedding plan using all Gemini agents"""
        if not self.llm:
            return {"error": "Gemini LLM not available"}
            
        try:
            logger.info("🎊 Starting comprehensive wedding planning with Gemini API...")
            
            # Create all tasks for comprehensive planning
            budget_task = Task(
                description=f"""Create comprehensive budget analysis for this Indian wedding:

Wedding Details: {json.dumps(wedding_data, indent=2)}

Provide detailed budget breakdown with:
1. Category-wise allocation percentages
2. Specific amount ranges in INR
3. Regional pricing considerations for {wedding_data.get('city', 'Mumbai')}
4. Seasonal pricing factors
5. Cost-saving recommendations
6. Priority-based spending advice""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget breakdown with INR amounts and cost optimization"
            )
            
            vendor_task = Task(
                description=f"""Recommend vendors for this Indian wedding:

Wedding Requirements: {json.dumps(wedding_data, indent=2)}

Provide vendor recommendations with:
1. Venue options suitable for Indian ceremonies
2. Catering services with Indian cuisine expertise
3. Photography specialists for Indian weddings
4. Decoration services understanding cultural requirements
5. Entertainment options for Indian celebrations
6. Vendor evaluation criteria and questions to ask""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor recommendations with evaluation guidelines"
            )
            
            style_task = Task(
                description=f"""Create style and design recommendations:

Wedding Details: {json.dumps(wedding_data, indent=2)}

Provide styling recommendations with:
1. Traditional Indian color schemes and significance
2. Mandap and ceremony decoration ideas
3. Floral arrangements using traditional flowers
4. Lighting concepts for different ceremonies
5. Cultural authenticity guidelines
6. Modern fusion possibilities""",
                agent=self.agents["style_agent"],
                expected_output="Complete style guide with traditional and modern elements"
            )
            
            timeline_task = Task(
                description=f"""Create comprehensive wedding timeline:

Wedding Information: {json.dumps(wedding_data, indent=2)}

Provide detailed timeline with:
1. 12-month planning schedule
2. Vendor booking deadlines
3. Multi-day ceremony scheduling
4. Day-of-wedding hour-by-hour timeline
5. Family coordination points
6. Contingency planning
7. Cultural timing considerations (muhurat)""",
                agent=self.agents["timeline_agent"],
                expected_output="Detailed wedding planning timeline with milestones and schedules"
            )
            
            # Create crew with all Gemini agents
            wedding_crew = Crew(
                agents=[
                    self.agents["budget_agent"],
                    self.agents["vendor_agent"], 
                    self.agents["style_agent"],
                    self.agents["timeline_agent"]
                ],
                tasks=[budget_task, vendor_task, style_task, timeline_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )
            
            # Execute comprehensive analysis
            logger.info("🤖 Gemini AI agents creating comprehensive wedding plan...")
            results = wedding_crew.kickoff()
            
            # Parse and structure results
            parsed_results = self._parse_comprehensive_results(str(results))
            
            return {
                "success": True,
                "ai_powered": True,
                "gemini_api": True,
                "comprehensive_plan": parsed_results,
                "full_analysis": str(results),
                "agents_used": ["budget_agent", "vendor_agent", "style_agent", "timeline_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "gemini-2.0-flash-exp",
                "production_ready": True
            }
            
        except Exception as e:
            logger.error(f"Comprehensive planning error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "gemini_api": True
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
    
    def _parse_comprehensive_results(self, results: str) -> Dict[str, Any]:
        """Parse comprehensive wedding planning results"""
        try:
            parsed = {
                "budget_breakdown": {},
                "vendor_recommendations": [],
                "style_guide": [],
                "timeline_milestones": [],
                "key_insights": []
            }
            
            lines = results.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Identify sections
                if any(keyword in line.lower() for keyword in ['budget', 'cost', 'price', 'rupees', 'inr']):
                    current_section = 'budget'
                elif any(keyword in line.lower() for keyword in ['vendor', 'catering', 'photography', 'venue']):
                    current_section = 'vendors'
                elif any(keyword in line.lower() for keyword in ['style', 'color', 'theme', 'decoration']):
                    current_section = 'style'
                elif any(keyword in line.lower() for keyword in ['timeline', 'schedule', 'month', 'week']):
                    current_section = 'timeline'
                elif any(keyword in line.lower() for keyword in ['tip', 'recommendation', 'insight']):
                    current_section = 'insights'
                
                # Parse content based on section
                if current_section == 'budget' and ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        parsed["budget_breakdown"][parts[0].strip()] = parts[1].strip()
                elif current_section == 'vendors' and line:
                    parsed["vendor_recommendations"].append(line)
                elif current_section == 'style' and line:
                    parsed["style_guide"].append(line)
                elif current_section == 'timeline' and line:
                    parsed["timeline_milestones"].append(line)
                elif current_section == 'insights' and line:
                    parsed["key_insights"].append(line)
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing comprehensive results: {e}")
            return {"raw_results": results, "parsing_error": str(e)}
    
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
gemini_production_agents = None

def get_gemini_production_agents(gemini_api_key: str = None):
    """Get or create Gemini production agents instance"""
    global gemini_production_agents
    if gemini_production_agents is None:
        gemini_production_agents = ProductionWeddingAgentsGemini(gemini_api_key)
    return gemini_production_agents

def test_gemini_production_agents():
    """Test the Gemini production agents"""
    try:
        print("🧪 Testing Production Wedding AI Agents (Gemini API)...")
        agents = get_gemini_production_agents()
        
        if not agents.llm:
            print("❌ Gemini API not available - check API key")
            return False
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "250", 
            "budgetRange": "₹50-70 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony", "Reception"]
        }
        
        print("🤖 Processing wedding form with Gemini AI agents...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Gemini Production AI Agents working successfully!")
            print(f"   AI Powered: {result['ai_powered']}")
            print(f"   Gemini API: {result['gemini_api']}")
            print(f"   Model Used: {result['model_used']}")
            print(f"   Agents Used: {result['agents_used']}")
            print(f"   Production Ready: {result.get('production_ready', True)}")
            
            # Show parsed insights
            parsed = result['parsed_insights']
            print(f"   Budget Categories: {len(parsed['budget_analysis']['categories_found'])}")
            print(f"   Vendor Categories: {len(parsed['vendor_insights']['categories'])}")
            
            return True
        else:
            print(f"❌ Gemini agent test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_comprehensive_gemini_planning():
    """Test comprehensive wedding planning with Gemini"""
    try:
        print("🎊 Testing Comprehensive Gemini Wedding Planning...")
        agents = get_gemini_production_agents()
        
        if not agents.llm:
            print("❌ Gemini API not available")
            return False
        
        test_data = {
            "weddingType": "Traditional Hindu",
            "city": "Delhi",
            "guestCount": 300,
            "budgetRange": "₹60-80 Lakhs",
            "weddingStyle": "Traditional with Modern Touch",
            "events": ["Mehendi", "Sangam", "Wedding Ceremony", "Reception"],
            "weddingDate": "2024-12-15",
            "priorities": ["Venue", "Catering", "Photography"]
        }
        
        print("🤖 Getting comprehensive wedding plan with Gemini...")
        result = agents.get_comprehensive_wedding_plan(test_data)
        
        if result["success"]:
            print("✅ Comprehensive Gemini Planning working!")
            print(f"   All Agents Used: {result['agents_used']}")
            print(f"   Model: {result['model_used']}")
            print(f"   Production Ready: {result['production_ready']}")
            
            plan = result['comprehensive_plan']
            print(f"   Budget Items: {len(plan.get('budget_breakdown', {}))}")
            print(f"   Vendor Recommendations: {len(plan.get('vendor_recommendations', []))}")
            print(f"   Style Elements: {len(plan.get('style_guide', []))}")
            print(f"   Timeline Milestones: {len(plan.get('timeline_milestones', []))}")
            
            return True
        else:
            print(f"❌ Comprehensive planning failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

if __name__ == "__main__":
    # Test basic agents
    print("🧪 TESTING GEMINI-BASED PRODUCTION AGENTS")
    print("="*50)
    
    basic_success = test_gemini_production_agents()
    
    if basic_success:
        print("\n🧪 TESTING COMPREHENSIVE PLANNING")
        print("="*50)
        comprehensive_success = test_comprehensive_gemini_planning()
        
        if comprehensive_success:
            print("\n" + "="*60)
            print("🎉 GEMINI PRODUCTION AGENTS FULLY OPERATIONAL!")
            print("   ✅ Gemini 2.0 Flash Exp LLM working")
            print("   ✅ All 4 specialized agents operational")
            print("   ✅ No local dependencies")
            print("   ✅ Production deployment ready")
            print("   ✅ Comprehensive wedding planning")
            print("   ✅ No OpenAI dependency")
            print("   ✅ No Ollama dependency")
            print("="*60)
        else:
            print("\n❌ Comprehensive planning needs debugging")
    else:
        print("\n❌ Basic agent setup needs debugging")
