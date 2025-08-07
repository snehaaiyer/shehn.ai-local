"""
Centralized NocoDB configuration for the wedding planner application.
"""
from typing import Dict, Any, Optional
import requests
import logging
import json
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# NocoDB Configuration
NOCODB_CONFIG = {
    "BASE_URL": "http://localhost:8080",
    "PROJECT_ID": "p2manqkz6afk3ma",
    "API_TOKEN": "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk",
    "TABLE_IDS": {
        "weddings": "mslkrxqymrbe01d",
        "venues": "m8o47zj6gmkmguz",
        "vendors": "mpw9em3omtlqlsg",
        "preferences": "mx7nrptxiiqbsty",
        "couples": "mcv14lxgtp3rwa5"
    }
}

# API Endpoints
API_ENDPOINTS = {
    "couples": f"{NOCODB_CONFIG['BASE_URL']}/tables/{NOCODB_CONFIG['TABLE_IDS']['couples']}/records",
    "weddings": f"{NOCODB_CONFIG['BASE_URL']}/tables/{NOCODB_CONFIG['TABLE_IDS']['weddings']}/records",
    "preferences": f"{NOCODB_CONFIG['BASE_URL']}/tables/{NOCODB_CONFIG['TABLE_IDS']['preferences']}/records",
    "venues": f"{NOCODB_CONFIG['BASE_URL']}/tables/{NOCODB_CONFIG['TABLE_IDS']['venues']}/records",
    "vendors": f"{NOCODB_CONFIG['BASE_URL']}/tables/{NOCODB_CONFIG['TABLE_IDS']['vendors']}/records"
}

class NocoDBConfig:
    # NocoDB Instance Configuration
    BASE_URL = NOCODB_CONFIG["BASE_URL"]
    WORKSPACE_ID = "w6gi3jq7"
    PROJECT_ID = NOCODB_CONFIG["PROJECT_ID"]
    API_TOKEN = NOCODB_CONFIG["API_TOKEN"]

    # Table IDs
    # Table IDs (verified working)
    TABLE_IDS = NOCODB_CONFIG["TABLE_IDS"]

    # Required fields for each table
    REQUIRED_FIELDS = {
        "weddings": ["Name", "Date", "Status"],
        "couples": ["Partner1 Name", "Partner2 Name", "Wedding Date"],
        "preferences": ["Wedding Style"],
        "venues": ["Name", "Location"],
        "vendors": ["Name", "Service Type"],
        "tasks": ["Title", "Status"],
        "communications": ["Subject", "Type"],
        "ceremonies": ["Name", "Type"],
        "budget": ["Category", "Amount"],
        "ai_activities": ["Activity Type", "Description"]
    }

    def __init__(self):
        """Initialize NocoDB configuration with validation."""
        self.headers = {
            "xc-token": self.API_TOKEN,
            "Content-Type": "application/json"
        }
        self._validate_config()

    def _validate_config(self) -> None:
        """Validate the configuration settings."""
        if not self.API_TOKEN:
            raise ValueError("API token is required")
        if not self.WORKSPACE_ID:
            raise ValueError("Workspace ID is required")
        if not self.PROJECT_ID:
            raise ValueError("Project ID is required")
        if not all(self.TABLE_IDS.values()):
            raise ValueError("All table IDs must be provided")

    def get_table_url(self, table_name: str) -> str:
        """Get the full API URL for a table."""
        if table_name not in self.TABLE_IDS:
            raise ValueError(f"Unknown table: {table_name}")
        return f"{self.BASE_URL}/{self.TABLE_IDS[table_name]}"  # Updated URL structure

    def test_connection(self) -> bool:
        """Test the NocoDB connection."""
        try:
            # Test with weddings table
            response = requests.get(
                f"{self.get_table_url('weddings')}/records",
                headers=self.headers,
                params={"limit": 1}
            )
            
            if response.status_code == 200:
                logger.info("✅ NocoDB connection successful")
                return True
            else:
                logger.error(f"❌ NocoDB connection failed: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ NocoDB connection error: {str(e)}")
            return False

