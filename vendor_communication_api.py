
#!/usr/bin/env python3
"""
Vendor Communication API
Comprehensive vendor communication management with email, WhatsApp, and analytics
"""

import uvicorn
import json
import os
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import logging
from dataclasses import dataclass, asdict
import asyncio
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App Setup
app = FastAPI(
    title="Vendor Communication API",
    description="Comprehensive vendor communication management system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class VendorInfo(BaseModel):
    id: str
    name: str
    category: str
    location: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class WeddingInfo(BaseModel):
    couple_names: str
    wedding_date: str
    location: str
    guest_count: int
    contact_email: str
    contact_phone: str
    budget_range: Optional[str] = None
    special_requirements: Optional[str] = None

class CommunicationMessage(BaseModel):
    id: str
    type: str  # email, whatsapp, phone, meeting, system
    direction: str  # sent, received
    subject: Optional[str] = None
    content: str
    timestamp: str
    status: str  # sent, delivered, read, replied, failed
    attachments: Optional[List[str]] = None

class Quotation(BaseModel):
    amount: float
    currency: str = "INR"
    description: str
    valid_until: str
    inclusions: List[str]
    exclusions: List[str]
    payment_terms: str
    advances: List[Dict[str, Any]]

class VendorCommunication(BaseModel):
    id: str
    vendor_info: VendorInfo
    wedding_info: WeddingInfo
    status: str
    priority: str
    messages: List[CommunicationMessage]
    quotation: Optional[Quotation] = None
    contact_date: str
    response_date: Optional[str] = None
    quotation_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    response_time_hours: Optional[float] = None
    negotiation_count: int = 0
    price_reductions: float = 0
    notes: str = ""
    tags: List[str] = []
    created_at: str
    updated_at: str

class MessageRequest(BaseModel):
    communication_id: str
    message_type: str
    content: str
    subject: Optional[str] = None

class QuotationRequest(BaseModel):
    communication_id: str
    quotation: Quotation

# In-memory storage (replace with database in production)
communications_store: Dict[str, VendorCommunication] = {}

class CommunicationAgent:
    """AI-powered communication agent for vendor interactions"""
    
    def __init__(self):
        self.category_templates = {
            'venues': {
                'inquiry': self._venue_inquiry_template,
                'follow_up': self._venue_follow_up_template,
                'negotiation': self._venue_negotiation_template
            },
            'photography': {
                'inquiry': self._photography_inquiry_template,
                'follow_up': self._photography_follow_up_template,
                'negotiation': self._photography_negotiation_template
            },
            'catering': {
                'inquiry': self._catering_inquiry_template,
                'follow_up': self._catering_follow_up_template,
                'negotiation': self._catering_negotiation_template
            }
        }
    
    def generate_message(self, category: str, message_type: str, vendor_info: VendorInfo, wedding_info: WeddingInfo, **kwargs) -> str:
        """Generate appropriate message based on category and type"""
        template_func = self.category_templates.get(category, {}).get(message_type)
        if template_func:
            return template_func(vendor_info, wedding_info, **kwargs)
        else:
            return self._generic_template(vendor_info, wedding_info, message_type, **kwargs)
    
    def _venue_inquiry_template(self, vendor: VendorInfo, wedding: WeddingInfo, **kwargs) -> str:
        return f"""Dear {vendor.name} Team,

I hope this email finds you well. My partner and I are planning our wedding and are very interested in your beautiful venue for our special day.

Wedding Details:
• Date: {wedding.wedding_date}
• Guest Count: {wedding.guest_count} people
• Location Preference: {wedding.location}
• Couple: {wedding.couple_names}

We would love to know more about:
• Availability for our wedding date
• Venue packages and pricing options
• Included amenities and services
• Catering arrangements and policies
• Decoration guidelines and restrictions
• Parking facilities for guests
• Accommodation options if available

We are particularly drawn to your venue because of its {vendor.location} location and reputation for hosting memorable celebrations. Could we also schedule a site visit to see the venue in person?

Our contact information:
• Email: {wedding.contact_email}
• Phone: {wedding.contact_phone}

Thank you for your time, and we look forward to hearing from you soon.

Warm regards,
{wedding.couple_names}"""

    def _venue_follow_up_template(self, vendor: VendorInfo, wedding: WeddingInfo, days_since_contact: int = 7, **kwargs) -> str:
        return f"""Dear {vendor.name} Team,

I hope you're doing well. I wanted to follow up on our inquiry sent {days_since_contact} days ago regarding our wedding venue booking for {wedding.wedding_date}.

We remain very interested in your venue and would appreciate any information you can share about:
• Availability for our date
• Package options and pricing
• Next steps for booking

As we're in the process of finalizing our venue, a prompt response would be greatly appreciated.

Thank you for your time.

Best regards,
{wedding.couple_names}
{wedding.contact_phone}"""

    def _venue_negotiation_template(self, vendor: VendorInfo, wedding: WeddingInfo, current_quote: float, desired_quote: float, **kwargs) -> str:
        savings_requested = current_quote - desired_quote
        percentage_reduction = (savings_requested / current_quote) * 100
        
        return f"""Dear {vendor.name} Team,

Thank you for your detailed quotation of ₹{current_quote:,.0f} for our wedding venue on {wedding.wedding_date}.

We are very impressed with your venue and services. However, after reviewing our budget, we were hoping to work within a range closer to ₹{desired_quote:,.0f}.

Would it be possible to:
• Adjust the package to fit our budget
• Offer any seasonal or early booking discounts
• Provide a customized package that meets our essential needs

We are flexible on some services and would be happy to discuss which elements are most important to us. We're also prepared to make a quick decision if we can reach a mutually beneficial agreement.

Thank you for considering our request. We hope to celebrate our special day at your beautiful venue.

Best regards,
{wedding.couple_names}
{wedding.contact_email}
{wedding.contact_phone}"""

    def _photography_inquiry_template(self, vendor: VendorInfo, wedding: WeddingInfo, **kwargs) -> str:
        return f"""Dear {vendor.name},

We are planning our wedding for {wedding.wedding_date} and are looking for a talented photographer to capture our special day.

Wedding Details:
• Date: {wedding.wedding_date}
• Guest Count: {wedding.guest_count}
• Venue: {wedding.location}
• Couple: {wedding.couple_names}

We would love to learn more about:
• Your photography style and approach
• Available packages and pricing
• What's included in each package
• Pre-wedding shoot options
• Videography services if available
• Timeline and logistics on the wedding day
• Delivery timeline for photos

Could you please share your portfolio and package details? We would also appreciate if you could let us know your availability for our date.

Contact Information:
• Email: {wedding.contact_email}
• Phone: {wedding.contact_phone}

Looking forward to potentially working with you to capture our memories.

Best regards,
{wedding.couple_names}"""

    def _photography_follow_up_template(self, vendor: VendorInfo, wedding: WeddingInfo, days_since_contact: int = 5, **kwargs) -> str:
        return f"""Dear {vendor.name},

I hope you're well. I wanted to follow up on our photography inquiry for our wedding on {wedding.wedding_date}.

We're excited about the possibility of working with you and would love to move forward with booking if you're available. Could you please share:
• Your availability confirmation
• Package details and pricing
• Next steps for securing our date

We're in the process of finalizing our photography arrangements and would appreciate your response.

Thank you!

{wedding.couple_names}
{wedding.contact_phone}"""

    def _photography_negotiation_template(self, vendor: VendorInfo, wedding: WeddingInfo, current_quote: float, desired_quote: float, **kwargs) -> str:
        return f"""Dear {vendor.name},

Thank you for your photography proposal of ₹{current_quote:,.0f}. We really appreciate the time you took to put together a comprehensive package.

Your work is beautiful and we would love to work with you. However, our photography budget is closer to ₹{desired_quote:,.0f}. 

Would you be able to offer:
• A modified package within our budget range
• Payment plan options
• Reduced hours of coverage if that helps with pricing

We're flexible on some deliverables and would be happy to discuss what would work best for both of us.

Thank you for considering our request.

Best regards,
{wedding.couple_names}
{wedding.contact_email}"""

    def _catering_inquiry_template(self, vendor: VendorInfo, wedding: WeddingInfo, **kwargs) -> str:
        cuisine_preference = kwargs.get('cuisine_preference', 'Indian and Continental')
        
        return f"""Dear {vendor.name} Team,

Greetings! We are planning our wedding celebration and would like to inquire about your catering services.

Wedding Details:
• Date: {wedding.wedding_date}
• Guest Count: {wedding.guest_count}
• Venue: {wedding.location}
• Couple: {wedding.couple_names}

We would appreciate information about:
• Menu options and packages available
• Pricing per plate for different menu categories
• Service style options (buffet, plated, stations)
• Cuisine specialties (we're particularly interested in {cuisine_preference})
• Dietary accommodation (vegetarian, vegan, allergies)
• Setup and service staff included
• Tasting session availability
• Equipment and logistics provided

Additional requirements:
• Any special dietary needs can be discussed
• We prefer fresh, high-quality ingredients
• Service excellence is important to us

Could you please share your menu options and pricing? We would also love to schedule a tasting session.

Contact Information:
• Email: {wedding.contact_email}
• Phone: {wedding.contact_phone}

Thank you for your time!

Best regards,
{wedding.couple_names}"""

    def _catering_follow_up_template(self, vendor: VendorInfo, wedding: WeddingInfo, days_since_contact: int = 6, **kwargs) -> str:
        return f"""Dear {vendor.name} Team,

I hope you're doing well. Following up on our catering inquiry sent {days_since_contact} days ago for our wedding on {wedding.wedding_date}.

We are still very interested in your catering services and would appreciate:
• Menu options and pricing information
• Availability confirmation for our date
• Tasting session scheduling

We're in the process of finalizing our catering arrangements and your prompt response would be very helpful.

Thank you!

{wedding.couple_names}
{wedding.contact_phone}"""

    def _catering_negotiation_template(self, vendor: VendorInfo, wedding: WeddingInfo, current_quote: float, desired_quote: float, **kwargs) -> str:
        per_plate_current = current_quote / wedding.guest_count
        per_plate_desired = desired_quote / wedding.guest_count
        
        return f"""Dear {vendor.name} Team,

Thank you for your catering proposal of ₹{current_quote:,.0f} (₹{per_plate_current:,.0f} per plate) for {wedding.guest_count} guests.

We were impressed with your menu options and service approach. However, our catering budget is closer to ₹{desired_quote:,.0f} (₹{per_plate_desired:,.0f} per plate).

Could we explore options such as:
• Simplified menu with fewer courses
• Modified service style
• Reduced server-to-guest ratio
• Alternative menu items that fit our budget

We're flexible on menu details and would appreciate your suggestions for working within our budget while maintaining food quality.

Thank you for your understanding.

Best regards,
{wedding.couple_names}
{wedding.contact_email}"""

    def _generic_template(self, vendor: VendorInfo, wedding: WeddingInfo, message_type: str, **kwargs) -> str:
        return f"""Dear {vendor.name},

Thank you for your interest in being part of our wedding celebration on {wedding.wedding_date}.

We are looking for {vendor.category} services for {wedding.guest_count} guests at {wedding.location}.

Please share your available packages, pricing, and next steps.

Best regards,
{wedding.couple_names}
{wedding.contact_email}
{wedding.contact_phone}"""

    def generate_whatsapp_message(self, vendor: VendorInfo, wedding: WeddingInfo) -> str:
        """Generate WhatsApp-friendly shorter message"""
        category_icons = {
            'venues': '🏛️',
            'photography': '📸',
            'catering': '🍽️',
            'decoration': '🎨',
            'beauty': '💄',
            'entertainment': '🎵'
        }
        
        icon = category_icons.get(vendor.category, '🎉')
        
        return f"""{icon} Wedding {vendor.category.title()} Inquiry 💍

Hi {vendor.name}!

We're planning our wedding for {wedding.wedding_date} with {wedding.guest_count} guests in {wedding.location}.

Could you please share:
• Availability for our date
• Service packages & pricing
• Portfolio/samples if available

Looking forward to hearing from you!

Best regards,
{wedding.couple_names}
📱 {wedding.contact_phone}"""

# Initialize communication agent
comm_agent = CommunicationAgent()

class EmailService:
    """Email service for sending vendor communications"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_user = os.getenv('EMAIL_USER', '')
        self.email_password = os.getenv('EMAIL_PASSWORD', '')
    
    async def send_email(self, to_email: str, subject: str, content: str, from_name: str = "Wedding Planning Assistant") -> Dict[str, Any]:
        """Send email to vendor"""
        try:
            if not self.email_user or not self.email_password:
                # Return success for demo mode
                logger.info(f"Demo mode: Email would be sent to {to_email}")
                return {
                    'success': True,
                    'message_id': f'demo_{datetime.now().timestamp()}',
                    'timestamp': datetime.now().isoformat()
                }
            
            msg = MimeMultipart()
            msg['From'] = f"{from_name} <{self.email_user}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MimeText(content, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            text = msg.as_string()
            server.sendmail(self.email_user, to_email, text)
            server.quit()
            
            return {
                'success': True,
                'message_id': f'email_{datetime.now().timestamp()}',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Email send error: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class WhatsAppService:
    """WhatsApp service for sending vendor communications"""
    
    def __init__(self):
        self.api_url = os.getenv('WHATSAPP_API_URL', '')
        self.api_token = os.getenv('WHATSAPP_API_TOKEN', '')
    
    async def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        """Send WhatsApp message to vendor"""
        try:
            if not self.api_url or not self.api_token:
                # Return success for demo mode
                logger.info(f"Demo mode: WhatsApp would be sent to {phone}")
                return {
                    'success': True,
                    'message_id': f'whatsapp_demo_{datetime.now().timestamp()}',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Format phone number
            clean_phone = re.sub(r'\D', '', phone)
            if not clean_phone.startswith('91'):
                clean_phone = '91' + clean_phone
            
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'phone': clean_phone,
                'message': message
            }
            
            response = requests.post(self.api_url, json=payload, headers=headers)
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message_id': response.json().get('id', f'whatsapp_{datetime.now().timestamp()}'),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': f'WhatsApp API error: {response.status_code}',
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"WhatsApp send error: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Initialize services
email_service = EmailService()
whatsapp_service = WhatsAppService()

# API Endpoints

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'Vendor Communication API',
        'timestamp': datetime.now().isoformat(),
        'features': {
            'communication_management': True,
            'email_integration': True,
            'whatsapp_integration': True,
            'ai_message_generation': True,
            'quotation_analysis': True
        }
    }

@app.get("/api/communications")
async def get_communications(couple_id: Optional[str] = None):
    """Get all vendor communications"""
    try:
        if couple_id:
            # Filter by couple_id in real implementation
            filtered_comms = [comm for comm in communications_store.values()]
        else:
            filtered_comms = list(communications_store.values())
        
        return JSONResponse({
            'success': True,
            'communications': [asdict(comm) for comm in filtered_comms],
            'total_count': len(filtered_comms),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting communications: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/communications")
async def create_communication(request: Request):
    """Create new vendor communication"""
    try:
        data = await request.json()
        
        communication_id = f"comm_{int(datetime.now().timestamp())}"
        
        communication = VendorCommunication(
            id=communication_id,
            vendor_info=VendorInfo(**data['vendor_info']),
            wedding_info=WeddingInfo(**data['wedding_info']),
            status=data.get('status', 'interested'),
            priority=data.get('priority', 'medium'),
            messages=[],
            contact_date=datetime.now().isoformat(),
            notes=data.get('notes', ''),
            tags=data.get('tags', []),
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        
        communications_store[communication_id] = communication
        
        return JSONResponse({
            'success': True,
            'communication': asdict(communication),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error creating communication: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/communications/{communication_id}/messages")
async def send_message(communication_id: str, message_request: MessageRequest, background_tasks: BackgroundTasks):
    """Send message to vendor"""
    try:
        if communication_id not in communications_store:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        communication = communications_store[communication_id]
        
        # Create message record
        message_id = f"msg_{int(datetime.now().timestamp())}"
        message = CommunicationMessage(
            id=message_id,
            type=message_request.message_type,
            direction='sent',
            subject=message_request.subject,
            content=message_request.content,
            timestamp=datetime.now().isoformat(),
            status='sent'
        )
        
        # Send based on message type
        if message_request.message_type == 'email' and communication.vendor_info.email:
            background_tasks.add_task(
                send_email_background,
                communication.vendor_info.email,
                message_request.subject or f"Wedding Inquiry - {communication.wedding_info.couple_names}",
                message_request.content,
                communication.wedding_info.couple_names
            )
        elif message_request.message_type == 'whatsapp' and communication.vendor_info.phone:
            background_tasks.add_task(
                send_whatsapp_background,
                communication.vendor_info.phone,
                message_request.content
            )
        
        # Add message to communication
        communication.messages.append(message)
        communication.status = 'contacted'
        communication.updated_at = datetime.now().isoformat()
        
        return JSONResponse({
            'success': True,
            'message': asdict(message),
            'communication_status': communication.status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/communications/{communication_id}/quotation")
async def add_quotation(communication_id: str, quotation_request: QuotationRequest):
    """Add quotation to communication"""
    try:
        if communication_id not in communications_store:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        communication = communications_store[communication_id]
        communication.quotation = quotation_request.quotation
        communication.quotation_date = datetime.now().isoformat()
        communication.status = 'quoted'
        communication.updated_at = datetime.now().isoformat()
        
        # Calculate response time if this is first response
        if communication.response_date is None:
            communication.response_date = datetime.now().isoformat()
            contact_time = datetime.fromisoformat(communication.contact_date.replace('Z', '+00:00'))
            response_time = datetime.now(contact_time.tzinfo) - contact_time
            communication.response_time_hours = response_time.total_seconds() / 3600
        
        return JSONResponse({
            'success': True,
            'quotation': asdict(quotation_request.quotation),
            'communication_status': communication.status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error adding quotation: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/generate-message")
async def generate_ai_message(request: Request):
    """Generate AI-powered message for vendor communication"""
    try:
        data = await request.json()
        
        vendor_info = VendorInfo(**data['vendor_info'])
        wedding_info = WeddingInfo(**data['wedding_info'])
        message_type = data.get('message_type', 'inquiry')
        
        # Generate appropriate message
        if message_type == 'whatsapp':
            message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        else:
            message = comm_agent.generate_message(
                vendor_info.category,
                message_type,
                vendor_info,
                wedding_info,
                **data.get('additional_params', {})
            )
        
        return JSONResponse({
            'success': True,
            'message': message,
            'message_type': message_type,
            'vendor_category': vendor_info.category,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating message: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

@app.get("/api/analytics/quotations")
async def get_quotation_analytics(couple_id: Optional[str] = None):
    """Get quotation analytics and insights"""
    try:
        # Filter communications with quotations
        comms_with_quotes = [
            comm for comm in communications_store.values()
            if comm.quotation is not None
        ]
        
        if not comms_with_quotes:
            return JSONResponse({
                'success': True,
                'analytics': {
                    'total_quotations': 0,
                    'average_amount': 0,
                    'price_range': {'min': 0, 'max': 0},
                    'category_breakdown': {},
                    'insights': []
                },
                'timestamp': datetime.now().isoformat()
            })
        
        # Calculate analytics
        amounts = [comm.quotation.amount for comm in comms_with_quotes]
        total_quotations = len(amounts)
        average_amount = sum(amounts) / len(amounts)
        min_amount = min(amounts)
        max_amount = max(amounts)
        
        # Category breakdown
        category_breakdown = {}
        for comm in comms_with_quotes:
            category = comm.vendor_info.category
            if category not in category_breakdown:
                category_breakdown[category] = {'count': 0, 'total_amount': 0, 'average': 0}
            category_breakdown[category]['count'] += 1
            category_breakdown[category]['total_amount'] += comm.quotation.amount
        
        for category in category_breakdown:
            data = category_breakdown[category]
            data['average'] = data['total_amount'] / data['count']
        
        # Generate insights
        insights = [
            f"Average quotation amount: ₹{average_amount:,.0f}",
            f"Price range: ₹{min_amount:,.0f} - ₹{max_amount:,.0f}",
            f"Total quotations received: {total_quotations}",
            f"Categories quoted: {len(category_breakdown)}"
        ]
        
        return JSONResponse({
            'success': True,
            'analytics': {
                'total_quotations': total_quotations,
                'average_amount': average_amount,
                'price_range': {'min': min_amount, 'max': max_amount},
                'category_breakdown': category_breakdown,
                'insights': insights
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting quotation analytics: {e}")
        return JSONResponse({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status_code=500)

# Background tasks
async def send_email_background(to_email: str, subject: str, content: str, from_name: str):
    """Background task to send email"""
    result = await email_service.send_email(to_email, subject, content, from_name)
    logger.info(f"Email send result: {result}")

async def send_whatsapp_background(phone: str, message: str):
    """Background task to send WhatsApp"""
    result = await whatsapp_service.send_whatsapp(phone, message)
    logger.info(f"WhatsApp send result: {result}")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8003))
    uvicorn.run(
        "vendor_communication_api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
#!/usr/bin/env python3
"""
Vendor Communication API
Handles email, WhatsApp, and other vendor communications
"""

import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vendor Communication API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Vendor Communication API"}

@app.post("/api/send-vendor-email")
async def send_vendor_email(request: dict):
    """Send email to vendor"""
    logger.info("📧 Mock email sent to vendor")
    return JSONResponse({
        'success': True,
        'message': 'Email sent successfully (mock)',
        'provider': 'Mock Service'
    })

@app.post("/api/send-whatsapp")
async def send_whatsapp(request: dict):
    """Send WhatsApp message to vendor"""
    logger.info("📱 Mock WhatsApp sent to vendor")
    return JSONResponse({
        'success': True,
        'message': 'WhatsApp sent successfully (mock)',
        'provider': 'Mock Service'
    })

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting Vendor Communication API...")
    uvicorn.run(app, host="0.0.0.0", port=5004)
