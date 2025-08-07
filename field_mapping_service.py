from typing import Dict, Any, List
import json
from datetime import datetime

class FieldMappingService:
    """
    Handles mapping between frontend field names and NocoDB database field names
    """
    
    def __init__(self):
        self.frontend_to_db_mapping = {
            # Core wedding information
            "yourName": {"table": "couples", "field": "Partner1 Name", "type": "string"},
            "partner1Name": {"table": "couples", "field": "Partner1 Name", "type": "string"},
            "partnerName": {"table": "couples", "field": "Partner2 Name", "type": "string"},
            "partner2Name": {"table": "couples", "field": "Partner2 Name", "type": "string"},
            "weddingDate": {"table": "couples", "field": "Wedding Date", "type": "string"},
            "city": {"table": "weddings", "field": "City", "type": "string"},
            "region": {"table": "weddings", "field": "City", "type": "string"},
            "guestCount": {"table": "weddings", "field": "Guest Count", "type": "string"},
            "budget": {"table": "weddings", "field": "Budget Range", "type": "string"},
            "budgetRange": {"table": "weddings", "field": "Budget Range", "type": "string"},
            
            # Wedding details for weddings table
            "weddingType": {"table": "weddings", "field": "Type", "type": "string"},
            "duration": {"table": "weddings", "field": "Duration", "type": "string"},
            "weddingDays": {"table": "weddings", "field": "Duration", "type": "string"},
            
            # Visual Preferences - map to preferences table with correct field names
            "weddingTheme": {"table": "preferences", "field": "Event Theme", "type": "string"},
            "theme": {"table": "preferences", "field": "Event Theme", "type": "string"},
            "decorationTheme": {"table": "preferences", "field": "Event Theme", "type": "string"},
            
            "photographyStyle": {"table": "preferences", "field": "Style Preference", "type": "string"},
            "photography": {"table": "preferences", "field": "Style Preference", "type": "string"},
            
            "venueType": {"table": "preferences", "field": "Venue Location", "type": "string"},
            "venue": {"table": "preferences", "field": "Venue Location", "type": "string"},
            "venuePreference": {"table": "preferences", "field": "Venue Location", "type": "string"},
            
            "decorStyle": {"table": "preferences", "field": "Design Style", "type": "string"},
            "decor": {"table": "preferences", "field": "Design Style", "type": "string"},
            
            "cuisineStyle": {"table": "preferences", "field": "Essential Elements", "type": "string"},
            "cuisine": {"table": "preferences", "field": "Essential Elements", "type": "string"},
            
            "floralStyle": {"table": "preferences", "field": "Decoration Elements flowers", "type": "string"},
            "floral": {"table": "preferences", "field": "Decoration Elements flowers", "type": "string"},
            
            "lightingStyle": {"table": "preferences", "field": "Lighting Options type", "type": "string"},
            "lighting": {"table": "preferences", "field": "Lighting Options type", "type": "string"},
            
            "furnitureStyle": {"table": "preferences", "field": "Table Centerpieces style", "type": "string"},
            "furniture": {"table": "preferences", "field": "Table Centerpieces style", "type": "string"},
            
            "musicPreferences": {"table": "preferences", "field": "Cultural Notes", "type": "json"},
            "music": {"table": "preferences", "field": "Cultural Notes", "type": "json"},
            
            "entertainmentPreferences": {"table": "preferences", "field": "Special Notes", "type": "json"},
            "entertainment": {"table": "preferences", "field": "Special Notes", "type": "json"},
            
            # Legacy preferences
            "weddingStyle": {"table": "preferences", "field": "Style Preference", "type": "string"},
            "events": {"table": "preferences", "field": "Planned Events", "type": "json"},
            "priorities": {"table": "preferences", "field": "Essential Elements", "type": "json"},
            "specialRequirements": {"table": "preferences", "field": "Special Notes", "type": "text"},
        }
        
        # Default contact info (since required in couples table)
        self.default_contact = {
            "Primary Email": "temp@example.com",  # Will be updated later
            "Primary Phone": "+91-0000000000",    # Will be updated later
            "Status": "Active"
        }
    
    def transform_frontend_to_db(self, frontend_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Transform frontend form data into database table records
        Returns dict with table names as keys and record data as values
        """
        db_records = {}
        
        # Initialize table records
        db_records["couples"] = {**self.default_contact}
        db_records["weddings"] = {"Status": "Planning"}
        db_records["preferences"] = {}
        
        # Map each frontend field to appropriate database table/field
        for frontend_field, value in frontend_data.items():
            if frontend_field in self.frontend_to_db_mapping:
                mapping = self.frontend_to_db_mapping[frontend_field]
                table = mapping["table"]
                db_field = mapping["field"]
                field_type = mapping["type"]
                
                # Transform the value based on type
                transformed_value = self._transform_value(value, field_type)
                
                # Set the value in the appropriate table record
                if table not in db_records:
                    db_records[table] = {}
                db_records[table][db_field] = transformed_value
        
        # Generate wedding name from couple names
        partner1 = db_records["couples"].get("Partner1 Name", "")
        partner2 = db_records["couples"].get("Partner2 Name", "")
        if partner1 and partner2:
            db_records["weddings"]["Name"] = f"{partner1} & {partner2} Wedding"
        
        # Clean up empty records
        db_records = {k: v for k, v in db_records.items() if v and any(v.values())}
        
        return db_records
    
    def _transform_value(self, value: Any, field_type: str) -> Any:
        """Transform value based on expected database field type"""
        if value is None or value == "":
            return None
            
        if field_type == "string":
            return str(value)
        elif field_type == "date":
            # Ensure date is in proper format
            if isinstance(value, str):
                return value  # Assume frontend sends YYYY-MM-DD
            return str(value)
        elif field_type == "json":
            # Convert arrays to JSON strings for NocoDB
            if isinstance(value, (list, dict)):
                return json.dumps(value)
            return value
        elif field_type == "text":
            return str(value) if value else None
        else:
            return value
    
    def transform_db_to_frontend(self, db_records: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Transform database records back to frontend format
        """
        frontend_data = {}
        
        # Reverse mapping
        db_to_frontend_mapping = {}
        for frontend_field, mapping in self.frontend_to_db_mapping.items():
            table_field_key = f"{mapping['table']}.{mapping['field']}"
            db_to_frontend_mapping[table_field_key] = {
                "frontend_field": frontend_field,
                "type": mapping["type"]
            }
        
        # Transform each database record back to frontend format
        for table_name, record in db_records.items():
            for db_field, value in record.items():
                table_field_key = f"{table_name}.{db_field}"
                if table_field_key in db_to_frontend_mapping:
                    mapping = db_to_frontend_mapping[table_field_key]
                    frontend_field = mapping["frontend_field"]
                    field_type = mapping["type"]
                    
                    # Transform the value back
                    transformed_value = self._transform_db_value_to_frontend(value, field_type)
                    frontend_data[frontend_field] = transformed_value
        
        return frontend_data
    
    def _transform_db_value_to_frontend(self, value: Any, field_type: str) -> Any:
        """Transform database value back to frontend format"""
        if value is None:
            return "" if field_type in ["string", "text", "date"] else []
            
        if field_type == "json":
            # Parse JSON strings back to arrays/objects
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return []
            return value
        else:
            return value
    
    def get_table_order(self) -> List[str]:
        """
        Return the order in which tables should be created (considering foreign keys)
        """
        return ["couples", "weddings", "preferences"]
    
    def get_required_fields(self, table_name: str) -> List[str]:
        """Get required fields for a specific table"""
        required_fields = {
            "couples": ["Partner1 Name", "Partner2 Name", "Wedding Date", "Primary Email", "Primary Phone"],
            "weddings": ["Name", "Guest Count", "Status"],
            "preferences": []
        }
        return required_fields.get(table_name, [])
    
    def validate_record(self, table_name: str, record: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate that a record has all required fields"""
        required = self.get_required_fields(table_name)
        missing = []
        
        for field in required:
            if field not in record or record[field] is None or record[field] == "":
                missing.append(field)
        
        return len(missing) == 0, missing

# Example usage and testing
def test_field_mapping():
    """Test the field mapping service"""
    mapper = FieldMappingService()
    
            # Sample frontend data (like from your frontend widget)
    frontend_data = {
        "yourName": "Priya",
        "partnerName": "Rahul",
        "weddingDate": "2024-12-15",
        "weddingType": "Hindu",
        "city": "Mumbai",
        "events": ["Engagement", "Sangeet", "Wedding Ceremony"],
        "duration": "3 Days",
        "guestCount": 200,
        "budgetRange": "₹20-30 Lakhs",
        "priorities": ["Venue", "Catering", "Photography"],
        "weddingStyle": "Traditional",
        "specialRequirements": "Vegetarian catering only, no alcohol"
    }
    
    print("🔄 Testing Field Mapping Service")
    print("="*50)
    
    # Transform to database format
    print("\n1. Frontend to Database mapping:")
    db_records = mapper.transform_frontend_to_db(frontend_data)
    
    for table, record in db_records.items():
        print(f"\n{table.upper()} Table:")
        for field, value in record.items():
            print(f"  {field}: {value}")
    
    # Validate records
    print("\n2. Validation check:")
    for table, record in db_records.items():
        is_valid, missing = mapper.validate_record(table, record)
        if is_valid:
            print(f"✅ {table}: Valid")
        else:
            print(f"❌ {table}: Missing fields: {missing}")
    
    # Transform back to frontend
    print("\n3. Database to Frontend mapping:")
    frontend_restored = mapper.transform_db_to_frontend(db_records)
    
    print("Restored frontend data:")
    for field, value in frontend_restored.items():
        print(f"  {field}: {value}")
    
    return db_records

if __name__ == "__main__":
    test_field_mapping() 