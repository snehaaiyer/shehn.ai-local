from typing import Dict, Any

BUDGET_ALLOCATIONS_TABLE_SCHEMA = {
    "table_name": "budget_allocations",
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
        # Budget Overview
        {
            "column_name": "total_budget",
            "type": "decimal",
            "required": True,
            "validate": {
                "min": 100000  # Minimum 1L budget
            }
        },
        {
            "column_name": "budget_tier",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["budget-5-15L", "premium-15-30L", "luxury-30-50L", "ultra-luxury-50L+"]
            }
        },
        # Category Allocations
        {
            "column_name": "venue_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "venue_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "photography_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "photography_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "catering_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "catering_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "decor_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "decor_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "beauty_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "beauty_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "entertainment_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "entertainment_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "flowers_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "flowers_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "transport_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "transport_percentage",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "miscellaneous_allocation",
            "type": "decimal",
            "required": True
        },
        {
            "column_name": "miscellaneous_percentage",
            "type": "decimal",
            "required": True
        },
        # Allocation Metadata
        {
            "column_name": "allocation_type",
            "type": "string",
            "required": True,
            "validate": {
                "in": ["smart", "vendor-based", "manual", "ai-optimized"]
            }
        },
        {
            "column_name": "confidence_score",
            "type": "decimal",
            "validate": {
                "min": 0,
                "max": 100
            }
        },
        {
            "column_name": "vendor_count",
            "type": "integer",
            "default": 0,
            "comment": "Number of vendors selected when allocation was generated"
        },
        {
            "column_name": "allocation_reasoning",
            "type": "json",
            "comment": "AI reasoning for the allocation breakdown"
        },
        # Spending Tracking
        {
            "column_name": "total_spent",
            "type": "decimal",
            "default": 0,
            "validate": {
                "min": 0
            }
        },
        {
            "column_name": "total_remaining",
            "type": "decimal",
            "comment": "Calculated field: total_budget - total_spent"
        },
        {
            "column_name": "spending_by_category",
            "type": "json",
            "comment": "Actual spending breakdown by category"
        },
        # Budget Alerts and Notifications
        {
            "column_name": "alerts_enabled",
            "type": "boolean",
            "default": True
        },
        {
            "column_name": "alert_threshold",
            "type": "decimal",
            "default": 80,
            "validate": {
                "min": 50,
                "max": 100
            },
            "comment": "Alert when spending reaches this % of budget"
        },
        {
            "column_name": "budget_status",
            "type": "string",
            "default": "on-track",
            "validate": {
                "in": ["on-track", "approaching-limit", "over-budget", "needs-review"]
            }
        },
        # Version Control
        {
            "column_name": "version",
            "type": "integer",
            "default": 1,
            "comment": "Budget allocation version for tracking changes"
        },
        {
            "column_name": "previous_allocation_id",
            "type": "integer",
            "foreign_key": {
                "table": "budget_allocations",
                "column": "id"
            },
            "comment": "Reference to previous version"
        },
        {
            "column_name": "is_active",
            "type": "boolean",
            "default": True,
            "comment": "Whether this is the current active allocation"
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
            "name": "couple_budget_idx",
            "columns": ["couple_id", "is_active"],
            "type": "index"
        },
        {
            "name": "budget_tier_idx",
            "columns": ["budget_tier"],
            "type": "index"
        },
        {
            "name": "allocation_type_idx",
            "columns": ["allocation_type"],
            "type": "index"
        },
        {
            "name": "active_budget_unique",
            "columns": ["couple_id"],
            "type": "unique",
            "condition": "WHERE is_active = true"
        }
    ]
}

def get_budget_allocations_table_schema() -> Dict[str, Any]:
    return BUDGET_ALLOCATIONS_TABLE_SCHEMA 