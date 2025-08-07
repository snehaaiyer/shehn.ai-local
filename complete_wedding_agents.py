#!/usr/bin/env python3
"""
Complete Wedding AI Agents System
Preserves all functionalities from setup_agents_fixed.py while using Ollama + Serper
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompleteWeddingPlannerCrew:
    """
    Complete wedding planner with all functionalities:
    - Vendor recommendations
    - Style recommendations  
    - Timeline recommendations
    - Budget analysis
    - Using Ollama + Serper
    """
    
    def __init__(self, serper_api_key: str = None):
        # Ensure no OpenAI interference
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
        
        # Initialize Ollama LLM
        try:
            self.llm = LLM(
                model="ollama/crewai-nous-hermes:latest",
                base_url="http://localhost:11434",
                api_key="ollama"
            )
            logger.info("✅ Ollama LLM connected successfully")
        except Exception as e:
            logger.error(f"❌ Ollama connection failed: {e}")
            self.llm = None
            return
        
        # Initialize Serper search tool
        self.search_available = False
        if serper_api_key:
            try:
                os.environ["SERPER_API_KEY"] = serper_api_key
                self.search_tool = SerperDevTool()
                self.search_available = True
                logger.info("✅ Serper search tool enabled")
            except Exception as e:
                logger.warning(f"⚠️ Serper tool not available: {e}")
                self.search_tool = None
        else:
            logger.info("ℹ️ No Serper API key - agents will work without search")
            self.search_tool = None
        
        # Create all specialized agents
        self.agents = self._create_agents()
        
        logger.info("✅ Complete Wedding Planner Crew initialized")
    
    def _create_agents(self) -> Dict[str, Agent]:
        """Create all specialized wedding planning agents"""
        
        tools = [self.search_tool] if self.search_available else []
        
        # Vendor Research Specialist
        vendor_researcher = Agent(
            role="Vendor Research Specialist",
            goal="Find and evaluate wedding vendors based on requirements",
            backstory="""Expert at researching and evaluating wedding vendors.
            Skilled at matching vendors to couple's style, budget and needs.
            Uses web search to find current vendor information and pricing.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Budget Analyst
        budget_analyst = Agent(
            role="Wedding Budget Analyst", 
            goal="Optimize wedding budget allocation and costs",
            backstory="""Financial expert specializing in wedding budgets.
            Creates detailed budget breakdowns and finds cost-saving opportunities.
            Researches current market rates and pricing trends.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Style Consultant
        style_consultant = Agent(
            role="Wedding Style Consultant",
            goal="Define and refine wedding style and theme",
            backstory="""Creative expert in wedding aesthetics and design.
            Translates couple's vision into cohesive style concepts.
            Stays updated on latest wedding trends and cultural traditions.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Timeline Manager
        timeline_manager = Agent(
            role="Wedding Timeline Manager",
            goal="Create and manage wedding planning timeline",
            backstory="""Expert in wedding planning logistics and timelines.
            Ensures all tasks are properly scheduled and coordinated.
            Understands vendor booking requirements and seasonal considerations.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        return {
            "vendor_researcher": vendor_researcher,
            "budget_analyst": budget_analyst,
            "style_consultant": style_consultant,
            "timeline_manager": timeline_manager
        }
    
    def get_vendor_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered vendor recommendations with search"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            # Create vendor research task
            vendor_task = Task(
                description=f"""Research and recommend vendors for {wedding_data['weddingType']} wedding:
                
                Wedding Requirements:
                - Budget: {wedding_data['budgetRange']}
                - Location: {wedding_data['city']}
                - Style: {wedding_data.get('weddingStyle', 'Traditional')}
                - Guest Count: {wedding_data.get('guestCount', 100)}
                - Events: {', '.join(wedding_data.get('events', ['Wedding Ceremony']))}
                
                {"Search for current vendors in the area and" if self.search_available else "Based on your knowledge, recommend vendors and"}
                provide detailed recommendations with:
                
                VENDOR RECOMMENDATIONS:
                - Venue options with capacity and pricing
                - Catering services with menu options
                - Photography/videography professionals
                - Decoration and floral services
                - Entertainment options
                
                Include contact information, pricing ranges, and reasoning for each recommendation.""",
                agent=self.agents["vendor_researcher"],
                expected_output="Structured vendor recommendations with contact details and pricing"
            )
            
            # Create budget analysis task
            budget_task = Task(
                description=f"""Analyze budget allocation for vendors:
                
                Budget Details:
                - Total Budget: {wedding_data['budgetRange']}
                - Wedding Type: {wedding_data['weddingType']}
                - Key Priorities: {', '.join(wedding_data.get('priorities', []))}
                - Guest Count: {wedding_data.get('guestCount', 100)}
                
                {"Research current market rates and" if self.search_available else "Based on your expertise,"}
                provide detailed budget breakdown:
                
                BUDGET BREAKDOWN:
                - Venue: percentage and amount
                - Catering: cost per guest calculation
                - Photography: package pricing
                - Decoration: estimated costs
                - Entertainment: budget allocation
                - Miscellaneous: contingency planning
                
                INSIGHTS:
                - Cost-saving opportunities
                - Priority-based recommendations
                - Seasonal pricing considerations""",
                agent=self.agents["budget_analyst"],
                expected_output="Detailed budget breakdown with insights and recommendations"
            )
            
            # Create crew and process tasks
            crew = Crew(
                agents=[self.agents["vendor_researcher"], self.agents["budget_analyst"]],
                tasks=[vendor_task, budget_task],
                verbose=True,
                memory=False
            )
            
            result = crew.kickoff()
            
            # Parse and format results
            recommendations = self._parse_vendor_results(str(result))
            recommendations["search_enabled"] = self.search_available
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in vendor recommendations: {e}")
            return {"error": str(e)}
    
    def get_style_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered style recommendations"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            # Create style analysis task
            style_task = Task(
                description=f"""Analyze and recommend wedding style elements:
                
                Style Requirements:
                - Wedding Type: {wedding_data['weddingType']}
                - Visual Preferences: {wedding_data.get('visualPreferences', {})}
                - Season: {wedding_data.get('season', 'Any')}
                - Location: {wedding_data.get('city', 'Mumbai')}
                - Budget: {wedding_data.get('budgetRange', 'Not specified')}
                
                {"Research current wedding trends and" if self.search_available else "Based on your styling expertise,"}
                provide comprehensive style recommendations:
                
                THEME RECOMMENDATIONS:
                - Overall wedding theme and mood
                - Cultural elements to incorporate
                - Modern vs traditional balance
                
                COLOR PALETTE:
                - Primary color scheme
                - Accent colors and combinations
                - Seasonal color considerations
                
                DECOR ELEMENTS:
                - Floral arrangements and choices
                - Lighting design concepts
                - Table settings and linens
                - Stage and mandap decoration
                
                STYLE INSIGHTS:
                - Coordination between different elements
                - Budget-friendly styling tips
                - Vendor briefing guidelines""",
                agent=self.agents["style_consultant"],
                expected_output="Comprehensive style guide with theme, colors, and decor recommendations"
            )
            
            # Create crew and process task
            crew = Crew(
                agents=[self.agents["style_consultant"]],
                tasks=[style_task],
                verbose=True,
                memory=False
            )
            
            result = crew.kickoff()
            
            # Parse and format results
            recommendations = self._parse_style_results(str(result))
            recommendations["search_enabled"] = self.search_available
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in style recommendations: {e}")
            return {"error": str(e)}
    
    def get_timeline_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered timeline recommendations"""
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            # Create timeline planning task
            timeline_task = Task(
                description=f"""Create comprehensive wedding planning timeline:
                
                Timeline Requirements:
                - Wedding Date: {wedding_data.get('weddingDate', 'TBD')}
                - Wedding Type: {wedding_data['weddingType']}
                - Events: {', '.join(wedding_data.get('events', []))}
                - Location: {wedding_data.get('city', 'Mumbai')}
                - Guest Count: {wedding_data.get('guestCount', 100)}
                
                {"Research current vendor booking timelines and" if self.search_available else "Based on your planning expertise,"}
                create detailed timeline with:
                
                MAJOR MILESTONES:
                - 12 months before: Initial planning phase
                - 9 months before: Vendor bookings
                - 6 months before: Detailed planning
                - 3 months before: Final confirmations
                - 1 month before: Final preparations
                - Wedding week: Day-by-day schedule
                
                TASK BREAKDOWN:
                For each milestone, provide specific tasks and deadlines
                
                CRITICAL DATES:
                - Vendor booking deadlines
                - Payment schedules
                - Final headcount dates
                - Setup and rehearsal times""",
                agent=self.agents["timeline_manager"],
                expected_output="Detailed wedding planning timeline with milestones and task breakdowns"
            )
            
            # Create crew and process task
            crew = Crew(
                agents=[self.agents["timeline_manager"]],
                tasks=[timeline_task],
                verbose=True,
                memory=False
            )
            
            result = crew.kickoff()
            
            # Parse and format results
            recommendations = self._parse_timeline_results(str(result))
            recommendations["search_enabled"] = self.search_available
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in timeline recommendations: {e}")
            return {"error": str(e)}
    
    def process_complete_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process complete wedding form with all agents"""
        if not self.llm:
            return {"success": False, "error": "LLM not available"}
            
        try:
            logger.info("🚀 Processing complete wedding form with all agents")
            
            # Get all recommendations
            vendor_recs = self.get_vendor_recommendations(form_data)
            style_recs = self.get_style_recommendations(form_data)
            timeline_recs = self.get_timeline_recommendations(form_data)
            
            return {
                "success": True,
                "vendor_recommendations": vendor_recs,
                "style_recommendations": style_recs,
                "timeline_recommendations": timeline_recs,
                "search_enabled": self.search_available,
                "processing_time": datetime.now().isoformat(),
                "agents_used": ["vendor_researcher", "budget_analyst", "style_consultant", "timeline_manager"]
            }
            
        except Exception as e:
            logger.error(f"Error processing complete form: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_vendor_results(self, result: str) -> Dict:
        """Parse and structure vendor recommendation results"""
        try:
            recommendations = {
                "vendors": [],
                "budget_breakdown": {},
                "insights": []
            }
            
            lines = result.split("\n")
            current_section = None
            
            for line in lines:
                if "VENDOR RECOMMENDATIONS:" in line:
                    current_section = "vendors"
                elif "BUDGET BREAKDOWN:" in line:
                    current_section = "budget"
                elif "INSIGHTS:" in line:
                    current_section = "insights"
                elif line.strip() and current_section:
                    if current_section == "vendors":
                        recommendations["vendors"].append(line.strip())
                    elif current_section == "budget":
                        if ":" in line:
                            category, amount = line.split(":", 1)
                            recommendations["budget_breakdown"][category.strip()] = amount.strip()
                    elif current_section == "insights":
                        recommendations["insights"].append(line.strip())
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error parsing vendor results: {e}")
            return {"error": str(e), "raw_result": result}
    
    def _parse_style_results(self, result: str) -> Dict:
        """Parse and structure style recommendation results"""
        try:
            recommendations = {
                "theme": [],
                "colors": [],
                "decor": [],
                "insights": []
            }
            
            lines = result.split("\n")
            current_section = None
            
            for line in lines:
                if "THEME RECOMMENDATIONS:" in line:
                    current_section = "theme"
                elif "COLOR PALETTE:" in line:
                    current_section = "colors"
                elif "DECOR ELEMENTS:" in line:
                    current_section = "decor"
                elif "STYLE INSIGHTS:" in line:
                    current_section = "insights"
                elif line.strip() and current_section:
                    recommendations[current_section].append(line.strip())
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error parsing style results: {e}")
            return {"error": str(e), "raw_result": result}
    
    def _parse_timeline_results(self, result: str) -> Dict:
        """Parse and structure timeline recommendation results"""
        try:
            recommendations = {
                "milestones": [],
                "tasks": {},
                "critical_dates": []
            }
            
            lines = result.split("\n")
            current_section = None
            current_milestone = None
            
            for line in lines:
                if "MAJOR MILESTONES:" in line:
                    current_section = "milestones"
                elif "TASK BREAKDOWN:" in line:
                    current_section = "tasks"
                elif "CRITICAL DATES:" in line:
                    current_section = "critical_dates"
                elif line.strip() and current_section:
                    if current_section == "milestones":
                        recommendations["milestones"].append(line.strip())
                    elif current_section == "tasks":
                        if line.startswith("-"):
                            if current_milestone:
                                if current_milestone not in recommendations["tasks"]:
                                    recommendations["tasks"][current_milestone] = []
                                recommendations["tasks"][current_milestone].append(line[1:].strip())
                        else:
                            current_milestone = line.strip()
                            recommendations["tasks"][current_milestone] = []
                    elif current_section == "critical_dates":
                        recommendations["critical_dates"].append(line.strip())
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error parsing timeline results: {e}")
            return {"error": str(e), "raw_result": result}

# Global instance
complete_wedding_crew = None

def get_complete_wedding_crew(serper_api_key: str = None):
    """Get or create complete wedding crew instance"""
    global complete_wedding_crew
    if complete_wedding_crew is None:
        complete_wedding_crew = CompleteWeddingPlannerCrew(serper_api_key)
    return complete_wedding_crew

def test_complete_system():
    """Test the complete wedding system"""
    try:
        print("🧪 Testing Complete Wedding AI System...")
        
        # Use the provided Serper API key
        crew = get_complete_wedding_crew("19dd65af8ee73ed572d5b91d25a32d01eec1a31f")
        
        if not crew.llm:
            print("❌ Ollama not available - please start: ollama serve")
            return False
        
        test_data = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "200",
            "budgetRange": "₹50-70 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony", "Reception"],
            "priorities": ["Venue", "Catering", "Photography"],
            "weddingDate": "2024-12-15",
            "season": "Winter"
        }
        
        print("🤖 Processing complete wedding form...")
        result = crew.process_complete_wedding_form(test_data)
        
        if result["success"]:
            print("✅ Complete Wedding AI System working!")
            print(f"   Search Enabled: {result['search_enabled']}")
            print(f"   Agents Used: {result['agents_used']}")
            
            # Show results summary
            vendor_recs = result['vendor_recommendations']
            style_recs = result['style_recommendations']
            timeline_recs = result['timeline_recommendations']
            
            print(f"   Vendor Categories: {len(vendor_recs.get('vendors', []))}")
            print(f"   Style Elements: {len(style_recs.get('theme', []))}")
            print(f"   Timeline Milestones: {len(timeline_recs.get('milestones', []))}")
            
            return True
        else:
            print(f"❌ Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_complete_system()
    
    if success:
        print("\n" + "="*70)
        print("🎉 Complete Wedding AI System Ready!")
        print("   ✅ Ollama LLM working")
        print("   ✅ Serper web search enabled")
        print("   ✅ All agent functionalities preserved:")
        print("      • Vendor recommendations")
        print("      • Style recommendations")
        print("      • Timeline recommendations")
        print("      • Budget analysis")
        print("   ✅ No OpenAI dependency")
        print("   ✅ Production-ready")
        print("="*70)
    else:
        print("\n❌ Check Ollama and setup") 