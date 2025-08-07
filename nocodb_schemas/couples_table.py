from typing import Dict, Any

COUPLES_TABLE_SCHEMA = {
    "table_name": "couples",
    "columns": [
        {
            "column_name": "id",
            "type": "integer",
            "primary": True,
            "auto_increment": True
        },
        {
            "column_name": "partner1_name",
            "type": "string",
            "required": True
        },
        {
            "column_name": "partner2_name",
            "type": "string",
            "required": True
        },
        {
            "column_name": "wedding_date",
            "type": "date",
            "required": True
        },
        {
            "column_name": "contact_email",
            "type": "string",
            "required": True,
            "validate": "email"
        },
        {
            "column_name": "contact_phone",
            "type": "string",
            "required": True
        },
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
            "name": "email_idx",
            "columns": ["contact_email"],
            "type": "unique"
        }
    ]
}

def get_couples_table_schema() -> Dict[str, Any]:
    return COUPLES_TABLE_SCHEMA 