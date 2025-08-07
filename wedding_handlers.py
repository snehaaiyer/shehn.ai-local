from typing import Dict, Any, List
import json
from datetime import datetime
from crewai import Agent, Task, Crew
import requests

# Table IDs
TABLE_IDS = {
    "couples": "mcv14lxgtp3rwa5",
    "venues": "m8o47zj6gmkmguz",
    "design_preferences": "mx7nrptxiiqbsty",  # Assuming preferences table stores design prefs
}

class WeddingDataHandler:
    def __init__(self, nocodb_api_url: str, nocodb_api_token: str):
        # Base should be something like https://app.nocodb.com/api/v2/tables
        self.nocodb_api_url = nocodb_api_url.rstrip("/")
        self.headers = {
            "xc-token": nocodb_api_token,
            "Content-Type": "application/json"
        }
        # Map logical names used in the code to actual table IDs in NocoDB
        self.table_map = {
            "couples": "m6v4on94fj53j9n",
            "venues": "m5n3t4l0edym7w4",
            "design_preferences": "mhkpiytp9rqyd20",  # Assuming preferences table stores design prefs
            # Add more mappings as needed
        }
        
    def save_to_nocodb(self, table: str, data: Dict[str, Any]) -> bool:
        try:
            table_id = self.table_map.get(table, table)  # default to the passed value if already an ID
            url = f"{self.nocodb_api_url}/{table_id}/records"
            response = requests.post(url, headers=self.headers, json=data)
            return response.status_code in (200, 201)
        except Exception as e:
            print(f"Error saving to NocoDB: {str(e)}")
            return False

