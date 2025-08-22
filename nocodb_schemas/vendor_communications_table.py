
from typing import Dict, Any

VENDOR_COMMUNICATIONS_TABLE_SCHEMA = {
    "table_name": "vendor_communications",
    "columns": [
        {
            "column_name": "id",
            "type": "integer",
            "primary": True,
            "auto_increment": True
        },
        {
            "column_name": "couple_id",
            "type": "integer",
            "required": True,
            "foreign_key": {
                "table": "couples",
                "column": "id"
            }
        },
        {
            "column_name": "vendor_id",
            "type": "string",
            "required": True,
            "comment": "Unique vendor identifier"
        },
        
        # Vendor Information
        {
            "column_name": "vendor_name",
            "type": "string",
            "required": True
        },
        {
            "column_name": "vendor_category",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["venues", "photography", "catering", "decoration", "beauty", "entertainment", "music", "flowers", "transport", "planning"]
            }
        },
        {
            "column_name": "vendor_location",
            "type": "string"
        },
        {
            "column_name": "vendor_phone",
            "type": "string"
        },
        {
            "column_name": "vendor_email",
            "type": "string"
        },
        {
            "column_name": "vendor_website",
            "type": "string"
        },
        
        # Communication Status
        {
            "column_name": "status",
            "type": "string",
            "required": True,
            "default": "interested",
            "validate": {
                "in": ["interested", "contacted", "responded", "quoted", "negotiating", "booked", "declined"]
            }
        },
        {
            "column_name": "priority",
            "type": "string",
            "required": True,
            "default": "medium",
            "validate": {
                "in": ["high", "medium", "low"]
            }
        },
        
        # Communication History (JSON array of messages)
        {
            "column_name": "messages",
            "type": "json",
            "comment": "Array of communication messages",
            "default": "[]"
        },
        
        # Quotation Details (JSON object)
        {
            "column_name": "quotation",
            "type": "json",
            "comment": "Detailed quotation information including amount, inclusions, payment terms"
        },
        
        # Important Dates
        {
            "column_name": "contact_date",
            "type": "datetime",
            "comment": "When couple first contacted vendor"
        },
        {
            "column_name": "response_date",
            "type": "datetime",
            "comment": "When vendor first responded"
        },
        {
            "column_name": "quotation_date",
            "type": "datetime",
            "comment": "When quotation was received"
        },
        {
            "column_name": "follow_up_date",
            "type": "datetime",
            "comment": "Next scheduled follow-up"
        },
        {
            "column_name": "booking_date",
            "type": "datetime",
            "comment": "When vendor was booked"
        },
        {
            "column_name": "service_date",
            "type": "datetime",
            "comment": "When vendor will provide service"
        },
        
        # Analytics & Metrics
        {
            "column_name": "response_time_hours",
            "type": "decimal",
            "comment": "Vendor response time in hours"
        },
        {
            "column_name": "negotiation_count",
            "type": "integer",
            "default": 0,
            "comment": "Number of negotiation rounds"
        },
        {
            "column_name": "price_reductions",
            "type": "decimal",
            "default": 0,
            "comment": "Total amount saved through negotiations"
        },
        {
            "column_name": "satisfaction_rating",
            "type": "integer",
            "validate": {
                "min": 1,
                "max": 5
            },
            "comment": "Couple's satisfaction rating for vendor"
        },
        
        # Notes & Tags
        {
            "column_name": "notes",
            "type": "text",
            "comment": "Couple's notes about vendor communication"
        },
        {
            "column_name": "tags",
            "type": "json",
            "comment": "Array of tags for categorization",
            "default": "[]"
        },
        
        # Communication Preferences
        {
            "column_name": "preferred_contact_method",
            "type": "string",
            "validate": {
                "in": ["email", "phone", "whatsapp", "any"]
            },
            "default": "email"
        },
        {
            "column_name": "communication_frequency",
            "type": "string",
            "validate": {
                "in": ["daily", "weekly", "bi-weekly", "monthly", "as-needed"]
            },
            "default": "as-needed"
        },
        
        # AI/ML Fields
        {
            "column_name": "match_score",
            "type": "decimal",
            "comment": "AI-calculated compatibility score based on preferences"
        },
        {
            "column_name": "communication_insights",
            "type": "json",
            "comment": "AI-generated insights about vendor communication patterns"
        },
        {
            "column_name": "recommendation_reason",
            "type": "text",
            "comment": "AI explanation for why vendor was recommended"
        },
        
        # Contract & Legal
        {
            "column_name": "contract_status",
            "type": "string",
            "validate": {
                "in": ["none", "draft", "sent", "signed", "cancelled"]
            },
            "default": "none"
        },
        {
            "column_name": "contract_details",
            "type": "json",
            "comment": "Contract terms, clauses, and legal information"
        },
        
        # Payment Tracking
        {
            "column_name": "payment_schedule",
            "type": "json",
            "comment": "Payment milestones and due dates"
        },
        {
            "column_name": "payments_made",
            "type": "json",
            "comment": "Record of actual payments made"
        },
        {
            "column_name": "total_amount_due",
            "type": "decimal",
            "default": 0
        },
        {
            "column_name": "total_amount_paid",
            "type": "decimal",
            "default": 0
        },
        
        # Timestamps
        {
            "column_name": "created_at",
            "type": "datetime",
            "required": True,
            "default": "now()"
        },
        {
            "column_name": "updated_at",
            "type": "datetime",
            "required": True,
            "default": "now()",
            "on_update": "now()"
        }
    ],
    
    "indexes": [
        {
            "name": "couple_vendor_idx",
            "columns": ["couple_id", "vendor_category"],
            "type": "index"
        },
        {
            "name": "vendor_lookup_idx",
            "columns": ["vendor_id"],
            "type": "index"
        },
        {
            "name": "status_tracking_idx",
            "columns": ["status", "couple_id"],
            "type": "index"
        },
        {
            "name": "communication_timeline_idx",
            "columns": ["couple_id", "contact_date"],
            "type": "index"
        },
        {
            "name": "follow_up_idx",
            "columns": ["follow_up_date", "status"],
            "type": "index"
        },
        {
            "name": "unique_couple_vendor",
            "columns": ["couple_id", "vendor_id"],
            "type": "unique"
        }
    ],
    
    "relationships": [
        {
            "type": "many_to_one",
            "target_table": "couples",
            "foreign_key": "couple_id",
            "target_key": "id"
        }
    ]
}

