# Enhanced Database Setup Guide

## 🎯 Overview
The new wedding blueprint design requires additional NocoDB tables to support:
- Multi-select preferences (floral, lighting, furniture, colors)
- Vendor selection tracking
- Intelligent budget allocations

## 📋 Manual Table Creation

Since the automated setup encountered API version issues, please create these tables manually in your NocoDB interface:

### 1. 📊 preferences_extended Table

**Purpose**: Store multi-select preferences and enhanced wedding details

**Columns to Create**:
```
- id (Number, Primary Key, Auto Increment)
- couple_id (Number, Links to couples table)
- wedding_theme (Single Line Text)
- venue_type (Single Line Text) 
- photography_style (Single Line Text)
- decor_style (Single Line Text)
- cuisine_style (Single Line Text)
- floral_styles (JSON) - Multi-select preferences
- lighting_styles (JSON) - Multi-select preferences  
- furniture_styles (JSON) - Multi-select preferences
- color_themes (JSON) - Multi-select preferences
- music_preferences (JSON) - Multi-select preferences
- entertainment_preferences (JSON) - Multi-select preferences
- budget_range (Single Line Text)
- guest_count (Number)
- wedding_days (Number, Default: 1)
- preferred_city (Single Line Text)
- date_flexibility (Single Line Text)
- preferred_season (Single Line Text)
- special_requirements (Long Text)
- priorities (JSON)
- created_at (DateTime)
- updated_at (DateTime)
```

### 2. 🏪 vendor_selections Table

**Purpose**: Track vendor selections and communication

**Columns to Create**:
```
- id (Number, Primary Key, Auto Increment)
- couple_id (Number, Links to couples table)
- vendor_id (Number, Optional link to vendors table)
- vendor_name (Single Line Text, Required)
- vendor_category (Single Select: venues, photography, catering, decor, beauty, entertainment, music, flowers, transport)
- vendor_location (Single Line Text)
- vendor_phone (Single Line Text)
- vendor_email (Email)
- vendor_website (URL)
- selection_status (Single Select: interested, contacted, quoted, booked, confirmed, cancelled)
- quoted_price (Currency)
- final_price (Currency)
- contract_signed (Checkbox)
- advance_paid (Currency, Default: 0)
- communication_log (JSON)
- notes (Long Text)
- rating (Number, 1-5)
- contact_date (DateTime)
- booking_date (DateTime)
- service_date (DateTime)
- priority_rank (Number)
- match_score (Number)
- selection_reason (Long Text)
- created_at (DateTime)
- updated_at (DateTime)
```

### 3. 💰 budget_allocations Table

**Purpose**: Store intelligent budget breakdowns and tracking

**Columns to Create**:
```
- id (Number, Primary Key, Auto Increment)
- couple_id (Number, Links to couples table)
- total_budget (Currency, Required)
- budget_tier (Single Select: budget-5-15L, premium-15-30L, luxury-30-50L, ultra-luxury-50L+)
- venue_allocation (Currency)
- venue_percentage (Number)
- photography_allocation (Currency)
- photography_percentage (Number)
- catering_allocation (Currency) 
- catering_percentage (Number)
- decor_allocation (Currency)
- decor_percentage (Number)
- beauty_allocation (Currency)
- beauty_percentage (Number)
- entertainment_allocation (Currency)
- entertainment_percentage (Number)
- flowers_allocation (Currency)
- flowers_percentage (Number)
- transport_allocation (Currency)
- transport_percentage (Number)
- miscellaneous_allocation (Currency)
- miscellaneous_percentage (Number)
- allocation_type (Single Select: smart, vendor-based, manual, ai-optimized)
- confidence_score (Number, 0-100)
- vendor_count (Number, Default: 0)
- allocation_reasoning (JSON)
- total_spent (Currency, Default: 0)
- total_remaining (Currency)
- spending_by_category (JSON)
- alerts_enabled (Checkbox, Default: true)
- alert_threshold (Number, Default: 80)
- budget_status (Single Select: on-track, approaching-limit, over-budget, needs-review)
- version (Number, Default: 1)
- previous_allocation_id (Number, Self-reference)
- is_active (Checkbox, Default: true)
- created_at (DateTime)
- updated_at (DateTime)
```

## 🔧 Setup Instructions

1. **Access NocoDB Interface**: Open http://localhost:8080 in your browser

2. **Navigate to Tables**: Go to your wedding project

3. **Create Each Table**: 
   - Click "Add New Table"
   - Use the table names and column specifications above
   - Set appropriate data types and constraints

4. **Set Up Relationships**:
   - Link `couple_id` fields to the main `couples` table
   - Set up foreign key relationships where specified

5. **Configure Indexes** (Optional but Recommended):
   - Add indexes on `couple_id` fields for better performance
   - Add composite indexes for frequently queried combinations

## 📱 Frontend Integration

The blueprint design is already configured to work with these tables via the updated `vendor_database.py` methods:

- `store_extended_preferences()` - Saves multi-select preferences
- `store_vendor_selection()` - Tracks vendor choices
- `store_budget_allocation()` - Manages budget data
- `get_vendor_selections()` - Retrieves vendor data
- `get_budget_allocation()` - Gets budget information

## ✅ Verification

After creating the tables, test the integration by:

1. Starting the server: `python simple_unified_server.py`
2. Opening the wedding planner: http://localhost:8000
3. Testing the preferences screen with multi-select options
4. Selecting vendors and checking the blueprint display
5. Generating budget allocations

## 🎉 Benefits

Once set up, you'll have:

- **Multi-Select Preferences**: Couples can choose multiple floral styles, lighting options, etc.
- **Vendor Tracking**: Complete vendor selection and communication history
- **Budget Intelligence**: AI-powered budget allocations with vendor-based adjustments
- **Blueprint Dashboard**: Comprehensive overview of all wedding planning aspects

## 🔍 Troubleshooting

If you encounter issues:

1. **Permission Errors**: Ensure your NocoDB API token has table creation permissions
2. **Connection Issues**: Verify NocoDB is running on localhost:8080
3. **Data Type Errors**: Use the exact column types specified above
4. **Relationship Issues**: Make sure couple_id links are properly configured

The wedding blueprint will automatically populate with data as couples use the enhanced preference system! 🎊 