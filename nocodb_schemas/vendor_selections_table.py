from typing import Dict, Any

VENDOR_SELECTIONS_TABLE_SCHEMA = {
    "table_name": "vendor_selections",
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
            "type": "integer",
            "foreign_key": {
                "table": "vendors",
                "column": "id"
            }
        },
        # Vendor Information (for cases where vendor might not be in main vendors table)
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
                "in": ["venues", "photography", "catering", "decor", "beauty", "entertainment", "music", "flowers", "transport"]
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
        # Selection Details
        {
            "column_name": "selection_status",
            "type": "string",
            "required": True,
            "default": "interested",
            "validate": {
                "in": ["interested", "contacted", "quoted", "booked", "confirmed", "cancelled"]
            }
        },
        {
            "column_name": "quoted_price",
            "type": "decimal",
            "validate": {
                "min": 0
            }
        },
        {
            "column_name": "final_price",
            "type": "decimal",
            "validate": {
                "min": 0
            }
        },
        {
            "column_name": "contract_signed",
            "type": "boolean",
            "default": False
        },
        {
            "column_name": "advance_paid",
            "type": "decimal",
            "default": 0,
            "validate": {
                "min": 0
            }
        },
        # Communication Log
        {
            "column_name": "communication_log",
            "type": "json",
            "comment": "Array of communication entries with dates and notes"
        },
        {
            "column_name": "notes",
            "type": "text",
            "comment": "Couple's notes about this vendor"
        },
        {
            "column_name": "rating",
            "type": "integer",
            "validate": {
                "min": 1,
                "max": 5
            }
        },
        # Important Dates
        {
            "column_name": "contact_date",
            "type": "datetime",
            "comment": "When couple first contacted vendor"
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
        # Priority and Preferences
        {
            "column_name": "priority_rank",
            "type": "integer",
            "comment": "Ranking within category (1 = highest priority)"
        },
        {
            "column_name": "match_score",
            "type": "decimal",
            "comment": "AI-calculated match score based on preferences"
        },
        {
            "column_name": "selection_reason",
            "type": "text",
            "comment": "Why couple selected this vendor"
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
            "columns": ["selection_status", "couple_id"],
            "type": "index"
        },
        {
            "name": "unique_couple_vendor",
            "columns": ["couple_id", "vendor_name", "vendor_category"],
            "type": "unique"
        }
    ]
}

def get_vendor_selections_table_schema() -> Dict[str, Any]:
    return VENDOR_SELECTIONS_TABLE_SCHEMA 