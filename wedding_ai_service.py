#!/usr/bin/env python3
"""
Complete Wedding AI Service - FastAPI with CrewAI + NocoDB Integration
Handles frontend requests with AI-powered wedding planning
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime

# Import local services
from production_wedding_agents import ProductionWeddingAgents
from fixed_nocodb_api import NocoDBAPI
from budget_allocation_service import BudgetAllocationService
from field_mapping_service import FieldMappingService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="BID AI Wedding Assistant",
    description="AI-powered wedding planning with CrewAI agents and NocoDB",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    crewai_agents = ProductionWeddingAgents()
    nocodb_api = NocoDBAPI()
    budget_service = BudgetAllocationService()
    field_mapper = FieldMappingService()
    logger.info("✅ All services initialized successfully")
except Exception as e:
    logger.error(f"❌ Service initialization failed: {e}")
    crewai_agents = None
    nocodb_api = None
    budget_service = None
    field_mapper = None

# Pydantic models for API requests
class WeddingFormData(BaseModel):
    yourName: str
    partnerName: str
    city: str
    weddingDate: str
    budget: str
    guestCount: int
    weddingType: str
    duration: str
    events: List[str]
    priorities: List[str]
    specialRequirements: Optional[str] = ""

class VendorSearchRequest(BaseModel):
    city: str
    category: str
    wedding_type: str = "Traditional"
    guest_count: int = 200
    budget: str = "₹20-30 Lakhs"

class BudgetAnalysisRequest(BaseModel):
    budget_range: str
    priorities: List[str]
    guest_count: int = 200
    wedding_style: str = "Traditional"

# Health check endpoint
@app.get("/")
async def root():
    return {
        "service": "BID AI Wedding Assistant",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "AI-powered wedding planning",
            "CrewAI agent consultation", 
            "NocoDB data storage",
            "Intelligent budget allocation",
            "Vendor recommendations"
        ],
        "endpoints": {
            "health": "/health",
            "submit_wedding": "/submit-wedding",
            "ai_consultation": "/ai-consultation", 
            "budget_analysis": "/budget-analysis",
            "vendor_search": "/vendor-search",
            "wedding_data": "/wedding/{wedding_id}"
        }
    }

@app.get("/health")
async def health_check():
    services_status = {
        "timestamp": datetime.now().isoformat(),
        "ollama_llm": crewai_agents is not None and crewai_agents.llm is not None,
        "crewai_agents": crewai_agents is not None,
        "nocodb_api": nocodb_api is not None,
        "budget_service": budget_service is not None,
        "field_mapper": field_mapper is not None
    }
    
    all_healthy = all(services_status.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "services": services_status,
        "message": "All systems operational" if all_healthy else "Some services unavailable"
    }

@app.post("/submit-wedding")
async def submit_wedding(wedding_data: WeddingFormData):
    """Complete wedding form submission with AI analysis and NocoDB storage"""
    if not nocodb_api or not field_mapper:
        raise HTTPException(status_code=503, detail="Database services unavailable")
    
    try:
        logger.info(f"🎉 Processing wedding for {wedding_data.yourName} & {wedding_data.partnerName}")
        
        result = {
            "success": False,
            "wedding_id": None,
            "ai_insights": {},
            "budget_analysis": {},
            "database_records": {},
            "errors": []
        }
        
        # Convert Pydantic model to dict for processing
        form_dict = wedding_data.dict()
        
        # Step 1: AI Agent Analysis (if available)
        if crewai_agents and crewai_agents.llm:
            logger.info("🤖 Getting AI agent insights...")
            try:
                ai_result = crewai_agents.process_wedding_form(form_dict)
                if ai_result.get("success"):
                    result["ai_insights"] = ai_result
                    logger.info("✅ AI analysis completed")
                else:
                    result["errors"].append("AI analysis failed")
            except Exception as e:
                logger.warning(f"AI analysis failed: {e}")
                result["errors"].append(f"AI analysis error: {str(e)}")
        
        # Step 2: Budget Analysis
        if budget_service:
            logger.info("💰 Calculating budget allocation...")
            try:
                budget_result = budget_service.calculate_budget_allocation(
                    budget_range=wedding_data.budget,
                    priorities=wedding_data.priorities,
                    guest_count=wedding_data.guestCount,
                    wedding_style=wedding_data.weddingType
                )
                if budget_result.get("success"):
                    result["budget_analysis"] = budget_result
                    logger.info("✅ Budget analysis completed")
            except Exception as e:
                logger.warning(f"Budget analysis failed: {e}")
                result["errors"].append(f"Budget analysis error: {str(e)}")
        
        # Step 3: Database Storage
        logger.info("💾 Storing wedding data...")
        try:
            # Transform frontend data to database format
            db_records = field_mapper.transform_frontend_to_db(form_dict)
            
            created_records = {}
            table_order = field_mapper.get_table_order()
            
            for table_name in table_order:
                if table_name in db_records:
                    record_data = db_records[table_name]
                    
                    # Create record in NocoDB
                    created_record = nocodb_api.create_record(table_name, record_data)
                    
                    if created_record and ("Id" in created_record or "id" in created_record):
                        record_id = created_record.get("Id") or created_record.get("id")
                        created_records[table_name] = {
                            "id": record_id,
                            "data": record_data
                        }
                        
                        # Store wedding ID for reference
                        if table_name == "weddings":
                            result["wedding_id"] = record_id
                        
                        logger.info(f"✅ Created {table_name} record: {record_id}")
                    else:
                        error_msg = f"Failed to create {table_name} record"
                        result["errors"].append(error_msg)
                        logger.error(error_msg)
            
            result["database_records"] = created_records
            result["success"] = len(created_records) > 0
            
        except Exception as e:
            error_msg = f"Database storage failed: {str(e)}"
            result["errors"].append(error_msg)
            logger.error(error_msg)
        
        # Step 4: Generate summary
        if result["success"]:
            couple_names = f"{wedding_data.yourName} & {wedding_data.partnerName}"
            result["summary"] = f"✅ Wedding plan created for {couple_names}! Wedding ID: {result['wedding_id']}"
            
            if result.get("ai_insights", {}).get("success"):
                result["summary"] += "\n🤖 AI consultation completed with personalized recommendations"
            
            if result.get("budget_analysis", {}).get("success"):
                total_budget = result["budget_analysis"]["total_budget"]
                result["summary"] += f"\n💰 Budget analysis completed for ₹{total_budget:,}"
            
            logger.info(f"🎉 SUCCESS: {result['summary']}")
        else:
            result["summary"] = f"❌ Wedding submission failed: {'; '.join(result['errors'])}"
            logger.error(result["summary"])
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Wedding submission error: {e}")
        raise HTTPException(status_code=500, detail=f"Wedding submission failed: {str(e)}")

@app.post("/ai-consultation")
async def ai_consultation(wedding_data: WeddingFormData):
    """Get AI-powered wedding planning consultation"""
    if not crewai_agents or not crewai_agents.llm:
        raise HTTPException(status_code=503, detail="AI agents unavailable")
    
    try:
        logger.info("🤖 Starting AI consultation...")
        form_dict = wedding_data.dict()
        
        result = crewai_agents.process_wedding_form(form_dict)
        
        if result.get("success"):
            logger.info("✅ AI consultation completed")
            return {
                "success": True,
                "consultation": result,
                "timestamp": datetime.now().isoformat(),
                "agents_used": result.get("agents_used", [])
            }
        else:
            raise HTTPException(status_code=500, detail="AI consultation failed")
            
    except Exception as e:
        logger.error(f"❌ AI consultation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI consultation failed: {str(e)}")

@app.post("/budget-analysis")
async def budget_analysis(request: BudgetAnalysisRequest):
    """Get detailed budget analysis and allocation"""
    if not budget_service:
        raise HTTPException(status_code=503, detail="Budget service unavailable")
    
    try:
        logger.info(f"💰 Analyzing budget: {request.budget_range}")
        
        result = budget_service.calculate_budget_allocation(
            budget_range=request.budget_range,
            priorities=request.priorities,
            guest_count=request.guest_count,
            wedding_style=request.wedding_style
        )
        
        if result.get("success"):
            logger.info("✅ Budget analysis completed")
            return result
        else:
            raise HTTPException(status_code=500, detail="Budget analysis failed")
            
    except Exception as e:
        logger.error(f"❌ Budget analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Budget analysis failed: {str(e)}")

@app.post("/vendor-search")
async def vendor_search(request: VendorSearchRequest):
    """AI-powered vendor search and recommendations"""
    if not crewai_agents or not crewai_agents.llm:
        raise HTTPException(status_code=503, detail="AI agents unavailable")
    
    try:
        logger.info(f"🔍 Searching {request.category} vendors in {request.city}")
        
        # Use vendor agent for recommendations
        vendor_context = {
            "city": request.city,
            "category": request.category,
            "weddingType": request.wedding_type,
            "guestCount": request.guest_count,
            "budgetRange": request.budget
        }
        
        # This would use the vendor agent from CrewAI
        result = crewai_agents.process_wedding_form(vendor_context)
        
        return {
            "success": True,
            "search_params": request.dict(),
            "vendor_recommendations": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Vendor search error: {e}")
        raise HTTPException(status_code=500, detail=f"Vendor search failed: {str(e)}")

@app.get("/wedding/{wedding_id}")
async def get_wedding_data(wedding_id: str):
    """Retrieve wedding data from NocoDB"""
    if not nocodb_api:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        logger.info(f"📖 Retrieving wedding data: {wedding_id}")
        
        # Get wedding record from NocoDB
        wedding_records = nocodb_api.get_records("weddings", f"Id={wedding_id}")
        
        if not wedding_records.get("list"):
            raise HTTPException(status_code=404, detail="Wedding not found")
        
        wedding_data = wedding_records["list"][0]
        
        return {
            "success": True,
            "wedding_id": wedding_id,
            "wedding_data": wedding_data,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Wedding data retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve wedding data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("🌸 BID AI Wedding Assistant API Service")
    print("=" * 50)
    print("🤖 CrewAI Agents: Enabled")
    print("💾 NocoDB Integration: Enabled") 
    print("💰 Budget Analysis: Enabled")
    print("🔍 Vendor Search: AI-Powered")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable reload for production
        log_level="info"
    ) 