
#!/usr/bin/env python3
"""
Replit Wedding Database Setup
Creates PostgreSQL tables directly in Replit environment
No NocoDB dependency required
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

# Import all schema definitions
from nocodb_schemas.couples_table import get_couples_table_schema
from nocodb_schemas.budget_allocations_table import get_budget_allocations_table_schema
from nocodb_schemas.design_preferences_table import get_design_preferences_table_schema
from nocodb_schemas.preferences_extended_table import get_preferences_extended_table_schema
from nocodb_schemas.recommendations_table import get_recommendations_table_schema
from nocodb_schemas.vendor_communications_table import get_vendor_communications_table_schema, get_vendor_messages_table_schema
from nocodb_schemas.vendor_selections_table import get_vendor_selections_table_schema
from nocodb_schemas.venues_table import get_venues_table_schema

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReplitWeddingDatabase:
    def __init__(self):
        # Replit PostgreSQL connection
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://replit:password@localhost:5432/replit')
        self.conn = None
        self.schemas = {}
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            self.conn.autocommit = True
            logger.info("✅ Connected to Replit PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def load_schemas(self):
        """Load all table schemas"""
        self.schemas = {
            'couples': get_couples_table_schema(),
            'budget_allocations': get_budget_allocations_table_schema(),
            'design_preferences': get_design_preferences_table_schema(),
            'preferences_extended': get_preferences_extended_table_schema(),
            'recommendations': get_recommendations_table_schema(),
            'vendor_communications': get_vendor_communications_table_schema(),
            'vendor_messages': get_vendor_messages_table_schema(),
            'vendor_selections': get_vendor_selections_table_schema(),
            'venues': get_venues_table_schema()
        }
        logger.info(f"📋 Loaded {len(self.schemas)} table schemas")
    
    def convert_type_to_postgresql(self, col_type: str, column_def: Dict) -> str:
        """Convert schema types to PostgreSQL types"""
        type_mapping = {
            'integer': 'INTEGER',
            'string': f"VARCHAR({column_def.get('max_length', 255)})",
            'text': 'TEXT',
            'decimal': 'DECIMAL(10,2)',
            'boolean': 'BOOLEAN',
            'datetime': 'TIMESTAMP WITH TIME ZONE',
            'date': 'DATE',
            'json': 'JSONB'
        }
        return type_mapping.get(col_type, 'TEXT')
    
    def create_table_sql(self, schema: Dict) -> str:
        """Generate CREATE TABLE SQL from schema"""
        table_name = schema['table_name']
        columns = []
        
        for col in schema['columns']:
            col_name = col['column_name']
            col_type = self.convert_type_to_postgresql(col['type'], col)
            
            constraints = []
            if col.get('primary'):
                constraints.append('PRIMARY KEY')
            if col.get('auto_increment'):
                col_type = 'SERIAL' if col['type'] == 'integer' else col_type
            if col.get('required') and not col.get('primary'):
                constraints.append('NOT NULL')
            if col.get('unique'):
                constraints.append('UNIQUE')
            if 'default' in col:
                default_val = col['default']
                if default_val == 'now()':
                    constraints.append('DEFAULT CURRENT_TIMESTAMP')
                elif isinstance(default_val, str):
                    constraints.append(f"DEFAULT '{default_val}'")
                else:
                    constraints.append(f"DEFAULT {default_val}")
            
            column_def = f"{col_name} {col_type}"
            if constraints:
                column_def += f" {' '.join(constraints)}"
            
            columns.append(column_def)
        
        # Add foreign key constraints
        foreign_keys = []
        for col in schema['columns']:
            if 'foreign_key' in col:
                fk = col['foreign_key']
                foreign_keys.append(
                    f"FOREIGN KEY ({col['column_name']}) REFERENCES {fk['table']}({fk['column']})"
                )
        
        all_constraints = columns + foreign_keys
        
        sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {',\n            '.join(all_constraints)}
        );
        """
        
        return sql
    
    def create_indexes_sql(self, schema: Dict) -> List[str]:
        """Generate CREATE INDEX SQL statements"""
        if 'indexes' not in schema:
            return []
        
        indexes = []
        table_name = schema['table_name']
        
        for idx in schema['indexes']:
            idx_name = idx['name']
            idx_columns = ', '.join(idx['columns'])
            idx_type = idx.get('type', 'index')
            
            if idx_type == 'unique':
                sql = f"CREATE UNIQUE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({idx_columns});"
            else:
                sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({idx_columns});"
            
            if 'condition' in idx:
                sql = sql.replace(';', f" {idx['condition']};")
            
            indexes.append(sql)
        
        return indexes
    
    def create_all_tables(self):
        """Create all wedding database tables"""
        if not self.conn:
            logger.error("❌ No database connection")
            return False
        
        cursor = self.conn.cursor()
        success_count = 0
        
        # Create tables in dependency order
        table_order = [
            'couples',
            'venues', 
            'design_preferences',
            'preferences_extended',
            'budget_allocations',
            'vendor_communications',
            'vendor_messages',
            'vendor_selections',
            'recommendations'
        ]
        
        for table_name in table_order:
            try:
                schema = self.schemas[table_name]
                
                # Create table
                create_sql = self.create_table_sql(schema)
                logger.info(f"🔄 Creating table: {table_name}")
                cursor.execute(create_sql)
                
                # Create indexes
                index_sqls = self.create_indexes_sql(schema)
                for idx_sql in index_sqls:
                    cursor.execute(idx_sql)
                
                logger.info(f"✅ Created table: {table_name}")
                success_count += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to create table {table_name}: {e}")
                continue
        
        cursor.close()
        logger.info(f"📊 Database setup complete: {success_count}/{len(table_order)} tables created")
        return success_count == len(table_order)
    
    def test_database(self):
        """Test database functionality"""
        if not self.conn:
            return False
        
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            # Test couple insertion
            insert_sql = """
            INSERT INTO couples (partner1_name, partner2_name, wedding_date, contact_email, contact_phone)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """
            
            cursor.execute(insert_sql, (
                'Test Partner 1',
                'Test Partner 2', 
                '2024-12-01',
                'test@example.com',
                '+91 9876543210'
            ))
            
            couple_id = cursor.fetchone()['id']
            logger.info(f"✅ Test couple created with ID: {couple_id}")
            
            # Test preferences insertion
            prefs_sql = """
            INSERT INTO preferences_extended (couple_id, wedding_style, budget_range, guest_count)
            VALUES (%s, %s, %s, %s);
            """
            
            cursor.execute(prefs_sql, (couple_id, 'Traditional', '₹20-30 Lakhs', 300))
            logger.info("✅ Test preferences created")
            
            # Clean up test data
            cursor.execute("DELETE FROM preferences_extended WHERE couple_id = %s", (couple_id,))
            cursor.execute("DELETE FROM couples WHERE id = %s", (couple_id,))
            
            logger.info("✅ Database test completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Database test failed: {e}")
            return False
        finally:
            cursor.close()
    
    def get_table_info(self):
        """Get information about created tables"""
        if not self.conn:
            return {}
        
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT table_name, 
                       (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_name = t.table_name AND table_schema = 'public') as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public' 
                AND table_name IN ('couples', 'budget_allocations', 'design_preferences', 
                                 'preferences_extended', 'recommendations', 'vendor_communications',
                                 'vendor_messages', 'vendor_selections', 'venues')
                ORDER BY table_name;
            """)
            
            tables = cursor.fetchall()
            return {row['table_name']: row['column_count'] for row in tables}
            
        except Exception as e:
            logger.error(f"❌ Failed to get table info: {e}")
            return {}
        finally:
            cursor.close()

def main():
    """Main setup function"""
    print("🏗️  REPLIT WEDDING DATABASE SETUP")
    print("=" * 50)
    
    db = ReplitWeddingDatabase()
    
    # Connect to database
    if not db.connect():
        print("❌ Failed to connect to database")
        return False
    
    # Load schemas
    db.load_schemas()
    
    # Create all tables
    print("\n🔄 Creating wedding database tables...")
    if db.create_all_tables():
        print("✅ All tables created successfully")
    else:
        print("⚠️ Some tables may have failed to create")
    
    # Test database
    print("\n🧪 Testing database functionality...")
    if db.test_database():
        print("✅ Database test passed")
    else:
        print("❌ Database test failed")
    
    # Show table summary
    print("\n📋 Table Summary:")
    tables = db.get_table_info()
    for table_name, column_count in tables.items():
        print(f"  📊 {table_name}: {column_count} columns")
    
    print(f"\n🎉 Wedding database setup complete!")
    print(f"📊 Total tables: {len(tables)}")
    print("🔗 Ready for frontend/backend integration")
    
    return True

if __name__ == "__main__":
    main()
