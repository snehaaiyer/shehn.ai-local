
#!/usr/bin/env python3
"""
Operational Wedding AI Agents System
Fully integrated with Gemini API (production ready)
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging
import google.generativeai as genai

from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OperationalWeddingAgents:
    def __init__(self, gemini_api_key: str = None, serper_api_key: str = None):
        # Use Gemini API instead of Ollama
        self.api_key = gemini_api_key or os.getenv('GEMINI_API_KEY') or 'REDACTED_GEMINI_KEY'
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Initialize Gemini LLM for CrewAI
        self.llm = LLM(
            model="gemini/gemini-2.0-flash-exp",
            api_key=self.api_key,
            temperature=0.7,
            max_tokens=2000
        )
        
        # Initialize Serper search tool (optional)
        self.search_available = False
        if serper_api_key:
            try:
                os.environ["SERPER_API_KEY"] = serper_api_key
                self.search_tool = SerperDevTool()
                self.search_available = True
                logger.info("✅ Serper search enabled")
            except Exception as e:
                logger.warning(f"⚠️ Serper not available: {e}")
                self.search_tool = None
        else:
            self.search_tool = None
        
        self.agents = self._create_wedding_agents()
        
        logger.info("✅ Operational Wedding Agents initialized with Gemini API")
    
    def _create_wedding_agents(self) -> Dict[str, Agent]:
        tools = [self.search_tool] if self.search_available else []
        
        budget_agent = Agent(
            role="Wedding Budget Specialist",
            goal="Create optimal budget allocations and find cost-effective solutions",
            backstory="Expert wedding financial planner with 15+ years experience in Indian weddings",
            tools=tools,
            llm=self.llm,  # Using Gemini LLM
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        vendor_agent = Agent(
            role="Wedding Vendor Specialist", 
            goal="Find and evaluate the best wedding vendors",
            backstory="Wedding vendor expert with deep industry knowledge of Indian wedding vendors",
            tools=tools,
            llm=self.llm,  # Using Gemini LLM
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        style_agent = Agent(
            role="Wedding Style Consultant",
            goal="Create cohesive wedding themes and design recommendations", 
            backstory="Creative wedding stylist with design expertise in Indian wedding traditions",
            tools=tools,
            llm=self.llm,  # Using Gemini LLM
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        return {
            "budget_agent": budget_agent,
            "vendor_agent": vendor_agent, 
            "style_agent": style_agent
        }
    
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info("🚀 Starting AI agent analysis with Gemini API")
            
            budget_task = Task(
                description=f"""Analyze wedding requirements and create comprehensive budget breakdown:
                
Wedding Details: {json.dumps(form_data, indent=2)}

Create detailed budget breakdown with:
- Category-wise allocation percentages
- Specific INR amount estimates
- Regional pricing for {form_data.get('city', 'Mumbai')}
- Cost-saving recommendations
- Priority-based spending advice""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget analysis with INR allocations and cost optimization tips"
            )
            
            vendor_task = Task(
                description=f"""Research and recommend vendors for this Indian wedding:
                
Wedding Requirements: {json.dumps(form_data, indent=2)}

Provide vendor recommendations with:
- Venue options for Indian ceremonies
- Catering with Indian cuisine expertise  
- Photography for Indian weddings
- Decoration understanding cultural needs
- Evaluation criteria and questions to ask vendors""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor recommendations with evaluation guidelines"
            )
            
            crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[budget_task, vendor_task],
                verbose=True,
                memory=False
            )
            
            results = crew.kickoff()
            
            return {
                "success": True,
                "agent_analysis": str(results),
                "agents_used": ["budget_agent", "vendor_agent"],
                "processing_time": datetime.now().isoformat(),
                "gemini_api": True,
                "search_enabled": self.search_available,
                "model_used": "gemini-2.0-flash-exp"
            }
            
        except Exception as e:
            logger.error(f"Gemini agent error: {str(e)}")
            return {"success": False, "error": str(e), "gemini_api": True}

# Global instance
operational_agents = None

def get_operational_agents(gemini_api_key: str = None, serper_api_key: str = None):
    global operational_agents
    if operational_agents is None:
        operational_agents = OperationalWeddingAgents(gemini_api_key, serper_api_key)
    return operational_agents

def test_gemini_agents():
    try:
        print("🧪 Testing Gemini AI Agents...")
        agents = get_operational_agents(serper_api_key="19dd65af8ee73ed572d5b91d25a32d01eec1a31f")
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai", 
            "budgetRange": "₹40-60 Lakhs",
            "guestCount": "200",
            "events": ["Wedding Ceremony", "Reception"]
        }
        
        print("🤖 Processing with Gemini API...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Gemini AI Agents working!")
            print(f"   Model: {result['model_used']}")
            print(f"   Gemini API: {result['gemini_api']}")
            print(f"   Search: {result['search_enabled']}")
        else:
            print(f"❌ Failed: {result['error']}")
            
        return result
        
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    success = test_gemini_agents()
    
    if success and success.get("success"):
        print("\n" + "="*60)
        print("🎉 GEMINI OPERATIONAL AGENTS READY!")
        print("   ✅ Gemini 2.0 Flash Exp working")
        print("   ✅ No Ollama dependency")
        print("   ✅ Production deployment ready")
        print("   ✅ Search integration optional")
        print("="*60)
    else:
        print("\n❌ Check Gemini API setup")
