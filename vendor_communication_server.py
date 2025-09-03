
#!/usr/bin/env python3
"""
Vendor Communication Server
Dedicated server for vendor communication operations on port 5004
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import uvicorn
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.api_config import CORS_ORIGINS

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Vendor Communication API",
    description="Vendor communication and messaging API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageRequest(BaseModel):
    vendor_id: str
    message: str
    contact_method: str  # "email", "whatsapp", "phone"
    sender_name: str
    sender_contact: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Vendor Communication API",
        "port": 5004,
        "endpoints": [
            "/health",
            "/send-message",
            "/get-conversations",
            "/mark-as-read"
        ]
    }

@app.post("/send-message")
async def send_message(request: MessageRequest):
    """Send message to vendor"""
    try:
        # Mock implementation for now
        result = {
            "success": True,
            "message_id": f"msg_{request.vendor_id}_{request.contact_method}",
            "vendor_id": request.vendor_id,
            "contact_method": request.contact_method,
            "status": "sent",
            "timestamp": "2025-09-03T09:54:00Z"
        }
        
        logger.info(f"📨 Message sent to vendor {request.vendor_id} via {request.contact_method}")
        return result
    except Exception as e:
        logger.error(f"❌ Message sending error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-conversations")
async def get_conversations(vendor_id: str):
    """Get conversation history with vendor"""
    try:
        # Mock implementation
        conversations = [
            {
                "message_id": f"msg_{vendor_id}_1",
                "message": "Hello, I'm interested in your services for my wedding.",
                "sender": "customer",
                "timestamp": "2025-09-03T09:50:00Z",
                "status": "delivered"
            }
        ]
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "conversations": conversations,
            "total_messages": len(conversations)
        }
    except Exception as e:
        logger.error(f"❌ Conversations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mark-as-read")
async def mark_as_read(vendor_id: str, message_id: str):
    """Mark message as read"""
    try:
        return {
            "success": True,
            "vendor_id": vendor_id,
            "message_id": message_id,
            "status": "read",
            "timestamp": "2025-09-03T09:54:00Z"
        }
    except Exception as e:
        logger.error(f"❌ Mark as read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting Vendor Communication API on port 5004...")
    print("📊 Health endpoint: http://0.0.0.0:5004/health")
    print("🔗 API docs: http://0.0.0.0:5004/docs")
    uvicorn.run(app, host="0.0.0.0", port=5004, reload=False)