class WeddingPlannerAgents:
    def __init__(self):
        # Initialize CrewAI agents
        self.budget_agent = Agent(
            role="Budget Planner",
            goal="Optimize wedding budget allocation",
            backstory="Expert in wedding financial planning and cost optimization with experience in various wedding scales and types",
            verbose=True,
            tools=[self.calculate_per_guest_cost, self.suggest_budget_allocation]
        )
        
        self.style_agent = Agent(
            role="Style Advisor",
            goal="Create cohesive wedding style and theme",
            backstory="Expert in wedding aesthetics and design coordination",
            verbose=True
        )
        
        self.vendor_agent = Agent(
            role="Vendor Coordinator",
            goal="Find and coordinate with suitable vendors",
            backstory="Expert in vendor research and management",
            verbose=True
        )

    def create_budget_task(self, wedding_data: Dict[str, Any]) -> Task:
        return Task(
            description="Analyze wedding details and create optimal budget allocation",
            agent=self.budget_agent,
            context=json.dumps(wedding_data)
        )

    def create_style_task(self, visual_selections: Dict[str, Any]) -> Task:
        return Task(
            description="Generate comprehensive style guide based on selections",
            agent=self.style_agent,
            context=json.dumps(visual_selections)
        )

    def create_vendor_task(self, requirements: Dict[str, Any]) -> Task:
        return Task(
            description="Research and recommend vendors matching requirements",
            agent=self.vendor_agent,
            context=json.dumps(requirements)
        )

    def calculate_per_guest_cost(self, total_budget: str, guest_count: int) -> Dict[str, Any]:
        """Calculate per guest cost and provide recommendations"""
        try:
            # Extract budget value
            budget_value = float(''.join(filter(str.isdigit, total_budget))) * 100000  # Convert lakhs to rupees
            per_guest = budget_value / guest_count
            
            return {
                "per_guest_cost": per_guest,
                "status": "optimal" if 3000 <= per_guest <= 10000 else "review",
                "recommendation": self._get_budget_recommendation(per_guest)
            }
        except Exception as e:
            return {"error": f"Budget calculation failed: {str(e)}"}

    def suggest_budget_allocation(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest budget allocation based on wedding type and preferences"""
        try:
            wedding_type = wedding_data.get("weddingType", "")
            duration = int(wedding_data.get("duration", "1").split()[0])
            priorities = wedding_data.get("priorities", [])
            
            # Base allocation percentages
            allocation = {
                "Venue": 25,
                "Catering": 30,
                "Decor": 15,
                "Photography": 10,
                "Entertainment": 8,
                "Outfits": 7,
                "Others": 5
            }
            
            # Adjust based on priorities
            for priority in priorities:
                if priority in allocation:
                    allocation[priority] += 3  # Increase priority items
                    allocation["Others"] -= 1  # Decrease from others
            
            # Adjust for multi-day events
            if duration > 1:
                allocation["Venue"] += 5 * (duration - 1)
                allocation["Catering"] += 5 * (duration - 1)
                allocation["Others"] -= 10 * (duration - 1)
            
            return {
                "allocation": allocation,
                "notes": self._get_allocation_notes(wedding_type, duration)
            }
        except Exception as e:
            return {"error": f"Budget allocation failed: {str(e)}"}

    def _get_budget_recommendation(self, per_guest: float) -> str:
        if per_guest < 3000:
            return "Consider reducing guest count or increasing budget for better experience"
        elif per_guest > 10000:
            return "Budget allows for premium services and elaborate arrangements"
        return "Budget is well-balanced for a comfortable celebration"

    def _get_allocation_notes(self, wedding_type: str, duration: int) -> List[str]:
        notes = []
        if wedding_type in ["Hindu", "Sikh"] and duration > 2:
            notes.append("Consider package deals for multi-day venue booking")
            notes.append("Bulk catering discounts available for multiple events")
        if wedding_type == "Destination":
            notes.append("Factor in guest transportation and accommodation")
        return notes

class FormSubmissionHandler:
    def __init__(self, data_handler: WeddingDataHandler, planner_agents: WeddingPlannerAgents):
        self.data_handler = data_handler
        self.planner_agents = planner_agents
        
    def process_wedding_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        # Save basic information
        self.data_handler.save_to_nocodb("couples", {
            "partner1_name": form_data.get("partner1_name"),
            "partner2_name": form_data.get("partner2_name"),
            "wedding_date": form_data.get("wedding_date"),
            "created_at": datetime.now().isoformat()
        })
        
        # Save venue preferences
        self.data_handler.save_to_nocodb("venues", {
            "venue_type": form_data.get("venue_type"),
            "guest_count": form_data.get("guest_count"),
            "location": form_data.get("venue_location"),
            "budget": form_data.get("venue_budget")
        })
        
        return {"status": "success", "message": "Form data processed successfully"}

class VisualSelectionHandler:
    def __init__(self, data_handler: WeddingDataHandler, planner_agents: WeddingPlannerAgents):
        self.data_handler = data_handler
        self.planner_agents = planner_agents
        
    def process_visual_selections(self, selections: Dict[str, Any]) -> Dict[str, Any]:
        # Save theme and style selections
        self.data_handler.save_to_nocodb("design_preferences", {
            "color_palette": selections.get("color_palette"),
            "theme": selections.get("theme"),
            "decor_elements": json.dumps(selections.get("decor", {}))
        })
        
        # Create style guide task
        style_task = self.planner_agents.create_style_task(selections)
        
        return {
            "status": "success",
            "message": "Visual selections processed successfully",
            "style_task_id": style_task.task_id
        }

class RecommendationHandler:
    def __init__(self, planner_agents: WeddingPlannerAgents):
        self.planner_agents = planner_agents
        
    def generate_recommendations(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        # Create tasks for different aspects
        budget_task = self.planner_agents.create_budget_task(wedding_data)
        vendor_task = self.planner_agents.create_vendor_task(wedding_data)
        
        # Create a crew to execute tasks
        wedding_crew = Crew(
            agents=[
                self.planner_agents.budget_agent,
                self.planner_agents.vendor_agent
            ],
            tasks=[budget_task, vendor_task]
        )
        
        # Get recommendations
        result = wedding_crew.kickoff()
        
        return {
            "status": "success",
            "recommendations": result
        } 