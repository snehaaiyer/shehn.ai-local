from typing import Dict, Any

PREFERENCES_EXTENDED_TABLE_SCHEMA = {
    "table_name": "preferences_extended",
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
        # Wedding Theme - Single Select
        {
            "column_name": "wedding_theme",
            "type": "string",
            "validate": {
                "in": ["royal", "boho", "modern", "traditional", "beach", "garden", "vintage", "minimalist"]
            }
        },
        # Venue Type - Single Select
        {
            "column_name": "venue_type",
            "type": "string",
            "validate": {
                "in": ["indoor", "outdoor", "heritage-palace", "beach", "garden", "banquet-hall", "resort", "farmhouse"]
            }
        },
        # Photography Style - Single Select
        {
            "column_name": "photography_style",
            "type": "string",
            "validate": {
                "in": ["candid", "traditional", "artistic", "documentary", "fashion", "vintage"]
            }
        },
        # Decor Style - Single Select
        {
            "column_name": "decor_style",
            "type": "string",
            "validate": {
                "in": ["floral", "minimalist", "luxury-opulent", "rustic", "modern", "traditional"]
            }
        },
        # Cuisine Style - Single Select
        {
            "column_name": "cuisine_style",
            "type": "string",
            "validate": {
                "in": ["north-indian", "south-indian", "gujarati", "multi-cuisine", "continental", "fusion"]
            }
        },
        # Multi-select preferences stored as JSON arrays
        {
            "column_name": "floral_styles",
            "type": "json",
            "comment": "Multi-select: minimalist, lush, wildflower, exotic, rose-garden, tropical"
        },
        {
            "column_name": "lighting_styles",
            "type": "json",
            "comment": "Multi-select: fairy-lights, chandeliers, candles, uplighting, string-lights, lanterns"
        },
        {
            "column_name": "furniture_styles",
            "type": "json",
            "comment": "Multi-select: modern, vintage, rustic, elegant, bohemian, classic"
        },
        {
            "column_name": "color_themes",
            "type": "json",
            "comment": "Multi-select: blush-gold, sage-cream, burgundy-navy, coral-peach, emerald-gold, dusty-blue"
        },
        {
            "column_name": "music_preferences",
            "type": "json",
            "comment": "Multi-select: classical, bollywood, folk-traditional, contemporary"
        },
        {
            "column_name": "entertainment_preferences",
            "type": "json",
            "comment": "Multi-select: dj, live-band, cultural-performances, interactive-games"
        },
        # Budget and Guest Information
        {
            "column_name": "budget_range",
            "type": "string",
            "validate": {
                "in": ["budget-5-15L", "premium-15-30L", "luxury-30-50L", "ultra-luxury-50L+"]
            }
        },
        {
            "column_name": "guest_count",
            "type": "integer",
            "validate": {
                "min": 50,
                "max": 1000
            }
        },
        {
            "column_name": "wedding_days",
            "type": "integer",
            "default": 1,
            "validate": {
                "min": 1,
                "max": 7
            }
        },
        # Location and Date Preferences
        {
            "column_name": "preferred_city",
            "type": "string"
        },
        {
            "column_name": "date_flexibility",
            "type": "string",
            "validate": {
                "in": ["specific-date", "within-3-months", "within-6-months", "within-12-months"]
            }
        },
        {
            "column_name": "preferred_season",
            "type": "string",
            "validate": {
                "in": ["winter", "spring", "summer", "monsoon"]
            }
        },
        # Additional Notes
        {
            "column_name": "special_requirements",
            "type": "text"
        },
        {
            "column_name": "priorities",
            "type": "json",
            "comment": "Array of priority categories"
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
            "name": "couple_preferences_idx",
            "columns": ["couple_id"],
            "type": "index"
        },
        {
            "name": "budget_guest_idx",
            "columns": ["budget_range", "guest_count"],
            "type": "index"
        }
    ]
}

def get_preferences_extended_table_schema() -> Dict[str, Any]:
    return PREFERENCES_EXTENDED_TABLE_SCHEMA 