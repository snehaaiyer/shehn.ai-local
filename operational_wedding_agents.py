#!/usr/bin/env python3
"""
Operational Wedding AI Agents System
Fully integrated with Ollama (local) and Serper API
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OperationalWeddingAgents:
    def __init__(self, serper_api_key: str = None):
        # Initialize Ollama LLM
        self.llm = LLM(
            model="ollama/crewai-nous-hermes:latest",
            base_url="http://localhost:11434"
        )
        
        # Initialize Serper search tool
        if serper_api_key:
            os.environ["SERPER_API_KEY"] = serper_api_key
        
        self.search_tool = SerperDevTool()
        self.agents = self._create_wedding_agents()
        
        logger.info("✅ Operational Wedding Agents initialized with Ollama + Serper")
    
    def _create_wedding_agents(self) -> Dict[str, Agent]:
        budget_agent = Agent(
            role="Wedding Budget Specialist",
            goal="Create optimal budget allocations and find cost-effective solutions",
            backstory="Expert wedding financial planner with 15+ years experience",
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )
        
        vendor_agent = Agent(
            role="Wedding Vendor Specialist", 
            goal="Find and evaluate the best wedding vendors",
            backstory="Wedding vendor expert with deep industry knowledge",
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )
        
        style_agent = Agent(
            role="Wedding Style Consultant",
            goal="Create cohesive wedding themes and design recommendations", 
            backstory="Creative wedding stylist with design expertise",
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )
        
        return {
            "budget_agent": budget_agent,
            "vendor_agent": vendor_agent, 
            "style_agent": style_agent
        }
    
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info("🚀 Starting AI agent analysis")
            
            budget_task = Task(
                description=f"""Analyze wedding requirements: {json.dumps(form_data)}
                Create comprehensive budget breakdown with category allocations.""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget analysis with allocations"
            )
            
            vendor_task = Task(
                description=f"""Research vendors for: {json.dumps(form_data)}
                Find top vendors matching requirements.""",
                agent=self.agents["vendor_agent"],
                expected_output="Vendor recommendations with details"
            )
            
            crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[budget_task, vendor_task],
                verbose=True
            )
            
            results = crew.kickoff()
            
            return {
                "success": True,
                "agent_analysis": results,
                "agents_used": ["budget_agent", "vendor_agent"],
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Agent error: {str(e)}")
            return {"success": False, "error": str(e)}

# Global instance
operational_agents = None

def get_operational_agents(serper_api_key: str = None):
    global operational_agents
    if operational_agents is None:
        operational_agents = OperationalWeddingAgents(serper_api_key)
    return operational_agents

def test_agents():
    try:
        agents = get_operational_agents()
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai", 
            "budgetRange": "₹40-60 Lakhs"
        }
        
        print("🧪 Testing AI agents...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ AI Agents working!")
        else:
            print(f"❌ Failed: {result['error']}")
            
        return result
        
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    test_agents() 