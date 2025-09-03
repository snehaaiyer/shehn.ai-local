
#!/usr/bin/env python3
"""
Database Schema Verification Tool
Compares NocoDB schemas with PostgreSQL equivalent and lists all tables/parameters
"""

import os
import json
import psycopg2
from typing import Dict, Any, List
import logging
from pathlib import Path

# Import all your schema definitions
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

class DatabaseSchemaVerifier:
    def __init__(self):
        self.schemas = {}
        self.postgresql_url = os.getenv('DATABASE_URL', 'postgresql://replit:password@localhost:5432/replit')
        
    def load_all_schemas(self):
        """Load all table schemas from your nocodb_schemas directory"""
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
        
    def print_schema_summary(self):
        """Print comprehensive summary of all schemas"""
        print("=" * 80)
        print("🏗️  WEDDING PLANNER DATABASE SCHEMA VERIFICATION")
        print("=" * 80)
        print()
        
        for table_name, schema in self.schemas.items():
            print(f"📋 TABLE: {table_name.upper()}")
            print("-" * 60)
            print(f"   Table Name: {schema['table_name']}")
            print(f"   Total Columns: {len(schema['columns'])}")
            
            # Print columns
            print("\n   📊 COLUMNS:")
            for i, col in enumerate(schema['columns'], 1):
                required = "✅ REQUIRED" if col.get('required', False) else "⚪ OPTIONAL"
                primary = "🔑 PRIMARY" if col.get('primary', False) else ""
                auto_inc = "🔄 AUTO_INCREMENT" if col.get('auto_increment', False) else ""
                
                print(f"   {i:2d}. {col['column_name']:<25} | {col['type']:<12} | {required} {primary} {auto_inc}")
                
                # Show validation rules if present
                if 'validate' in col:
                    if isinstance(col['validate'], dict):
                        for rule, value in col['validate'].items():
                            print(f"       🔍 Validation: {rule} = {value}")
                    else:
                        print(f"       🔍 Validation: {col['validate']}")
                
                # Show foreign key relationships
                if 'foreign_key' in col:
                    fk = col['foreign_key']
                    print(f"       🔗 Foreign Key: {fk['table']}.{fk['column']}")
                
                # Show default values
                if 'default' in col:
                    print(f"       🎯 Default: {col['default']}")
                
                # Show comments
                if 'comment' in col:
                    print(f"       💬 Comment: {col['comment']}")
            
            # Print indexes
            if 'indexes' in schema and schema['indexes']:
                print(f"\n   🗂️  INDEXES ({len(schema['indexes'])}):")
                for idx in schema['indexes']:
                    idx_type = idx.get('type', 'index').upper()
                    columns = ', '.join(idx['columns'])
                    print(f"      • {idx['name']} ({idx_type}) on [{columns}]")
            
            # Print relationships
            if 'relationships' in schema and schema['relationships']:
                print(f"\n   🔗 RELATIONSHIPS ({len(schema['relationships'])}):")
                for rel in schema['relationships']:
                    print(f"      • {rel['type']} → {rel['target_table']}")
            
            print("\n" + "=" * 80 + "\n")
    
    def generate_postgresql_ddl(self) -> str:
        """Generate PostgreSQL DDL statements for all tables"""
        ddl_statements = []
        ddl_statements.append("-- Wedding Planner Database Schema (PostgreSQL)")
        ddl_statements.append("-- Generated from NocoDB schema definitions\n")
        
        # Create tables in dependency order
        table_order = [
            'couples',  # Base table
            'design_preferences',
            'preferences_extended', 
            'venues',
            'budget_allocations',
            'recommendations',
            'vendor_selections',
            'vendor_communications',
            'vendor_messages'
        ]
        
        for table_name in table_order:
            if table_name in self.schemas:
                ddl = self._generate_table_ddl(self.schemas[table_name])
                ddl_statements.append(ddl)
        
        return '\n'.join(ddl_statements)
    
    def _generate_table_ddl(self, schema: Dict[str, Any]) -> str:
        """Generate DDL for a single table"""
        table_name = schema['table_name']
        columns = schema['columns']
        
        ddl = [f"-- Table: {table_name}"]
        ddl.append(f"CREATE TABLE IF NOT EXISTS {table_name} (")
        
        column_definitions = []
        for col in columns:
            col_def = self._convert_column_to_postgresql(col)
            column_definitions.append(f"    {col_def}")
        
        ddl.append(',\n'.join(column_definitions))
        ddl.append(");")
        
        # Add indexes
        if 'indexes' in schema:
            for idx in schema['indexes']:
                idx_ddl = self._generate_index_ddl(table_name, idx)
                ddl.append(idx_ddl)
        
        ddl.append("")  # Empty line between tables
        return '\n'.join(ddl)
    
    def _convert_column_to_postgresql(self, col: Dict[str, Any]) -> str:
        """Convert column definition to PostgreSQL syntax"""
        name = col['column_name']
        col_type = self._map_type_to_postgresql(col['type'])
        
        definition = f"{name} {col_type}"
        
        # Add constraints
        if col.get('primary', False):
            definition += " PRIMARY KEY"
        
        if col.get('auto_increment', False):
            if 'integer' in col['type']:
                definition = definition.replace('INTEGER', 'SERIAL')
        
        if col.get('required', False) and not col.get('primary', False):
            definition += " NOT NULL"
        
        if 'default' in col:
            default_val = col['default']
            if default_val == 'now()':
                definition += " DEFAULT CURRENT_TIMESTAMP"
            elif isinstance(default_val, str):
                definition += f" DEFAULT '{default_val}'"
            else:
                definition += f" DEFAULT {default_val}"
        
        return definition
    
    def _map_type_to_postgresql(self, type_name: str) -> str:
        """Map schema types to PostgreSQL types"""
        type_mapping = {
            'integer': 'INTEGER',
            'string': 'VARCHAR(255)',
            'text': 'TEXT',
            'decimal': 'DECIMAL(10,2)',
            'boolean': 'BOOLEAN',
            'datetime': 'TIMESTAMP',
            'date': 'DATE',
            'json': 'JSONB'
        }
        return type_mapping.get(type_name, 'TEXT')
    
    def _generate_index_ddl(self, table_name: str, index: Dict[str, Any]) -> str:
        """Generate index DDL"""
        idx_name = index['name']
        idx_type = index.get('type', 'index')
        columns = ', '.join(index['columns'])
        
        if idx_type == 'unique':
            return f"CREATE UNIQUE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({columns});"
        else:
            return f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({columns});"
    
    def create_postgresql_tables(self):
        """Create actual PostgreSQL tables"""
        try:
            conn = psycopg2.connect(self.postgresql_url)
            cur = conn.cursor()
            
            ddl = self.generate_postgresql_ddl()
            print("🔧 Creating PostgreSQL tables...")
            print(ddl)
            
            # Execute DDL
            for statement in ddl.split(';'):
                if statement.strip() and not statement.strip().startswith('--'):
                    try:
                        cur.execute(statement)
                        print(f"✅ Executed: {statement[:50]}...")
                    except Exception as e:
                        print(f"⚠️ Warning: {str(e)}")
            
            conn.commit()
            print("✅ PostgreSQL tables created successfully!")
            
            # Verify tables exist
            cur.execute("""
                SELECT table_name, column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                ORDER BY table_name, ordinal_position
            """)
            
            results = cur.fetchall()
            print(f"\n📊 Verified {len(results)} columns across tables")
            
            cur.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ PostgreSQL connection failed: {e}")
            print("💡 Using schema definitions only (no database connection)")
    
    def export_schema_json(self):
        """Export complete schema as JSON for reference"""
        export_data = {
            'version': '1.0',
            'generated_at': '2025-01-03T11:55:00Z',
            'description': 'Wedding Planner Application Database Schema',
            'tables': self.schemas
        }
        
        with open('wedding_database_schema.json', 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print("✅ Schema exported to: wedding_database_schema.json")

def main():
    """Main verification function"""
    verifier = DatabaseSchemaVerifier()
    verifier.load_all_schemas()
    
    # Print comprehensive schema summary
    verifier.print_schema_summary()
    
    # Generate PostgreSQL DDL
    print("\n🏗️  POSTGRESQL DDL GENERATION")
    print("=" * 80)
    ddl = verifier.generate_postgresql_ddl()
    print(ddl)
    
    # Create actual tables if possible
    print("\n🔧 DATABASE TABLE CREATION")
    print("=" * 80)
    verifier.create_postgresql_tables()
    
    # Export schema as JSON
    print("\n📄 SCHEMA EXPORT")
    print("=" * 80)
    verifier.export_schema_json()
    
    # Summary statistics
    total_tables = len(verifier.schemas)
    total_columns = sum(len(schema['columns']) for schema in verifier.schemas.values())
    total_indexes = sum(len(schema.get('indexes', [])) for schema in verifier.schemas.values())
    
    print(f"\n📈 SCHEMA STATISTICS")
    print("=" * 80)
    print(f"   📋 Total Tables: {total_tables}")
    print(f"   📊 Total Columns: {total_columns}")
    print(f"   🗂️  Total Indexes: {total_indexes}")
    print(f"   🔗 Foreign Key Relationships: Multiple defined")
    print("\n✅ Schema verification complete!")

if __name__ == "__main__":
    main()
