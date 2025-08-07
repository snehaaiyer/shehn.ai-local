from typing import Dict, Any

DESIGN_PREFERENCES_TABLE_SCHEMA = {
    "table_name": "design_preferences",
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
            "column_name": "color_palette",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["romantic", "classic", "rustic", "beach"]
            }
        },
        {
            "column_name": "theme",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["garden_romance", "modern_minimalist", "vintage_elegance"]
            }
        },
        {
            "column_name": "wedding_style",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["Traditional", "Modern", "Rustic", "Bohemian", "Elegant", "Minimalist"]
            }
        },
        {
            "column_name": "decor_elements",
            "type": "json",
            "required": True
        },
        {
            "column_name": "lighting_preferences",
            "type": "json",
            "comment": "Selected lighting options from visual selector"
        },
        {
            "column_name": "centerpiece_preferences",
            "type": "json",
            "comment": "Selected centerpiece options from visual selector"
        },
        {
            "column_name": "additional_notes",
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
            "name": "couple_design_idx",
            "columns": ["couple_id"],
            "type": "unique"
        }
    ]
}

def get_design_preferences_table_schema() -> Dict[str, Any]:
    return DESIGN_PREFERENCES_TABLE_SCHEMA 