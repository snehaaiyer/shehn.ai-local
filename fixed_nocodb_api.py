"""
Fixed NocoDB API Integration
Provides stable connection and CRUD operations for NocoDB tables
"""

import requests
import json
from typing import Dict, Any, List, Optional
from config.api_config import (
    NOCODB_API_TOKEN,
    TABLE_IDS,
    NOCODB_HEADERS,
    get_nocodb_url
)

class NocoDBAPI:
    def __init__(self):
        self.base_url = get_nocodb_url()
        self.headers = NOCODB_HEADERS
        self.table_ids = TABLE_IDS
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to NocoDB API"""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data if data else None
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"NocoDB API Error: {e}")
            return {"error": str(e)}
    
    def get_table_records(self, table_name: str, query_params: Optional[Dict] = None) -> List[Dict]:
        """Get records from specified table"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records"
            if query_params:
                # Convert query params to NocoDB format
                formatted_params = self._format_query_params(query_params)
                endpoint += f"?{formatted_params}"
            
            response = self._make_request("GET", endpoint)
            return response.get("list", [])
        except Exception as e:
            print(f"Error getting table records: {e}")
            return []
    
    def create_record(self, table_name: str, data: Dict) -> Dict:
        """Create new record in specified table"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records"
            return self._make_request("POST", endpoint, data)
        except Exception as e:
            print(f"Error creating record: {e}")
            return {"error": str(e)}
    
    def update_record(self, table_name: str, record_id: str, data: Dict) -> Dict:
        """Update existing record in specified table"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/{record_id}"
            return self._make_request("PATCH", endpoint, data)
        except Exception as e:
            print(f"Error updating record: {e}")
            return {"error": str(e)}
    
    def delete_record(self, table_name: str, record_id: str) -> Dict:
        """Delete record from specified table"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/{record_id}"
            return self._make_request("DELETE", endpoint)
        except Exception as e:
            print(f"Error deleting record: {e}")
            return {"error": str(e)}
    
    def _format_query_params(self, params: Dict) -> str:
        """Format query parameters for NocoDB API"""
        formatted = []
        for key, value in params.items():
            if isinstance(value, (list, dict)):
                formatted.append(f"{key}={json.dumps(value)}")
            else:
                formatted.append(f"{key}={value}")
        return "&".join(formatted)
    
    def get_linked_records(self, table_name: str, record_id: str, link_table: str) -> List[Dict]:
        """Get linked records from another table"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/{record_id}/{link_table}"
            response = self._make_request("GET", endpoint)
            return response.get("list", [])
        except Exception as e:
            print(f"Error getting linked records: {e}")
            return []
    
    def create_linked_record(self, table_name: str, record_id: str, link_table: str, data: Dict) -> Dict:
        """Create new linked record"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/{record_id}/{link_table}"
            return self._make_request("POST", endpoint, data)
        except Exception as e:
            print(f"Error creating linked record: {e}")
            return {"error": str(e)}
    
    def bulk_create_records(self, table_name: str, records: List[Dict]) -> Dict:
        """Create multiple records in one request"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/bulk"
            return self._make_request("POST", endpoint, {"records": records})
        except Exception as e:
            print(f"Error bulk creating records: {e}")
            return {"error": str(e)}
    
    def bulk_update_records(self, table_name: str, records: List[Dict]) -> Dict:
        """Update multiple records in one request"""
        try:
            endpoint = f"table/{self.table_ids[table_name]}/records/bulk"
            return self._make_request("PATCH", endpoint, {"records": records})
        except Exception as e:
            print(f"Error bulk updating records: {e}")
            return {"error": str(e)} 