#!/usr/bin/env python3
"""
Enhanced Database Setup Script
Creates new NocoDB tables for the wedding blueprint design:
- preferences_extended (multi-select preferences)
- vendor_selections (vendor tracking)
- budget_allocations (budget management)
"""

import requests
import json
import logging
from config.nocodb_config import NOCODB_CONFIG
from nocodb_schemas.preferences_extended_table import get_preferences_extended_table_schema
from nocodb_schemas.vendor_selections_table import get_vendor_selections_table_schema
from nocodb_schemas.budget_allocations_table import get_budget_allocations_table_schema

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NoCoDBAEnhancedSetup:
    def __init__(self):
        self.base_url = NOCODB_CONFIG["BASE_URL"]
        self.headers = {
            "Content-Type": "application/json",
            "xc-token": NOCODB_CONFIG["API_TOKEN"]
        }
        self.project_id = NOCODB_CONFIG["PROJECT_ID"]

    def create_table(self, table_schema: dict) -> bool:
        """Create a table in NocoDB"""
        try:
            table_name = table_schema["table_name"]
            logger.info(f"🔄 Creating table: {table_name}")

            # Check if table already exists
            tables_url = f"{self.base_url}/api/v2/meta/projects/{self.project_id}/tables"
            response = requests.get(tables_url, headers=self.headers)
            
            if response.status_code == 200:
                existing_tables = response.json().get("list", [])
                for table in existing_tables:
                    if table.get("table_name") == table_name:
                        logger.info(f"✅ Table {table_name} already exists")
                        return True

            # Create table
            table_data = {
                "table_name": table_name,
                "title": table_name.replace("_", " ").title(),
                "columns": self._convert_columns(table_schema["columns"])
            }

            response = requests.post(tables_url, headers=self.headers, json=table_data)
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ Created table: {table_name}")
                
                # Create indexes if specified
                if "indexes" in table_schema:
                    self._create_indexes(table_name, table_schema["indexes"])
                
                return True
            else:
                logger.error(f"❌ Failed to create table {table_name}: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"❌ Error creating table {table_name}: {str(e)}")
            return False

    def _convert_columns(self, columns: list) -> list:
        """Convert schema columns to NocoDB format"""
        nocodb_columns = []
        
        for col in columns:
            nocodb_col = {
                "column_name": col["column_name"],
                "title": col["column_name"].replace("_", " ").title()
            }
            
            # Map column types
            if col["type"] == "integer":
                nocodb_col["uidt"] = "Number"
                nocodb_col["dt"] = "int"
            elif col["type"] == "string":
                nocodb_col["uidt"] = "SingleLineText"
                nocodb_col["dt"] = "varchar"
                nocodb_col["dtxp"] = "255"
            elif col["type"] == "text":
                nocodb_col["uidt"] = "LongText"
                nocodb_col["dt"] = "text"
            elif col["type"] == "decimal":
                nocodb_col["uidt"] = "Decimal"
                nocodb_col["dt"] = "decimal"
                nocodb_col["dtxp"] = "10"
                nocodb_col["dtxs"] = "2"
            elif col["type"] == "boolean":
                nocodb_col["uidt"] = "Checkbox"
                nocodb_col["dt"] = "boolean"
            elif col["type"] == "datetime":
                nocodb_col["uidt"] = "DateTime"
                nocodb_col["dt"] = "datetime"
            elif col["type"] == "date":
                nocodb_col["uidt"] = "Date"
                nocodb_col["dt"] = "date"
            elif col["type"] == "json":
                nocodb_col["uidt"] = "JSON"
                nocodb_col["dt"] = "json"
            
            # Set constraints
            nocodb_col["rqd"] = col.get("required", False)
            nocodb_col["pk"] = col.get("primary", False)
            nocodb_col["ai"] = col.get("auto_increment", False)
            
            if "default" in col:
                nocodb_col["cdf"] = col["default"]
            
            nocodb_columns.append(nocodb_col)
        
        return nocodb_columns

    def _create_indexes(self, table_name: str, indexes: list):
        """Create indexes for the table"""
        for index in indexes:
            try:
                logger.info(f"🔄 Creating index {index['name']} on {table_name}")
                # Note: NocoDB API for indexes may vary by version
                # This is a placeholder for index creation
                logger.info(f"📝 Index {index['name']} noted for manual creation if needed")
            except Exception as e:
                logger.warning(f"⚠️ Could not create index {index['name']}: {str(e)}")

    def setup_all_tables(self):
        """Set up all enhanced tables"""
        logger.info("🚀 Setting up enhanced NocoDB tables for wedding blueprint...")
        
        # Get table schemas
        schemas = [
            get_preferences_extended_table_schema(),
            get_vendor_selections_table_schema(),
            get_budget_allocations_table_schema()
        ]
        
        success_count = 0
        total_count = len(schemas)
        
        for schema in schemas:
            if self.create_table(schema):
                success_count += 1
        
        logger.info(f"📊 Setup complete: {success_count}/{total_count} tables created successfully")
        
        if success_count == total_count:
            logger.info("🎉 All enhanced tables are ready!")
            self._print_setup_summary()
        else:
            logger.warning("⚠️ Some tables may need manual creation")

    def _print_setup_summary(self):
        """Print setup summary"""
        logger.info("""
📋 Enhanced Database Setup Complete!

New tables created:
1. 📊 preferences_extended - Multi-select preferences support
   - Floral styles, lighting, furniture, colors (JSON arrays)
   - Budget, guest count, date flexibility
   - Enhanced wedding preferences

2. 🏪 vendor_selections - Vendor tracking system
   - Selected vendors by category
   - Communication log and status tracking
   - Pricing and contract management

3. 💰 budget_allocations - Intelligent budget management
   - Category-wise allocations and percentages
   - AI reasoning and confidence scores
   - Version control and spending tracking

Your wedding blueprint dashboard is now ready! 🎉
        """)

def main():
    """Main setup function"""
    try:
        setup = NoCoDBAEnhancedSetup()
        setup.setup_all_tables()
    except Exception as e:
        logger.error(f"❌ Setup failed: {str(e)}")
        print("\n🔧 Manual setup may be required. Check NocoDB connection and permissions.")

if __name__ == "__main__":
    main() 