# Additional schema for vendor communication messages (for better normalization)
VENDOR_MESSAGES_TABLE_SCHEMA = {
    "table_name": "vendor_messages",
    "columns": [
        {
            "column_name": "id",
            "type": "integer",
            "primary": True,
            "auto_increment": True
        },
        {
            "column_name": "communication_id",
            "type": "integer",
            "required": True,
            "foreign_key": {
                "table": "vendor_communications",
                "column": "id"
            }
        },
        {
            "column_name": "message_type",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["email", "whatsapp", "phone", "meeting", "system", "sms"]
            }
        },
        {
            "column_name": "direction",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["sent", "received"]
            }
        },
        {
            "column_name": "subject",
            "type": "string",
            "comment": "Email subject or message title"
        },
        {
            "column_name": "content",
            "type": "text",
            "required": True
        },
        {
            "column_name": "message_status",
            "type": "string",
            "required": True,
            "default": "sent",
            "validate": {
                "in": ["sent", "delivered", "read", "replied", "failed"]
            }
        },
        {
            "column_name": "attachments",
            "type": "json",
            "comment": "Array of attachment file paths/URLs"
        },
        {
            "column_name": "metadata",
            "type": "json",
            "comment": "Additional message metadata (read receipts, delivery status, etc.)"
        },
        {
            "column_name": "scheduled_send_time",
            "type": "datetime",
            "comment": "For scheduled messages"
        },
        {
            "column_name": "ai_generated",
            "type": "boolean",
            "default": False,
            "comment": "Whether message was AI-generated"
        },
        {
            "column_name": "template_used",
            "type": "string",
            "comment": "Template name if message was generated from template"
        },
        {
            "column_name": "sentiment_score",
            "type": "decimal",
            "comment": "AI-calculated sentiment score of message"
        },
        {
            "column_name": "created_at",
            "type": "datetime",
            "required": True,
            "default": "now()"
        }
    ],
    
    "indexes": [
        {
            "name": "communication_messages_idx",
            "columns": ["communication_id", "created_at"],
            "type": "index"
        },
        {
            "name": "message_type_idx",
            "columns": ["message_type", "direction"],
            "type": "index"
        },
        {
            "name": "scheduled_messages_idx",
            "columns": ["scheduled_send_time"],
            "type": "index"
        }
    ]
}

def get_vendor_communications_table_schema() -> Dict[str, Any]:
    return VENDOR_COMMUNICATIONS_TABLE_SCHEMA

def get_vendor_messages_table_schema() -> Dict[str, Any]:
    return VENDOR_MESSAGES_TABLE_SCHEMA
