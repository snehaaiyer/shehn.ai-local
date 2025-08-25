"""
Centralized NocoDB configuration for the wedding planner application.
"""
from typing import Dict, Any, Optional
import requests
import logging
import json
from datetime import datetime
import os # Import os module for environment variables

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# NocoDB Configuration
# Updated to use environment variables for flexibility
NOCODB_CONFIG = {
    "BASE_URL": os.getenv('NOCODB_BASE_URL', 'http://localhost:8080'),
    "PROJECT_ID": os.getenv('NOCODB_PROJECT_ID', 'p2manqkz6afk3ma'),
    "API_TOKEN": os.getenv('NOCODB_API_TOKEN', '-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk'),
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
    # Use environment variables if available, otherwise fall back to defaults
    BASE_URL = os.getenv('NOCODB_BASE_URL', 'http://localhost:8080')
    WORKSPACE_ID = os.getenv('NOCODB_WORKSPACE_ID', 'w6gi3jq7') # Default workspace ID
    PROJECT_ID = os.getenv('NOCODB_PROJECT_ID', 'p2manqkz6afk3ma') # Default project ID
    API_TOKEN = os.getenv('NOCODB_API_TOKEN', '-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk') # Default API token

    # Table IDs
    # Table IDs (verified working)
    TABLE_IDS = {
        "weddings": "mslkrxqymrbe01d",
        "venues": "m8o47zj6gmkmguz",
        "vendors": "mpw9em3omtlqlsg",
        "preferences": "mx7nrptxiiqbsty",
        "couples": "mcv14lxgtp3rwa5"
    }

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
            raise ValueError("API token is required. Please set NOCODB_API_TOKEN environment variable.")
        if not self.WORKSPACE_ID:
            raise ValueError("Workspace ID is required. Please set NOCODB_WORKSPACE_ID environment variable.")
        if not self.PROJECT_ID:
            raise ValueError("Project ID is required. Please set NOCODB_PROJECT_ID environment variable.")
        if not all(self.TABLE_IDS.values()):
            raise ValueError("All table IDs must be provided.")

    def get_table_url(self, table_name: str) -> str:
        """Get the full API URL for a table."""
        if table_name not in self.TABLE_IDS:
            raise ValueError(f"Unknown table: {table_name}")
        # NocoDB API structure is typically /api/v1/tables/{table_id}/...
        return f"{self.BASE_URL}/api/v1/tables/{self.TABLE_IDS[table_name]}"

    def test_connection(self) -> bool:
        """Test the NocoDB connection."""
        try:
            # Test with weddings table by trying to get records
            response = requests.get(
                f"{self.get_table_url('weddings')}/records",
                headers=self.headers,
                params={"limit": 1}
            )

            if response.status_code == 200:
                logger.info("✅ NocoDB connection successful")
                return True
            else:
                logger.error(f"❌ NocoDB connection failed: Status Code {response.status_code}, Response: {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ NocoDB connection error (RequestException): {str(e)}")
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
            raise ConnectionError("Failed to connect to NocoDB. Please check your configuration and NocoDB instance.")

    def _handle_response(self, response: requests.Response, operation: str) -> Dict[str, Any]:
        """Handle API response with proper error handling."""
        try:
            if response.status_code in (200, 201):
                data = response.json()
                # NocoDB API usually returns records in a 'list' field, and 'id' for single records.
                # Normalize response to ensure consistent 'Id' field.
                if isinstance(data, dict):
                    if 'id' in data:
                        data['Id'] = data.pop('id') # Rename 'id' to 'Id'
                    if 'list' in data and isinstance(data['list'], list):
                        for record in data['list']:
                            if 'id' in record:
                                record['Id'] = record.pop('id') # Rename 'id' to 'Id' in list items
                return data
            else:
                logger.error(f"NocoDB {operation} failed. Status: {response.status_code}, Response: {response.text}")
                return {"error": response.text, "status_code": response.status_code}
        except json.JSONDecodeError:
            logger.error(f"Error decoding JSON response for {operation}. Response text: {response.text}")
            return {"error": "Invalid JSON response", "status_code": response.status_code}
        except Exception as e:
            logger.error(f"Error processing {operation} response: {str(e)}")
            return {"error": str(e), "status_code": response.status_code}


    def _validate_data(self, table_name: str, data: Dict[str, Any]) -> bool:
        """Validate data against required fields."""
        if not data:
            logger.error(f"Empty data provided for table '{table_name}'")
            return False

        required_fields = self.config.REQUIRED_FIELDS.get(table_name)
        if not required_fields:
            logger.warning(f"No required fields defined for table '{table_name}'. Skipping validation.")
            return True

        missing_fields = [field for field in required_fields if field not in data or data[field] is None or data[field] == ""]
        if missing_fields:
            logger.error(f"Missing or empty required fields for '{table_name}': {missing_fields}")
            return False

        return True

    def create_record(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a record in the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            if not self._validate_data(table_name, data):
                return {"error": "Data validation failed"}

            # Add metadata for creation
            data["Created At"] = datetime.now().isoformat()
            data["Updated At"] = data["Created At"]

            response = requests.post(
                f"{self.config.get_table_url(table_name)}/records",
                headers=self.config.headers,
                json=data
            )

            result = self._handle_response(response, "create")
            # Ensure 'Id' is present in the result for single record creation
            if isinstance(result, dict) and 'id' in result:
                result['Id'] = result.pop('id')
            return result

        except ValueError as e:
            logger.error(f"Validation error during record creation: {str(e)}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error creating record in '{table_name}': {str(e)}")
            return {"error": str(e)}

    def get_records(self, table_name: str, limit: int = 25, offset: int = 0) -> Dict[str, Any]:
        """Get records from the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            params = {"limit": limit, "offset": offset}
            response = requests.get(
                f"{self.config.get_table_url(table_name)}/records",
                headers=self.config.headers,
                params=params
            )

            result = self._handle_response(response, "get")
            # Ensure 'Id' is present for records in the list
            if isinstance(result, dict) and 'list' in result:
                for record in result['list']:
                    if 'id' in record:
                        record['Id'] = record.pop('id')
            return result

        except ValueError as e:
            logger.error(f"Validation error during get records: {str(e)}")
            return {"error": str(e), "list": []}
        except Exception as e:
            logger.error(f"Error getting records from '{table_name}': {str(e)}")
            return {"error": str(e), "list": []}

    def update_record(self, table_name: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record in the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # Validate data before attempting update
            if not self._validate_data(table_name, data):
                 return {"error": "Data validation failed"}

            # Add metadata for update
            data["Updated At"] = datetime.now().isoformat()

            response = requests.patch(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers,
                json=data
            )

            # Handle response, including checking for not found
            if response.status_code == 404:
                logger.error(f"Record with ID '{record_id}' not found in table '{table_name}' for update.")
                return {"error": "Record not found", "status_code": 404}

            result = self._handle_response(response, "update")
            # Ensure 'Id' is present in the result for single record update
            if isinstance(result, dict) and 'id' in result:
                result['Id'] = result.pop('id')
            return result

        except ValueError as e:
            logger.error(f"Validation error during record update: {str(e)}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error updating record '{record_id}' in '{table_name}': {str(e)}")
            return {"error": str(e)}

    def delete_record(self, table_name: str, record_id: str) -> bool:
        """Delete a record from the specified table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # NocoDB delete operation returns 200 or 204 on success
            response = requests.delete(
                f"{self.config.get_table_url(table_name)}/records/{record_id}",
                headers=self.config.headers
            )

            if response.status_code == 404:
                logger.error(f"Record with ID '{record_id}' not found in table '{table_name}' for deletion.")
                return False
            elif response.status_code in (200, 204):
                logger.info(f"Successfully deleted record '{record_id}' from '{table_name}'.")
                return True
            else:
                logger.error(f"Failed to delete record '{record_id}' from '{table_name}'. Status: {response.status_code}, Response: {response.text}")
                return False

        except ValueError as e:
            logger.error(f"Validation error during record deletion: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error deleting record '{record_id}' from '{table_name}': {str(e)}")
            return False

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get the schema for a table."""
        try:
            if table_name not in self.config.TABLE_IDS:
                raise ValueError(f"Unknown table: {table_name}")

            # NocoDB API for schema usually involves getting table details and then columns
            # Get table details
            info_response = requests.get(
                f"{self.config.get_table_url(table_name)}",
                headers=self.config.headers
            )

            if info_response.status_code == 404:
                logger.error(f"Table '{table_name}' not found.")
                return {"error": "Table not found"}

            table_info = self._handle_response(info_response, "get table info")
            if not table_info or 'name' not in table_info: # Assuming 'name' is the table title
                logger.error(f"Could not retrieve valid info for table '{table_name}'.")
                return {"error": "Failed to retrieve table info"}

            # Get column definitions
            columns_response = requests.get(
                f"{self.config.get_table_url(table_name)}/columns",
                headers=self.config.headers
            )

            if columns_response.status_code == 404:
                logger.error(f"Schema (columns) not found for table '{table_name}'.")
                return {"error": "Schema not found"}

            columns_data = self._handle_response(columns_response, "get columns")
            if not isinstance(columns_data, dict) or 'list' not in columns_data:
                logger.error(f"Invalid response format for columns of table '{table_name}'.")
                return {"error": "Invalid columns response"}

            schema_fields = []
            for column in columns_data.get("list", []):
                field = {
                    "name": column.get("title", column.get("name", "")), # Use title if available, otherwise name
                    "type": column.get("smarttype", column.get("type", "")), # Use smarttype if available
                    "required": column.get("required", False),
                    "unique": column.get("unique", False),
                    "allow_null": column.get("allow_null", True) # Often useful to include
                }
                schema_fields.append(field)

            return {
                "name": table_info.get("title", table_name), # Use table title from info
                "fields": schema_fields
            }

        except ValueError as e:
            logger.error(f"Validation error during get table schema: {str(e)}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error getting table schema for '{table_name}': {str(e)}")
            return {"error": str(e)}

# Test the configuration if run directly
if __name__ == "__main__":
    try:
        print("Attempting to initialize NocoDB client...")
        client = NocoDBClient()
        print("✅ NocoDB Client initialized successfully!")

        # Test getting some records
        print("\nTesting get_records for 'weddings' table...")
        weddings = client.get_records("weddings", limit=1)
        if "error" in weddings:
            print(f"Error fetching weddings: {weddings['error']}")
        else:
            print(f"Successfully fetched {len(weddings.get('list', []))} wedding record(s).")

        # Get table schema
        print("\nTesting get_table_schema for 'weddings' table...")
        schema = client.get_table_schema("weddings")
        if "error" in schema:
            print(f"Error fetching schema: {schema['error']}")
        else:
            print(f"Successfully fetched schema for '{schema.get('name', 'weddings')}':")
            for field in schema.get("fields", []):
                print(f"- {field['name']} (Type: {field['type']}, Required: {field['required']})")

        # Example of creating a record (uncomment to test)
        # print("\nTesting create_record for 'couples' table...")
        # new_couple_data = {
        #     "Partner1 Name": "Test Partner 1",
        #     "Partner2 Name": "Test Partner 2",
        #     "Wedding Date": datetime.now().strftime("%Y-%m-%d")
        # }
        # created_couple = client.create_record("couples", new_couple_data)
        # if "error" in created_couple:
        #     print(f"Error creating couple: {created_couple['error']}")
        # else:
        #     print(f"Successfully created couple with ID: {created_couple.get('Id')}")
        #     # Example of updating the created record (uncomment to test)
        #     # print("\nTesting update_record...")
        #     # updated_couple = client.update_record("couples", created_couple.get("Id"), {"Partner1 Name": "Updated Partner 1"})
        #     # if "error" in updated_couple:
        #     #     print(f"Error updating couple: {updated_couple['error']}")
        #     # else:
        #     #     print(f"Successfully updated couple. Name: {updated_couple.get('Partner1 Name')}")

        #     # Example of deleting the created record (uncomment to test)
        #     # print("\nTesting delete_record...")
        #     # deleted = client.delete_record("couples", created_couple.get("Id"))
        #     # print(f"Deletion successful: {deleted}")

    except ConnectionError as ce:
        print(f"❌ Initialization failed: {ce}")
    except ValueError as ve:
        print(f"❌ Configuration error: {ve}")
    except Exception as e:
        print(f"❌ An unexpected error occurred during testing: {str(e)}")