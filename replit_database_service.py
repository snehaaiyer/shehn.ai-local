
#!/usr/bin/env python3
"""
Replit Database Service
Direct PostgreSQL integration for wedding planning app
Replaces NocoDB dependency
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReplitDatabaseService:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://replit:password@localhost:5432/replit')
        self.conn = None
        self.connect()
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            self.conn.autocommit = True
            logger.info("✅ Connected to Replit PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def execute_query(self, query: str, params: Tuple = None, fetch: bool = True) -> Optional[List[Dict]]:
        """Execute SQL query with error handling"""
        if not self.conn:
            logger.error("❌ No database connection")
            return None
        
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute(query, params)
            if fetch and cursor.description:
                result = cursor.fetchall()
                return [dict(row) for row in result]
            return []
        except Exception as e:
            logger.error(f"❌ Query failed: {e}")
            return None
        finally:
            cursor.close()
    
    # COUPLES TABLE OPERATIONS
    def create_couple(self, couple_data: Dict[str, Any]) -> Optional[int]:
        """Create a new couple record"""
        query = """
        INSERT INTO couples (partner1_name, partner2_name, wedding_date, contact_email, contact_phone)
        VALUES (%(partner1_name)s, %(partner2_name)s, %(wedding_date)s, %(contact_email)s, %(contact_phone)s)
        RETURNING id;
        """
        
        result = self.execute_query(query, couple_data)
        return result[0]['id'] if result else None
    
    def get_couple(self, couple_id: int) -> Optional[Dict]:
        """Get couple by ID"""
        query = "SELECT * FROM couples WHERE id = %s;"
        result = self.execute_query(query, (couple_id,))
        return result[0] if result else None
    
    def get_all_couples(self) -> List[Dict]:
        """Get all couples"""
        query = "SELECT * FROM couples ORDER BY created_at DESC;"
        return self.execute_query(query) or []
    
    # PREFERENCES OPERATIONS
    def save_preferences(self, preferences_data: Dict[str, Any]) -> bool:
        """Save comprehensive wedding preferences"""
        query = """
        INSERT INTO preferences_extended (
            couple_id, wedding_style, budget_range, guest_count, venue_type,
            preferred_date, dates_flexible, ceremony_type, reception_type,
            floral_styles, lighting_preferences, furniture_preferences, 
            color_schemes, cultural_notes, special_notes
        ) VALUES (
            %(couple_id)s, %(wedding_style)s, %(budget_range)s, %(guest_count)s, %(venue_type)s,
            %(preferred_date)s, %(dates_flexible)s, %(ceremony_type)s, %(reception_type)s,
            %(floral_styles)s, %(lighting_preferences)s, %(furniture_preferences)s,
            %(color_schemes)s, %(cultural_notes)s, %(special_notes)s
        ) ON CONFLICT (couple_id) DO UPDATE SET
            wedding_style = EXCLUDED.wedding_style,
            budget_range = EXCLUDED.budget_range,
            guest_count = EXCLUDED.guest_count,
            updated_at = CURRENT_TIMESTAMP;
        """
        
        result = self.execute_query(query, preferences_data, fetch=False)
        return result is not None
    
    def get_preferences(self, couple_id: int) -> Optional[Dict]:
        """Get preferences for a couple"""
        query = "SELECT * FROM preferences_extended WHERE couple_id = %s;"
        result = self.execute_query(query, (couple_id,))
        return result[0] if result else None
    
    # VENDOR OPERATIONS
    def store_vendors(self, vendors: List[Dict], category: str, location: str, search_query: str) -> bool:
        """Store vendor search results"""
        if not vendors:
            return False
        
        # First, store in vendor_communications for tracking
        for vendor in vendors:
            query = """
            INSERT INTO vendor_communications (
                vendor_name, vendor_category, vendor_location, contact_phone, 
                contact_email, vendor_details, search_query
            ) VALUES (
                %(name)s, %s, %s, %(phone)s, %(email)s, %s, %s
            ) ON CONFLICT (vendor_name, vendor_category) DO NOTHING;
            """
            
            vendor_details = json.dumps({
                'rating': vendor.get('rating', 0),
                'price': vendor.get('price', ''),
                'description': vendor.get('description', ''),
                'address': vendor.get('location', location)
            })
            
            params = {
                'name': vendor.get('name', ''),
                'phone': vendor.get('phone', ''),
                'email': vendor.get('email', '')
            }
            
            self.execute_query(query, (
                params['name'], category, location, params['phone'], 
                params['email'], vendor_details, search_query
            ), fetch=False)
        
        return True
    
    def search_vendors(self, category: str, location: str, search_params: Dict = None) -> List[Dict]:
        """Search for vendors"""
        query = """
        SELECT vendor_name as name, vendor_category as category, vendor_location as location,
               contact_phone as phone, contact_email as email, vendor_details,
               created_at
        FROM vendor_communications 
        WHERE vendor_category ILIKE %s AND vendor_location ILIKE %s
        ORDER BY created_at DESC
        LIMIT 20;
        """
        
        result = self.execute_query(query, (f'%{category}%', f'%{location}%'))
        
        if result:
            # Parse vendor details and format response
            formatted_vendors = []
            for vendor in result:
                details = json.loads(vendor.get('vendor_details', '{}'))
                formatted_vendor = {
                    'name': vendor['name'],
                    'category': vendor['category'],
                    'location': vendor['location'],
                    'phone': vendor['phone'],
                    'email': vendor['email'],
                    'rating': details.get('rating', 0),
                    'price': details.get('price', ''),
                    'description': details.get('description', ''),
                    'created_at': vendor['created_at']
                }
                formatted_vendors.append(formatted_vendor)
            
            return formatted_vendors
        
        return []
    
    # BUDGET OPERATIONS
    def save_budget_allocation(self, allocation_data: Dict[str, Any]) -> bool:
        """Save budget allocation"""
        query = """
        INSERT INTO budget_allocations (
            couple_id, total_budget, budget_tier, venue_allocation, venue_percentage,
            photography_allocation, photography_percentage, catering_allocation, catering_percentage,
            decor_allocation, decor_percentage, beauty_allocation, beauty_percentage,
            entertainment_allocation, entertainment_percentage, flowers_allocation, flowers_percentage,
            transport_allocation, transport_percentage, miscellaneous_allocation, miscellaneous_percentage,
            allocation_type, confidence_score, allocation_reasoning
        ) VALUES (
            %(couple_id)s, %(total_budget)s, %(budget_tier)s, %(venue_allocation)s, %(venue_percentage)s,
            %(photography_allocation)s, %(photography_percentage)s, %(catering_allocation)s, %(catering_percentage)s,
            %(decor_allocation)s, %(decor_percentage)s, %(beauty_allocation)s, %(beauty_percentage)s,
            %(entertainment_allocation)s, %(entertainment_percentage)s, %(flowers_allocation)s, %(flowers_percentage)s,
            %(transport_allocation)s, %(transport_percentage)s, %(miscellaneous_allocation)s, %(miscellaneous_percentage)s,
            %(allocation_type)s, %(confidence_score)s, %(allocation_reasoning)s
        ) ON CONFLICT (couple_id) DO UPDATE SET
            total_budget = EXCLUDED.total_budget,
            budget_tier = EXCLUDED.budget_tier,
            updated_at = CURRENT_TIMESTAMP;
        """
        
        result = self.execute_query(query, allocation_data, fetch=False)
        return result is not None
    
    def get_budget_allocation(self, couple_id: int) -> Optional[Dict]:
        """Get budget allocation for a couple"""
        query = "SELECT * FROM budget_allocations WHERE couple_id = %s AND is_active = true;"
        result = self.execute_query(query, (couple_id,))
        return result[0] if result else None
    
    # VENDOR SELECTIONS
    def save_vendor_selection(self, selection_data: Dict[str, Any]) -> bool:
        """Save vendor selection"""
        query = """
        INSERT INTO vendor_selections (
            couple_id, vendor_name, vendor_category, selection_status, 
            estimated_cost, contact_details, selection_reasoning
        ) VALUES (
            %(couple_id)s, %(vendor_name)s, %(vendor_category)s, %(selection_status)s,
            %(estimated_cost)s, %(contact_details)s, %(selection_reasoning)s
        ) ON CONFLICT (couple_id, vendor_name, vendor_category) DO UPDATE SET
            selection_status = EXCLUDED.selection_status,
            estimated_cost = EXCLUDED.estimated_cost,
            updated_at = CURRENT_TIMESTAMP;
        """
        
        result = self.execute_query(query, selection_data, fetch=False)
        return result is not None
    
    def get_vendor_selections(self, couple_id: int) -> List[Dict]:
        """Get vendor selections for a couple"""
        query = """
        SELECT * FROM vendor_selections 
        WHERE couple_id = %s 
        ORDER BY vendor_category, created_at DESC;
        """
        return self.execute_query(query, (couple_id,)) or []
    
    # VENUES
    def save_venue_preferences(self, venue_data: Dict[str, Any]) -> bool:
        """Save venue preferences"""
        query = """
        INSERT INTO venues (
            couple_id, venue_name, venue_type, location, capacity,
            indoor_outdoor, amenities, pricing_range, availability,
            venue_rating, special_features
        ) VALUES (
            %(couple_id)s, %(venue_name)s, %(venue_type)s, %(location)s, %(capacity)s,
            %(indoor_outdoor)s, %(amenities)s, %(pricing_range)s, %(availability)s,
            %(venue_rating)s, %(special_features)s
        );
        """
        
        result = self.execute_query(query, venue_data, fetch=False)
        return result is not None
    
    def get_venues(self, couple_id: int = None, location: str = None) -> List[Dict]:
        """Get venues"""
        if couple_id:
            query = "SELECT * FROM venues WHERE couple_id = %s ORDER BY venue_rating DESC;"
            params = (couple_id,)
        elif location:
            query = "SELECT * FROM venues WHERE location ILIKE %s ORDER BY venue_rating DESC LIMIT 20;"
            params = (f'%{location}%',)
        else:
            query = "SELECT * FROM venues ORDER BY venue_rating DESC LIMIT 50;"
            params = None
        
        return self.execute_query(query, params) or []
    
    # UTILITY METHODS
    def get_dashboard_stats(self, couple_id: int) -> Dict[str, Any]:
        """Get dashboard statistics for a couple"""
        stats = {
            'vendors_contacted': 0,
            'vendors_selected': 0,
            'budget_allocated': 0,
            'venues_shortlisted': 0
        }
        
        # Vendors contacted
        query = "SELECT COUNT(*) as count FROM vendor_communications WHERE couple_id = %s;"
        result = self.execute_query(query, (couple_id,))
        if result:
            stats['vendors_contacted'] = result[0]['count']
        
        # Vendors selected
        query = "SELECT COUNT(*) as count FROM vendor_selections WHERE couple_id = %s;"
        result = self.execute_query(query, (couple_id,))
        if result:
            stats['vendors_selected'] = result[0]['count']
        
        # Budget info
        query = "SELECT total_budget FROM budget_allocations WHERE couple_id = %s AND is_active = true;"
        result = self.execute_query(query, (couple_id,))
        if result:
            stats['budget_allocated'] = float(result[0]['total_budget'])
        
        # Venues shortlisted
        query = "SELECT COUNT(*) as count FROM venues WHERE couple_id = %s;"
        result = self.execute_query(query, (couple_id,))
        if result:
            stats['venues_shortlisted'] = result[0]['count']
        
        return stats
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            result = self.execute_query("SELECT 1 as test;")
            return result is not None and len(result) > 0
        except:
            return False

# Global database service instance
_db_service = None

def get_database_service() -> ReplitDatabaseService:
    """Get singleton database service instance"""
    global _db_service
    if _db_service is None:
        _db_service = ReplitDatabaseService()
    return _db_service

# Convenience functions for backward compatibility
def store_couple_data(couple_data: Dict) -> Dict[str, Any]:
    """Store couple data and return result"""
    db = get_database_service()
    couple_id = db.create_couple(couple_data)
    
    if couple_id:
        return {
            'success': True,
            'id': couple_id,
            'message': 'Couple data saved successfully'
        }
    else:
        return {
            'success': False,
            'error': 'Failed to save couple data'
        }

def search_vendors_by_category(category: str, location: str, search_params: Dict = None) -> List[Dict]:
    """Search vendors by category and location"""
    db = get_database_service()
    return db.search_vendors(category, location, search_params)

if __name__ == "__main__":
    # Test the database service
    db = get_database_service()
    print(f"Database connection test: {'✅ Success' if db.test_connection() else '❌ Failed'}")
