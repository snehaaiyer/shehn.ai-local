from typing import Dict, Any

VENUES_TABLE_SCHEMA = {
    "table_name": "venues",
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
            "column_name": "venue_type",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["Indoor", "Outdoor", "Beach", "Garden", "Religious Venue", "Historic Building"]
            }
        },
        {
            "column_name": "guest_count",
            "type": "integer",
            "required": True,
            "validate": {
                "min": 1,
                "max": 1000
            }
        },
        {
            "column_name": "location",
            "type": "string",
            "required": True
        },
        {
            "column_name": "budget",
            "type": "decimal",
            "required": True,
            "validate": {
                "min": 0
            }
        },
        {
            "column_name": "notes",
            "type": "text"
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
            "name": "couple_venue_idx",
            "columns": ["couple_id"],
            "type": "index"
        }
    ]
}

def get_venues_table_schema() -> Dict[str, Any]:
    return VENUES_TABLE_SCHEMA 