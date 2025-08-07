from setup_agents_fixed import WeddingPlannerCrew, WeddingPlannerConfig, NocoDBConfig
from crewai import Task, Crew
from field_mapping_service import FieldMappingService
from correct_nocodb_api import CorrectNocoDBAPI
import json
from typing import Dict, Any, Optional

class IntegratedWeddingPlanner:
    def __init__(self):
        self.field_mapper = FieldMappingService()
        self.nocodb_api = CorrectNocoDBAPI()
        self.nocodb_config = NocoDBConfig()
        
    def process_wedding_form(self, frontend_form_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process wedding form data from frontend, create AI agents, and save to NocoDB
        """
        result = {
            "success": False,
            "created_records": {},
            "agent_insights": {},
            "errors": [],
            "wedding_id": None
        }
        
        try:
            # 1. Initialize AI agents with Nous-Hermes model
            planner = WeddingPlannerCrew(config=WeddingPlannerConfig(
                model="nous-hermes:latest",
                nocodb=self.nocodb_config
            ))
            
            # 2. Create agents
            budget_planner = planner.create_budget_planner()
            venue_planner = planner.create_venue_coordinator()
            vendor_planner = planner.create_vendor_matcher()
            
            # 3. Create tasksˀ
            budget_task = Task(
                        description=f"""Create a wedding budget plan for a {frontend_form_data.get('weddingType', 'traditional')} wedding in {frontend_form_data.get('city', 'Mumbai')}.
        Budget: {frontend_form_data.get('budgetRange', '₹30-50 Lakhs')}
        Guest Count: {frontend_form_data.get('guestCount', '200')}
        Style: {frontend_form_data.get('weddingStyle', 'Traditional')}
        Date: {frontend_form_data.get('weddingDate', '2024-12-25')}
                
                Please provide a detailed budget allocation across different categories.""",
                agent=budget_planner,
                expected_output="A detailed budget plan with category-wise allocations"
            )
            
            venue_task = Task(
                        description=f"""Find suitable venues for a {frontend_form_data.get('weddingType', 'traditional')} wedding in {frontend_form_data.get('city', 'Mumbai')}.
        Guest Count: {frontend_form_data.get('guestCount', '200')}
        Style: {frontend_form_data.get('weddingStyle', 'Traditional')}
        Special Requirements: {frontend_form_data.get('specialRequirements', 'None')}
                
                Please provide venue recommendations with details.""",
                agent=venue_planner,
                expected_output="A list of suitable venues with details"
            )
            
            vendor_task = Task(
                        description=f"""Find suitable vendors for a {frontend_form_data.get('weddingType', 'traditional')} wedding in {frontend_form_data.get('city', 'Mumbai')}.
        Events: {', '.join(frontend_form_data.get('events', ['Wedding Ceremony']))}
        Style: {frontend_form_data.get('weddingStyle', 'Traditional')}
        Priorities: {', '.join(frontend_form_data.get('priorities', ['Venue', 'Decor']))}
                
                Please provide vendor recommendations for each category.""",
                agent=vendor_planner,
                expected_output="A list of recommended vendors by category"
            )
            
            # 4. Create and run crew
            crew = Crew(
                agents=[budget_planner, venue_planner, vendor_planner],
                tasks=[budget_task, venue_task, vendor_task],
                verbose=True
            )
            
            # 5. Execute tasks
            print("\n🚀 Starting Wedding Planning with AI Agents...")
            print("📋 Wedding Details:")
            for key, value in frontend_form_data.items():
                print(f"  {key}: {value}")
            
            print("\n🤖 AI Agents are analyzing your wedding requirements...")
            planning_results = crew.kickoff()
            
            # 6. Save results to NocoDB
            wedding_record = {
                "Name": f"{frontend_form_data.get('yourName', '')} & {frontend_form_data.get('partnerName', '')}",
                "Date": frontend_form_data.get('weddingDate'),
                "Budget Total": frontend_form_data.get('budgetRange'),
                "Guest Count": frontend_form_data.get('guestCount'),
                "Status": "Planning",
                "Wedding Type": frontend_form_data.get('weddingType'),
                "City": frontend_form_data.get('city'),
                "Timeline Status": "Initial Planning",
                "Planning Phase": "AI Analysis",
                "Season": "To be determined"
            }
            
            # Create wedding record
            wedding_response = self.nocodb_api.create_record("weddings", wedding_record)
            if wedding_response and ("Id" in wedding_response or "id" in wedding_response):
                wedding_id = wedding_response.get("Id") or wedding_response.get("id")
                result["wedding_id"] = wedding_id
                
                # Save preferences
                preferences_record = {
                    "Wedding": wedding_id,
                    "Wedding Style": frontend_form_data.get('weddingStyle'),
                    "Events": json.dumps(frontend_form_data.get('events', [])),
                    "Priorities": json.dumps(frontend_form_data.get('priorities', [])),
                    "Special Requirements": frontend_form_data.get('specialRequirements')
                }
                self.nocodb_api.create_record("preferences", preferences_record)
                
                # Save AI activity
                ai_activity = {
                    "Wedding": wedding_id,
                    "Activity Type": "Initial Planning",
                    "Description": "AI agents analyzed wedding requirements and created initial plan",
                    "Output Actions": json.dumps(planning_results),
                    "Status": "Completed",
                    "Model Used": "nous-hermes:latest"
                }
                self.nocodb_api.create_record("ai_activities", ai_activity)
                
                result["success"] = True
                result["agent_insights"] = planning_results
            else:
                result["errors"].append("Failed to create wedding record in NocoDB")
            
        except Exception as e:
            result["errors"].append(f"Error during wedding planning: {str(e)}")
        
        return result

def test_integrated_planner():
    """Test the integrated wedding planner"""
    planner = IntegratedWeddingPlanner()
    
    # Sample frontend form data
    form_data = {
        "yourName": "Priya Sharma",
        "partnerName": "Rahul Patel",
        "weddingDate": "2024-12-25",
        "weddingType": "Hindu",
        "city": "Mumbai",
        "events": ["Engagement", "Sangeet", "Wedding Ceremony"],
        "duration": "3 Days",
        "guestCount": "200",
        "budgetRange": "₹30-50 Lakhs",
        "priorities": ["Venue", "Decor", "Photography"],
        "weddingStyle": "Traditional",
        "specialRequirements": "Looking for a heritage venue with modern amenities"
    }
    
    result = planner.process_wedding_form(form_data)
    
    print("\n✨ Wedding Planning Results:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_integrated_planner() 