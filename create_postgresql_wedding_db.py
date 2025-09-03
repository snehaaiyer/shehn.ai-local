
#!/usr/bin/env python3
"""
Create PostgreSQL Wedding Database
Creates all tables to match NocoDB schema definitions
"""

import os
import psycopg2
from psycopg2 import sql
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PostgreSQLWeddingDatabase:
    def __init__(self):
        # Use Replit's PostgreSQL database
        self.database_url = os.getenv('DATABASE_URL', 'postgresql://replit:password@localhost:5432/replit')
        
    def create_all_tables(self):
        """Create all wedding planner tables in PostgreSQL"""
        try:
            conn = psycopg2.connect(self.database_url)
            cur = conn.cursor()
            
            logger.info("🏗️  Creating Wedding Planner PostgreSQL Database...")
            
            # Create tables in dependency order
            tables = self.get_table_ddl()
            
            for table_name, ddl in tables.items():
                try:
                    logger.info(f"📋 Creating table: {table_name}")
                    cur.execute(ddl)
                    logger.info(f"✅ Table {table_name} created successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Table {table_name} creation warning: {e}")
            
            # Create indexes
            indexes = self.get_index_ddl()
            for index_name, ddl in indexes.items():
                try:
                    cur.execute(ddl)
                    logger.info(f"🗂️  Index {index_name} created")
                except Exception as e:
                    logger.warning(f"⚠️ Index {index_name} warning: {e}")
            
            conn.commit()
            logger.info("✅ All tables and indexes created successfully!")
            
            # Verify creation
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            
            created_tables = [row[0] for row in cur.fetchall()]
            logger.info(f"📊 Verified {len(created_tables)} tables: {', '.join(created_tables)}")
            
            cur.close()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Database creation failed: {e}")
            return False
    
    def get_table_ddl(self):
        """Get DDL for all tables"""
        return {
            'couples': """
                CREATE TABLE IF NOT EXISTS couples (
                    id SERIAL PRIMARY KEY,
                    partner1_name VARCHAR(255) NOT NULL,
                    partner2_name VARCHAR(255) NOT NULL,
                    wedding_date DATE NOT NULL,
                    contact_email VARCHAR(255) NOT NULL UNIQUE,
                    contact_phone VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'design_preferences': """
                CREATE TABLE IF NOT EXISTS design_preferences (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    color_palette VARCHAR(50) CHECK (color_palette IN ('romantic', 'classic', 'rustic', 'beach')),
                    theme VARCHAR(50) CHECK (theme IN ('garden_romance', 'modern_minimalist', 'vintage_elegance')),
                    wedding_style VARCHAR(50) NOT NULL CHECK (wedding_style IN ('Traditional', 'Modern', 'Rustic', 'Bohemian', 'Elegant', 'Minimalist')),
                    decor_elements JSONB NOT NULL,
                    lighting_preferences JSONB,
                    centerpiece_preferences JSONB,
                    additional_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'preferences_extended': """
                CREATE TABLE IF NOT EXISTS preferences_extended (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    wedding_theme VARCHAR(50) CHECK (wedding_theme IN ('royal', 'boho', 'modern', 'traditional', 'beach', 'garden', 'vintage', 'minimalist')),
                    venue_type VARCHAR(50) CHECK (venue_type IN ('indoor', 'outdoor', 'heritage-palace', 'beach', 'garden', 'banquet-hall', 'resort', 'farmhouse')),
                    photography_style VARCHAR(50) CHECK (photography_style IN ('candid', 'traditional', 'artistic', 'documentary', 'fashion', 'vintage')),
                    decor_style VARCHAR(50) CHECK (decor_style IN ('floral', 'minimalist', 'luxury-opulent', 'rustic', 'modern', 'traditional')),
                    cuisine_style VARCHAR(50) CHECK (cuisine_style IN ('north-indian', 'south-indian', 'gujarati', 'multi-cuisine', 'continental', 'fusion')),
                    floral_styles JSONB,
                    lighting_styles JSONB,
                    furniture_styles JSONB,
                    color_themes JSONB,
                    music_preferences JSONB,
                    entertainment_preferences JSONB,
                    budget_range VARCHAR(50) CHECK (budget_range IN ('budget-5-15L', 'premium-15-30L', 'luxury-30-50L', 'ultra-luxury-50L+')),
                    guest_count INTEGER CHECK (guest_count >= 50 AND guest_count <= 1000),
                    wedding_days INTEGER DEFAULT 1 CHECK (wedding_days >= 1 AND wedding_days <= 7),
                    preferred_city VARCHAR(255),
                    date_flexibility VARCHAR(50) CHECK (date_flexibility IN ('specific-date', 'within-3-months', 'within-6-months', 'within-12-months')),
                    preferred_season VARCHAR(50) CHECK (preferred_season IN ('winter', 'spring', 'summer', 'monsoon')),
                    special_requirements TEXT,
                    priorities JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'venues': """
                CREATE TABLE IF NOT EXISTS venues (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    venue_type VARCHAR(100) NOT NULL CHECK (venue_type IN ('Indoor', 'Outdoor', 'Beach', 'Garden', 'Religious Venue', 'Historic Building')),
                    guest_count INTEGER NOT NULL CHECK (guest_count >= 1 AND guest_count <= 1000),
                    location VARCHAR(255) NOT NULL,
                    budget DECIMAL(12,2) NOT NULL CHECK (budget >= 0),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'budget_allocations': """
                CREATE TABLE IF NOT EXISTS budget_allocations (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    total_budget DECIMAL(12,2) NOT NULL CHECK (total_budget >= 100000),
                    budget_tier VARCHAR(50) NOT NULL CHECK (budget_tier IN ('budget-5-15L', 'premium-15-30L', 'luxury-30-50L', 'ultra-luxury-50L+')),
                    venue_allocation DECIMAL(12,2) NOT NULL,
                    venue_percentage DECIMAL(5,2) NOT NULL,
                    photography_allocation DECIMAL(12,2) NOT NULL,
                    photography_percentage DECIMAL(5,2) NOT NULL,
                    catering_allocation DECIMAL(12,2) NOT NULL,
                    catering_percentage DECIMAL(5,2) NOT NULL,
                    decor_allocation DECIMAL(12,2) NOT NULL,
                    decor_percentage DECIMAL(5,2) NOT NULL,
                    beauty_allocation DECIMAL(12,2) NOT NULL,
                    beauty_percentage DECIMAL(5,2) NOT NULL,
                    entertainment_allocation DECIMAL(12,2) NOT NULL,
                    entertainment_percentage DECIMAL(5,2) NOT NULL,
                    flowers_allocation DECIMAL(12,2) NOT NULL,
                    flowers_percentage DECIMAL(5,2) NOT NULL,
                    transport_allocation DECIMAL(12,2) NOT NULL,
                    transport_percentage DECIMAL(5,2) NOT NULL,
                    miscellaneous_allocation DECIMAL(12,2) NOT NULL,
                    miscellaneous_percentage DECIMAL(5,2) NOT NULL,
                    allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN ('smart', 'vendor-based', 'manual', 'ai-optimized')),
                    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
                    vendor_count INTEGER DEFAULT 0,
                    allocation_reasoning JSONB,
                    total_spent DECIMAL(12,2) DEFAULT 0 CHECK (total_spent >= 0),
                    total_remaining DECIMAL(12,2),
                    spending_by_category JSONB,
                    alerts_enabled BOOLEAN DEFAULT TRUE,
                    alert_threshold DECIMAL(5,2) DEFAULT 80 CHECK (alert_threshold >= 50 AND alert_threshold <= 100),
                    budget_status VARCHAR(50) DEFAULT 'on-track' CHECK (budget_status IN ('on-track', 'approaching-limit', 'over-budget', 'needs-review')),
                    version INTEGER DEFAULT 1,
                    previous_allocation_id INTEGER REFERENCES budget_allocations(id),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'recommendations': """
                CREATE TABLE IF NOT EXISTS recommendations (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('budget', 'style', 'vendor')),
                    recommendation_data JSONB NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
                    feedback TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'vendor_selections': """
                CREATE TABLE IF NOT EXISTS vendor_selections (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    vendor_id INTEGER,
                    vendor_name VARCHAR(255) NOT NULL,
                    vendor_category VARCHAR(100) NOT NULL CHECK (vendor_category IN ('venues', 'photography', 'catering', 'decor', 'beauty', 'entertainment', 'music', 'flowers', 'transport')),
                    vendor_location VARCHAR(255),
                    vendor_phone VARCHAR(50),
                    vendor_email VARCHAR(255),
                    vendor_website VARCHAR(500),
                    selection_status VARCHAR(50) NOT NULL DEFAULT 'interested' CHECK (selection_status IN ('interested', 'contacted', 'quoted', 'booked', 'confirmed', 'cancelled')),
                    quoted_price DECIMAL(12,2) CHECK (quoted_price >= 0),
                    final_price DECIMAL(12,2) CHECK (final_price >= 0),
                    contract_signed BOOLEAN DEFAULT FALSE,
                    advance_paid DECIMAL(12,2) DEFAULT 0 CHECK (advance_paid >= 0),
                    communication_log JSONB,
                    notes TEXT,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    contact_date TIMESTAMP,
                    booking_date TIMESTAMP,
                    service_date TIMESTAMP,
                    priority_rank INTEGER,
                    match_score DECIMAL(5,2),
                    selection_reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'vendor_communications': """
                CREATE TABLE IF NOT EXISTS vendor_communications (
                    id SERIAL PRIMARY KEY,
                    couple_id INTEGER NOT NULL REFERENCES couples(id),
                    vendor_id VARCHAR(255) NOT NULL,
                    vendor_name VARCHAR(255) NOT NULL,
                    vendor_category VARCHAR(100) NOT NULL CHECK (vendor_category IN ('venues', 'photography', 'catering', 'decoration', 'beauty', 'entertainment', 'music', 'flowers', 'transport', 'planning')),
                    vendor_location VARCHAR(255),
                    vendor_phone VARCHAR(50),
                    vendor_email VARCHAR(255),
                    vendor_website VARCHAR(500),
                    status VARCHAR(50) NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'responded', 'quoted', 'negotiating', 'booked', 'declined')),
                    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
                    messages JSONB DEFAULT '[]',
                    quotation JSONB,
                    contact_date TIMESTAMP,
                    response_date TIMESTAMP,
                    quotation_date TIMESTAMP,
                    follow_up_date TIMESTAMP,
                    booking_date TIMESTAMP,
                    service_date TIMESTAMP,
                    response_time_hours DECIMAL(8,2),
                    negotiation_count INTEGER DEFAULT 0,
                    price_reductions DECIMAL(12,2) DEFAULT 0,
                    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
                    notes TEXT,
                    tags JSONB DEFAULT '[]',
                    preferred_contact_method VARCHAR(50) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'any')),
                    communication_frequency VARCHAR(50) DEFAULT 'as-needed' CHECK (communication_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'as-needed')),
                    match_score DECIMAL(5,2),
                    communication_insights JSONB,
                    recommendation_reason TEXT,
                    contract_status VARCHAR(50) DEFAULT 'none' CHECK (contract_status IN ('none', 'draft', 'sent', 'signed', 'cancelled')),
                    contract_details JSONB,
                    payment_schedule JSONB,
                    payments_made JSONB,
                    total_amount_due DECIMAL(12,2) DEFAULT 0,
                    total_amount_paid DECIMAL(12,2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            
            'vendor_messages': """
                CREATE TABLE IF NOT EXISTS vendor_messages (
                    id SERIAL PRIMARY KEY,
                    communication_id INTEGER NOT NULL REFERENCES vendor_communications(id),
                    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('email', 'whatsapp', 'phone', 'meeting', 'system', 'sms')),
                    direction VARCHAR(50) NOT NULL CHECK (direction IN ('sent', 'received')),
                    subject VARCHAR(500),
                    content TEXT NOT NULL,
                    message_status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (message_status IN ('sent', 'delivered', 'read', 'replied', 'failed')),
                    attachments JSONB,
                    metadata JSONB,
                    scheduled_send_time TIMESTAMP,
                    ai_generated BOOLEAN DEFAULT FALSE,
                    template_used VARCHAR(255),
                    sentiment_score DECIMAL(5,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
        }
    
    def get_index_ddl(self):
        """Get DDL for all indexes"""
        return {
            'couples_email_idx': 'CREATE UNIQUE INDEX IF NOT EXISTS couples_email_idx ON couples (contact_email)',
            'design_preferences_couple_idx': 'CREATE UNIQUE INDEX IF NOT EXISTS design_preferences_couple_idx ON design_preferences (couple_id)',
            'preferences_extended_couple_idx': 'CREATE INDEX IF NOT EXISTS preferences_extended_couple_idx ON preferences_extended (couple_id)',
            'preferences_extended_budget_guest_idx': 'CREATE INDEX IF NOT EXISTS preferences_extended_budget_guest_idx ON preferences_extended (budget_range, guest_count)',
            'venues_couple_idx': 'CREATE INDEX IF NOT EXISTS venues_couple_idx ON venues (couple_id)',
            'budget_allocations_couple_active_idx': 'CREATE INDEX IF NOT EXISTS budget_allocations_couple_active_idx ON budget_allocations (couple_id, is_active)',
            'budget_allocations_tier_idx': 'CREATE INDEX IF NOT EXISTS budget_allocations_tier_idx ON budget_allocations (budget_tier)',
            'recommendations_couple_agent_idx': 'CREATE INDEX IF NOT EXISTS recommendations_couple_agent_idx ON recommendations (couple_id, agent_type)',
            'vendor_selections_couple_category_idx': 'CREATE INDEX IF NOT EXISTS vendor_selections_couple_category_idx ON vendor_selections (couple_id, vendor_category)',
            'vendor_selections_unique_couple_vendor': 'CREATE UNIQUE INDEX IF NOT EXISTS vendor_selections_unique_couple_vendor ON vendor_selections (couple_id, vendor_name, vendor_category)',
            'vendor_communications_couple_category_idx': 'CREATE INDEX IF NOT EXISTS vendor_communications_couple_category_idx ON vendor_communications (couple_id, vendor_category)',
            'vendor_communications_status_idx': 'CREATE INDEX IF NOT EXISTS vendor_communications_status_idx ON vendor_communications (status, couple_id)',
            'vendor_communications_follow_up_idx': 'CREATE INDEX IF NOT EXISTS vendor_communications_follow_up_idx ON vendor_communications (follow_up_date, status)',
            'vendor_communications_unique_couple_vendor': 'CREATE UNIQUE INDEX IF NOT EXISTS vendor_communications_unique_couple_vendor ON vendor_communications (couple_id, vendor_id)',
            'vendor_messages_communication_idx': 'CREATE INDEX IF NOT EXISTS vendor_messages_communication_idx ON vendor_messages (communication_id, created_at)',
            'vendor_messages_type_direction_idx': 'CREATE INDEX IF NOT EXISTS vendor_messages_type_direction_idx ON vendor_messages (message_type, direction)'
        }

def main():
    """Create PostgreSQL wedding database"""
    db = PostgreSQLWeddingDatabase()
    success = db.create_all_tables()
    
    if success:
        print("\n✅ PostgreSQL Wedding Database created successfully!")
        print("🔗 Database URL:", os.getenv('DATABASE_URL', 'Not configured'))
    else:
        print("\n❌ Database creation failed")

if __name__ == "__main__":
    main()
