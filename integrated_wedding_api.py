from typing import Dict, Any, Optional
import json
from datetime import datetime
from field_mapping_service import FieldMappingService
from fixed_nocodb_api import NocoDBAPI
from budget_allocation_service import BudgetAllocationService

class IntegratedWeddingAPI:
    """
    Complete wedding API service that handles frontend form data transformation and NocoDB storage
    Now with AI Agent-powered budget allocation
    """
    
    def __init__(self):
        self.field_mapper = FieldMappingService()
        self.nocodb_api = NocoDBAPI()
        self.agent_budget_service = BudgetAllocationService()
        self.created_records = {}  # Track created records for linking
    
    def process_wedding_form(self, frontend_form_data: Dict[str, Any], include_agents: bool = True) -> Dict[str, Any]:
        """
        Complete workflow: Frontend form → Field mapping → Agent analysis → NocoDB storage
        Returns summary of created records, agent insights, and any errors
        """
        result = {
            "success": False,
            "created_records": {},
            "agent_budget_analysis": {},
            "errors": [],
            "wedding_id": None,
            "summary": ""
        }
        
        try:
            print("🚀 Processing Wedding Form Submission with AI Agents")
            print("="*70)
            
            # Step 1: Transform frontend data to database format
            print("1. Transforming field names...")
            db_records = self.field_mapper.transform_frontend_to_db(frontend_form_data)
            
            # Step 2: Get AI Agent budget analysis (optional but recommended)
            if include_agents:
                print("2. Getting AI Agent budget analysis...")
                # Extract budget info from form data
                budget_range = frontend_form_data.get('budget', '₹10-20 Lakhs')
                priorities = frontend_form_data.get('priorities', ['Venue', 'Food'])
                guest_count = int(frontend_form_data.get('guestCount', 150))
                wedding_type = frontend_form_data.get('weddingType', 'Traditional')
                
                agent_budget_result = self.agent_budget_service.calculate_budget_allocation(
                    budget_range=budget_range,
                    priorities=priorities,
                    guest_count=guest_count,
                    wedding_style=wedding_type
                )
                
                if agent_budget_result["success"]:
                    result["agent_budget_analysis"] = agent_budget_result
                    print("✅ Agent analysis complete!")
                else:
                    print("⚠️ Agent analysis failed, continuing without it...")
                    result["errors"].append(f"Agent analysis failed: {agent_budget_result.get('error', 'Unknown')}")
            
            # Step 3: Validate all records
            print("3. Validating data...")
            validation_errors = []
            for table_name, record in db_records.items():
                is_valid, missing_fields = self.field_mapper.validate_record(table_name, record)
                if not is_valid:
                    validation_errors.append(f"{table_name}: Missing {missing_fields}")
            
            if validation_errors:
                result["errors"] = validation_errors
                result["summary"] = f"Validation failed: {'; '.join(validation_errors)}"
                return result
            
            print("✅ All data valid!")
            
            # Step 4: Create records in proper order (foreign key dependencies)
            print("4. Creating database records...")
            table_order = self.field_mapper.get_table_order()
            
            for table_name in table_order:
                if table_name in db_records:
                    record_data = db_records[table_name]
                    
                    # Add foreign key references if needed
                    if table_name == "weddings" and "couples" in self.created_records:
                        # Link wedding to couple (if your schema requires it)
                        # record_data["couple_id"] = self.created_records["couples"]["Id"]
                        pass
                    
                    print(f"Creating {table_name} record...")
                    created_record = self.nocodb_api.create_record(table_name, record_data)
                    
                    if created_record and ("Id" in created_record or "id" in created_record):
                        record_id = created_record.get("Id") or created_record.get("id")
                        self.created_records[table_name] = created_record
                        result["created_records"][table_name] = {
                            "id": record_id,
                            "data": record_data
                        }
                        print(f"✅ Created {table_name} with ID: {record_id}")
                        
                        # Store wedding ID for easy access
                        if table_name == "weddings":
                            result["wedding_id"] = record_id
                    else:
                        error_msg = f"Failed to create {table_name} record"
                        result["errors"].append(error_msg)
                        print(f"❌ {error_msg}")
                        return result
            
            # Step 5: Create enhanced summary with agent insights
            result["success"] = True
            couple_names = f"{frontend_form_data.get('yourName', '')} & {frontend_form_data.get('partnerName', '')}"
            
            # Enhanced summary with agent analysis
            base_summary = f"Successfully created wedding for {couple_names}. Wedding ID: {result['wedding_id']}"
            
            if result.get("agent_budget_analysis", {}).get("success"):
                agent_summary = result["agent_budget_analysis"]["summary"]
                result["summary"] = f"{base_summary}\n\n🤖 AI Agent Analysis:\n{agent_summary}"
            else:
                result["summary"] = base_summary
            
            print(f"\n🎉 SUCCESS! {base_summary}")
            if result.get("agent_budget_analysis", {}).get("success"):
                print(f"🤖 Agent Budget Analysis: Confidence {result['agent_budget_analysis']['final_allocation'].get('confidence_score', 0.8):.1%}")
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            result["errors"].append(error_msg)
            result["summary"] = error_msg
            print(f"❌ {error_msg}")
        
        return result
    
    def get_wedding_details_with_budget(self, wedding_id: str) -> Dict[str, Any]:
        """
        Retrieve complete wedding details including budget analysis
        """
        try:
            # Get wedding record
            wedding_records = self.nocodb_api.get_records("weddings", f"Id={wedding_id}")
            
            if not wedding_records.get("list"):
                return {"error": "Wedding not found"}
            
            wedding_data = wedding_records["list"][0]
            
            # Get budget analysis if available
            # This would need to be stored in database or regenerated
            
            return {
                "success": True,
                "wedding_data": wedding_data,
                "budget_analysis": {},  # Would include stored budget analysis
                "frontend_format": {}   # Would transform back using field_mapper
            }
            
        except Exception as e:
            return {"error": f"Failed to retrieve wedding: {str(e)}"}
    
    def update_wedding_with_agent_analysis(self, wedding_id: str, new_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update wedding preferences and re-run agent analysis
        """
        try:
            # Get current wedding data
            current_data = self.get_wedding_details_with_budget(wedding_id)
            if "error" in current_data:
                return current_data
            
            # Merge new preferences
            updated_data = {**current_data["wedding_data"], **new_preferences}
            
            # Re-run agent analysis
            agent_result = self.agent_budget_service.get_agent_budget_allocation(updated_data)
            
            return {
                "success": True,
                "updated_analysis": agent_result,
                "wedding_id": wedding_id
            }
            
        except Exception as e:
            return {"error": f"Failed to update wedding analysis: {str(e)}"}

def create_enhanced_frontend_api_endpoint():
    """
    Create an enhanced API endpoint function that frontend can call with agent support
    """
    wedding_api = IntegratedWeddingAPI()
    
    def handle_form_submission_with_agents(form_data_json: str, include_agents: bool = True) -> str:
        """
        Handle form submission from frontend with optional AI agent analysis
        Expects JSON string of form data, returns JSON string of result with agent insights
        """
        try:
            form_data = json.loads(form_data_json) if isinstance(form_data_json, str) else form_data_json
            result = wedding_api.process_wedding_form(form_data, include_agents=include_agents)
            return json.dumps(result, indent=2)
        except Exception as e:
            error_result = {
                "success": False,
                "errors": [f"API Error: {str(e)}"],
                "summary": "Failed to process form submission",
                "agent_budget_analysis": {}
            }
            return json.dumps(error_result, indent=2)
    
    return handle_form_submission_with_agents

# Test the complete integration with agents
def test_complete_integration_with_agents():
    """Test the complete Frontend → Agent Analysis → Database workflow"""
    
    # Sample data matching your frontend widget exactly
    frontend_data = {
        "yourName": "Sneha",
        "partnerName": "Arjun", 
        "weddingDate": "2024-06-15",
        "weddingType": "Hindu",
        "city": "Bangalore",
        "events": ["Engagement", "Mehendi", "Sangeet", "Wedding Ceremony", "Reception"],
        "duration": "4+ Days",
        "guestCount": 250,
        "budgetRange": "₹30-50 Lakhs",
        "priorities": ["Venue", "Photography", "Decor"],
        "weddingStyle": "Traditional",
        "specialRequirements": "Need vegetarian catering, traditional decorations, and live music for sangeet"
    }
    
    print("🧪 Testing Complete Integration with AI Agents")
    print("="*70)
    print("Input Frontend Data:")
    for key, value in frontend_data.items():
        print(f"  {key}: {value}")
    
    # Test the integration
    api = IntegratedWeddingAPI()
    result = api.process_wedding_form(frontend_data, include_agents=True)
    
    print("\n📊 FINAL RESULT:")
    print("="*70)
    
    # Print summary
    print(f"Success: {result['success']}")
    print(f"Wedding ID: {result.get('wedding_id', 'N/A')}")
    
    if result.get("agent_budget_analysis", {}).get("success"):
        print(f"\n🤖 AI Agent Analysis:")
        agent_analysis = result["agent_budget_analysis"]
        print(f"  Confidence Score: {agent_analysis['final_allocation'].get('confidence_score', 0.8):.1%}")
        print(f"  Agent Insights: {len(agent_analysis.get('agent_insights', []))} insights generated")
        
        # Show priority budget breakdown
        if "priority_based_allocations" in agent_analysis["final_allocation"]:
            print(f"\n💰 Priority Budget Allocation:")
            priority_breakdown = agent_analysis["final_allocation"]["priority_based_allocations"]
            for key, value in priority_breakdown.items():
                if key.startswith("Priority_"):
                    print(f"  {value['category']}: {value['amount_formatted']} ({value['percentage']}%)")
    
    if result.get("errors"):
        print(f"\n❌ Errors: {result['errors']}")
    
    print(f"\n📋 Summary: {result['summary']}")
    
    return result

if __name__ == "__main__":
    test_complete_integration_with_agents() 