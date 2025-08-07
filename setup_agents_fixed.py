"""
Setup Agents Fixed
Provides stable AI agent setup for wedding planning tasks
"""

from crewai import Agent, Task, Crew, Process
from langchain.tools import DuckDuckGoSearchRun
from typing import Dict, Any, List
import json
import os

search_tool = DuckDuckGoSearchRun()

class WeddingPlannerCrew:
    def __init__(self):
        self.search = search_tool
        self.agents = self._create_agents()
    
    def _create_agents(self) -> Dict[str, Agent]:
        """Create specialized wedding planning agents"""
        
        # Vendor Research Specialist
        vendor_researcher = Agent(
            name="Vendor Research Specialist",
            goal="Find and evaluate wedding vendors based on requirements",
            backstory="""Expert at researching and evaluating wedding vendors.
            Skilled at matching vendors to couple's style, budget and needs.""",
            tools=[self.search],
            verbose=True
        )
        
        # Budget Analyst
        budget_analyst = Agent(
            name="Wedding Budget Analyst",
            goal="Optimize wedding budget allocation and costs",
            backstory="""Financial expert specializing in wedding budgets.
            Creates detailed budget breakdowns and finds cost-saving opportunities.""",
            tools=[self.search],
            verbose=True
        )
        
        # Style Consultant
        style_consultant = Agent(
            name="Wedding Style Consultant",
            goal="Define and refine wedding style and theme",
            backstory="""Creative expert in wedding aesthetics and design.
            Translates couple's vision into cohesive style concepts.""",
            tools=[self.search],
            verbose=True
        )
        
        # Timeline Manager
        timeline_manager = Agent(
            name="Wedding Timeline Manager",
            goal="Create and manage wedding planning timeline",
            backstory="""Expert in wedding planning logistics and timelines.
            Ensures all tasks are properly scheduled and coordinated.""",
            tools=[self.search],
            verbose=True
        )
        
        return {
            "vendor_researcher": vendor_researcher,
            "budget_analyst": budget_analyst,
            "style_consultant": style_consultant,
            "timeline_manager": timeline_manager
        }
    
    def get_vendor_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered vendor recommendations"""
        
        # Create vendor research task
        vendor_task = Task(
            description=f"""Research and recommend vendors for {wedding_data['weddingType']} wedding
            Budget: {wedding_data['budgetRange']}
            Location: {wedding_data['city']}
            Style: {wedding_data.get('weddingStyle', 'Traditional')}
            Guest Count: {wedding_data.get('guestCount', 100)}
            
            Provide recommendations with reasoning.""",
            agent=self.agents["vendor_researcher"]
        )
        
        # Create budget analysis task
        budget_task = Task(
            description=f"""Analyze budget allocation for vendors:
            Total Budget: {wedding_data['budgetRange']}
            Wedding Type: {wedding_data['weddingType']}
            Key Priorities: {', '.join(wedding_data.get('priorities', []))}
            
            Provide budget breakdown and recommendations.""",
            agent=self.agents["budget_analyst"]
        )
        
        # Create crew and process tasks
        crew = Crew(
            agents=[self.agents["vendor_researcher"], self.agents["budget_analyst"]],
            tasks=[vendor_task, budget_task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse and format results
        try:
            recommendations = self._parse_vendor_results(result)
            return recommendations
        except Exception as e:
            print(f"Error parsing vendor results: {e}")
            return {"error": str(e)}
    
    def get_style_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered style recommendations"""
        
        # Create style analysis task
        style_task = Task(
            description=f"""Analyze and recommend wedding style elements:
            Wedding Type: {wedding_data['weddingType']}
            Preferences: {wedding_data.get('visualPreferences', {})}
            Season: {wedding_data.get('season', 'Any')}
            
            Provide detailed style recommendations.""",
            agent=self.agents["style_consultant"]
        )
        
        # Create crew and process task
        crew = Crew(
            agents=[self.agents["style_consultant"]],
            tasks=[style_task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse and format results
        try:
            recommendations = self._parse_style_results(result)
            return recommendations
        except Exception as e:
            print(f"Error parsing style results: {e}")
            return {"error": str(e)}
    
    def get_timeline_recommendations(self, wedding_data: Dict) -> Dict:
        """Get AI-powered timeline recommendations"""
        
        # Create timeline planning task
        timeline_task = Task(
            description=f"""Create wedding planning timeline:
            Wedding Date: {wedding_data.get('weddingDate', 'TBD')}
            Wedding Type: {wedding_data['weddingType']}
            Events: {', '.join(wedding_data.get('events', []))}
            
            Provide detailed timeline with milestones.""",
            agent=self.agents["timeline_manager"]
        )
        
        # Create crew and process task
        crew = Crew(
            agents=[self.agents["timeline_manager"]],
            tasks=[timeline_task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse and format results
        try:
            recommendations = self._parse_timeline_results(result)
            return recommendations
        except Exception as e:
            print(f"Error parsing timeline results: {e}")
            return {"error": str(e)}
    
    def _parse_vendor_results(self, result: str) -> Dict:
        """Parse and structure vendor recommendation results"""
        try:
            # Extract vendor recommendations and budget insights
            recommendations = {
                "vendors": [],
                "budget_breakdown": {},
                "insights": []
            }
            
            # Basic parsing - can be enhanced with better NLP
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
                            category, amount = line.split(":")
                            recommendations["budget_breakdown"][category.strip()] = amount.strip()
                    elif current_section == "insights":
                        recommendations["insights"].append(line.strip())
            
            return recommendations
            
        except Exception as e:
            print(f"Error parsing vendor results: {e}")
            return {"error": str(e)}
    
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
            print(f"Error parsing style results: {e}")
            return {"error": str(e)}
    
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
                                recommendations["tasks"][current_milestone].append(line[1:].strip())
                        else:
                            current_milestone = line.strip()
                            recommendations["tasks"][current_milestone] = []
                    elif current_section == "critical_dates":
                        recommendations["critical_dates"].append(line.strip())
            
            return recommendations
            
        except Exception as e:
            print(f"Error parsing timeline results: {e}")
            return {"error": str(e)} 