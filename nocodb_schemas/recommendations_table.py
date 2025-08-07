from typing import Dict, Any

RECOMMENDATIONS_TABLE_SCHEMA = {
    "table_name": "recommendations",
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
            "column_name": "agent_type",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["budget", "style", "vendor"]
            }
        },
        {
            "column_name": "recommendation_data",
            "type": "json",
            "required": True,
            "comment": "Structured recommendations from AI agents"
        },
        {
            "column_name": "status",
            "type": "string",
            "required": True,
            "default": "pending",
            "validate": {
                "in": ["pending", "accepted", "rejected", "modified"]
            }
        },
        {
            "column_name": "feedback",
            "type": "text",
            "comment": "Couple's feedback on recommendations"
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
            "name": "couple_recommendations_idx",
            "columns": ["couple_id", "agent_type"],
            "type": "index"
        }
    ]
}

def get_recommendations_table_schema() -> Dict[str, Any]:
    return RECOMMENDATIONS_TABLE_SCHEMA 