class NocoDBClient:
    """Client for interacting with NocoDB."""
    
    def __init__(self, config: Optional[NocoDBConfig] = None):
        """Initialize the NocoDB client."""
        self.config = config or NocoDBConfig()
        if not self.config.test_connection():
            raise ConnectionError("Failed to connect to NocoDB")

    def _handle_response(self, response: requests.Response, operation: str) -> Dict[str, Any]:
        """Handle API response with proper error handling."""
        try:
            if response.status_code in (200, 201):
                data = response.json()
                # Handle case sensitivity in record IDs
                if isinstance(data, dict):
                    if 'id' in data:
                        data['Id'] = data['id']
                    if 'list' in data:
                        for record in data['list']:
                            if 'id' in record:
                                record['Id'] = record['id']
                return data
            else:
                logger.error(f"NocoDB {operation} failed: {response.text}")
                return {}
        except Exception as e:
            logger.error(f"Error parsing {operation} response: {str(e)}")
            return {}

    def _validate_data(self, table_name: str, data: Dict[str, Any]) -> bool:
        """Validate data against required fields."""
        if not data:
            logger.error("Empty data provided")
            return False

        required_fields = self.config.REQUIRED_FIELDS.get(table_name, [])
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.error(f"Missing required fields for {table_name}: {missing_fields}")
            return False
            
        return True

    def create_record(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a record in the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            if not self._validate_data(table_name, data):
                return {}

            # Add metadata
            data["Created At"] = datetime.now().isoformat()
            data["Updated At"] = data["Created At"]
            
            response = requests.post(
                f"{self.config.get_table_url(table_name)}/records",
                headers=self.config.headers,
                json=data
            )
            
            result = self._handle_response(response, "create")
            if result and 'id' in result:
                result['Id'] = result['id']  # Ensure Id is present
            return result
                
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error creating record: {str(e)}")
            return {}

    def get_records(self, table_name: str, limit: int = 25) -> Dict[str, Any]:
        """Get records from the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            response = requests.get(
                f"{self.config.get_table_url(table_name)}/records",
                headers=self.config.headers,
                params={"limit": limit}
            )
            
            result = self._handle_response(response, "get")
            # Handle case sensitivity in record IDs for list of records
            if 'list' in result:
                for record in result['list']:
                    if 'id' in record:
                        record['Id'] = record['id']
            return result
                
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error getting records: {str(e)}")
            return {"list": []}

    def update_record(self, table_name: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record in the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # First verify the record exists
            get_response = requests.get(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers
            )
            
            if get_response.status_code == 404:
                logger.error(f"Record {record_id} not found in table {table_name}")
                return {}

            # Add metadata
            data["Updated At"] = datetime.now().isoformat()
            
            # Updated PATCH endpoint URL structure
            response = requests.patch(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers,
                json=data
            )
            
            if response.status_code == 404:
                logger.error(f"Record {record_id} not found in table {table_name}")
                return {}
            
            # For successful updates, get the updated record
            if response.status_code in (200, 201):
                get_response = requests.get(
                    f"{self.config.get_table_url(table_name)}/records/{record_id}",
                    headers=self.config.headers
                )
                result = self._handle_response(get_response, "get")
                if result and 'id' in result:
                    result['Id'] = result['id']  # Ensure Id is present
                return result
            
            return {}
                
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error updating record: {str(e)}")
            return {}

    def delete_record(self, table_name: str, record_id: str) -> bool:
        """Delete a record from the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # First verify the record exists
            get_response = requests.get(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers
            )
            
            if get_response.status_code == 404:
                logger.error(f"Record {record_id} not found in table {table_name}")
                return False

            # Delete the record
            response = requests.delete(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers
            )
            
            success = response.status_code in (200, 204)
            if success:
                # Verify deletion
                verify_response = requests.get(
                    f"{self.config.get_table_url(table_name)}/records/{record_id}",
                    headers=self.config.headers
                )
                return verify_response.status_code == 404
            
            return False
            
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error deleting record: {str(e)}")
            return False

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get the schema for a table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # Get table info first
            info_response = requests.get(
                f"{self.config.get_table_url(table_name)}",
                headers=self.config.headers
            )
            
            if info_response.status_code == 404:
                logger.error(f"Table {table_name} not found")
                return {}

            table_info = info_response.json()
            
            # Get column info
            columns_response = requests.get(
                f"{self.config.get_table_url(table_name)}/columns",
                headers=self.config.headers
            )
            
            if columns_response.status_code == 404:
                logger.error(f"Schema not found for table {table_name}")
                return {}

            columns = columns_response.json()
            
            # Format schema response
            schema = {
                "name": table_info.get("title", table_name),
                "fields": []
            }
            
            for column in columns:
                field = {
                    "name": column.get("title", ""),
                    "type": column.get("uidt", ""),
                    "required": column.get("required", False),
                    "unique": column.get("unique", False)
                }
                schema["fields"].append(field)
            
            return schema
                
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error getting table schema: {str(e)}")
            return {}

# Test the configuration if run directly
if __name__ == "__main__":
    try:
        client = NocoDBClient()
        print("✅ NocoDB configuration is valid and connection successful!")
        
        # Test getting some records
        weddings = client.get_records("weddings", limit=1)
        print(f"Found {len(weddings.get('list', []))} wedding records")
        
        # Get table schema
        schema = client.get_table_schema("weddings")
        print("\nWeddings table schema:")
        for field in schema.get("fields", []):
            print(f"- {field['name']}: {field['type']}")
        
    except Exception as e:
        print(f"❌ Configuration test failed: {str(e)}") 