
#!/usr/bin/env python3
"""
Enhanced Vendor Selection API with RAG Integration
Processes wedding preferences through RAG-enhanced vendor extraction
"""

import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, List, Any
from datetime import datetime
import os

# Import our RAG-enhanced vendor extraction
from rag_enhanced_vendor_extraction import (
    RAGEnhancedVendorExtractor, 
    create_vendor_context_from_preferences,
    VendorContext
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize RAG-enhanced extractor
rag_extractor = RAGEnhancedVendorExtractor()

@app.route('/api/intelligent-vendor-selection', methods=['POST'])
def intelligent_vendor_selection():
    """
    RAG-Enhanced Intelligent Vendor Selection API
    """
    try:
        data = request.get_json()
        
        wedding_data = data.get('weddingData', {})
        search_params = data.get('searchParams', {})
        filter_category = data.get('filterCategory')
        rag_enabled = data.get('ragEnabled', True)
        
        logger.info(f"🚀 Processing RAG-enhanced vendor selection")
        logger.info(f"📊 Wedding data: Guest count {wedding_data.get('guestCount')}, Budget: {wedding_data.get('budgetRange')}")
        logger.info(f"🎯 Filter category: {filter_category}, RAG enabled: {rag_enabled}")
        
        # Get base vendors (mock data for now, replace with database query)
        base_vendors = get_mock_vendors_for_rag_processing(filter_category, wedding_data.get('city', 'Mumbai'))
        
        if not rag_enabled:
            # Return basic vendors without RAG enhancement
            return jsonify({
                'success': True,
                'final_recommendations': {filter_category or 'all': base_vendors},
                'total_vendors': len(base_vendors),
                'rag_enabled': False
            })
        
        # Create vendor context from wedding preferences
        vendor_context = create_vendor_context_from_preferences(wedding_data)
        
        logger.info(f"🧠 Created vendor context: {vendor_context.location}, {vendor_context.guest_count} guests")
        
        # Process vendors through RAG enhancement
        enhanced_vendors = []
        for vendor in base_vendors:
            try:
                enhanced_vendor = rag_extractor.extract_enhanced_vendor_info(vendor, vendor_context)
                
                # Convert enhanced vendor to dict for JSON response
                enhanced_vendor_dict = {
                    'id': enhanced_vendor.id,
                    'name': enhanced_vendor.name,
                    'category': enhanced_vendor.category,
                    'location': enhanced_vendor.location,
                    'rating': enhanced_vendor.rating,
                    'price_range': enhanced_vendor.price_range,
                    'description': enhanced_vendor.description,
                    'contact_score': enhanced_vendor.contact_score,
                    
                    # Enhanced RAG fields
                    'context_match_score': enhanced_vendor.context_match_score,
                    'preference_alignment': enhanced_vendor.preference_alignment,
                    'extracted_specialties': enhanced_vendor.extracted_specialties,
                    'availability_likelihood': enhanced_vendor.availability_likelihood,
                    'budget_compatibility': enhanced_vendor.budget_compatibility,
                    'capacity_suitability': enhanced_vendor.capacity_suitability,
                    
                    # Contact information
                    'contact': {
                        'phone': enhanced_vendor.phone,
                        'email': enhanced_vendor.email,
                        'website': enhanced_vendor.website,
                        'instagram': enhanced_vendor.instagram
                    },
                    
                    # Business metadata
                    'business_logic_score': enhanced_vendor.context_match_score,
                    'years_experience': enhanced_vendor.years_experience,
                    'weddings_completed': enhanced_vendor.weddings_completed,
                    'awards': enhanced_vendor.awards or [],
                    'testimonials': enhanced_vendor.testimonials or [],
                    
                    # Additional fields for frontend
                    'images': vendor.get('images', []),
                    'amenities': vendor.get('amenities', []),
                    'capacity': vendor.get('capacity', 0),
                    'venue_type': vendor.get('venue_type', ''),
                    'specialties': enhanced_vendor.extracted_specialties
                }
                
                enhanced_vendors.append(enhanced_vendor_dict)
                
            except Exception as e:
                logger.error(f"❌ Error enhancing vendor {vendor.get('name', 'Unknown')}: {e}")
                # Add basic vendor if enhancement fails
                enhanced_vendors.append(vendor)
        
        # Sort by context match score
        enhanced_vendors.sort(key=lambda x: x.get('context_match_score', 0), reverse=True)
        
        # Organize by category
        categorized_vendors = {}
        
        if filter_category:
            categorized_vendors[filter_category] = enhanced_vendors
        else:
            # Group by category
            for vendor in enhanced_vendors:
                category = vendor.get('category', 'unknown')
                if category not in categorized_vendors:
                    categorized_vendors[category] = []
                categorized_vendors[category].append(vendor)
        
        # Limit results per category
        for category in categorized_vendors:
            categorized_vendors[category] = categorized_vendors[category][:10]  # Top 10 per category
        
        logger.info(f"✅ RAG processing complete. Enhanced {len(enhanced_vendors)} vendors")
        
        return jsonify({
            'success': True,
            'final_recommendations': categorized_vendors,
            'total_vendors': len(enhanced_vendors),
            'rag_enabled': True,
            'rag_processing_stats': {
                'vendors_processed': len(base_vendors),
                'vendors_enhanced': len(enhanced_vendors),
                'average_match_score': sum(v.get('context_match_score', 0) for v in enhanced_vendors) / len(enhanced_vendors) if enhanced_vendors else 0,
                'processing_timestamp': datetime.now().isoformat()
            },
            'vendor_context': {
                'location': vendor_context.location,
                'guest_count': vendor_context.guest_count,
                'budget_range': vendor_context.budget_range,
                'style_preference': vendor_context.style_preference,
                'priorities': vendor_context.priorities
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error in RAG-enhanced vendor selection: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback_applied': True
        }), 500

def get_mock_vendors_for_rag_processing(category: str, location: str) -> List[Dict]:
    """Get mock vendors for RAG processing (replace with database query)"""
    
    all_vendors = [
        # Venues
        {
            'id': 'venue-1',
            'name': 'Taj Palace Hotel Mumbai',
            'category': 'venues',
            'location': 'Mumbai',
            'rating': 4.9,
            'price_range': 'Premium (> ₹2L)',
            'description': 'Luxury 5-star hotel with grand ballrooms and world-class amenities',
            'contact_score': 98,
            'phone': '+91 98765 43210',
            'email': 'events@tajpalace.com',
            'website': 'www.tajpalace.com',
            'venue_type': 'hotels',
            'capacity': 500,
            'amenities': ['Grand Ballroom', 'Garden Area', 'In-house Catering', 'Valet Parking'],
            'experience_years': 25,
            'weddings_planned': 1200,
            'specialties': ['Luxury Weddings', 'Traditional Ceremonies', 'International Standards'],
            'images': ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop']
        },
        {
            'id': 'venue-2',
            'name': 'Heritage Palace Jaipur',
            'category': 'venues',
            'location': 'Jaipur',
            'rating': 4.8,
            'price_range': 'Premium (> ₹2L)',
            'description': 'Historic palace with royal architecture and traditional charm',
            'contact_score': 95,
            'phone': '+91 87654 32109',
            'email': 'royal@heritagepalace.com',
            'website': 'www.heritagepalace.com',
            'venue_type': 'palaces',
            'capacity': 600,
            'amenities': ['Royal Courtyard', 'Heritage Rooms', 'Traditional Décor'],
            'experience_years': 30,
            'weddings_planned': 950,
            'specialties': ['Royal Weddings', 'Heritage Ceremonies', 'Cultural Events'],
            'images': ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop']
        },
        # Photography
        {
            'id': 'photo-1',
            'name': 'Elite Wedding Photography',
            'category': 'photography',
            'location': location,
            'rating': 4.9,
            'price_range': 'Premium (> ₹2L)',
            'description': 'Award-winning photography studio specializing in artistic wedding photography',
            'contact_score': 98,
            'phone': '+91 98765 43210',
            'email': 'hello@elitephotography.com',
            'website': 'www.elitephotography.com',
            'experience_years': 12,
            'weddings_planned': 450,
            'specialties': ['Artistic Photography', 'Cinematic Videos', 'Candid Moments'],
            'images': ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop']
        },
        # Catering
        {
            'id': 'catering-1',
            'name': 'Royal Feast Catering',
            'category': 'catering',
            'location': location,
            'rating': 4.8,
            'price_range': 'Premium (> ₹2L)',
            'description': 'Luxury catering service specializing in multi-cuisine wedding feasts',
            'contact_score': 96,
            'phone': '+91 98765 43211',
            'email': 'feast@royalcatering.com',
            'website': 'www.royalcatering.com',
            'experience_years': 18,
            'weddings_planned': 650,
            'specialties': ['Multi-Cuisine', 'International Standards', 'Custom Menus'],
            'images': ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop']
        }
    ]
    
    if category:
        return [v for v in all_vendors if v['category'] == category]
    return all_vendors

@app.route('/api/vendor-preferences-sync', methods=['POST'])
def sync_vendor_preferences():
    """Sync wedding preferences with vendor recommendations"""
    try:
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        # Store preferences (in production, save to database)
        logger.info("📝 Syncing wedding preferences for vendor matching")
        
        # Here you would typically:
        # 1. Save preferences to NocoDB
        # 2. Update vendor matching algorithms
        # 3. Trigger background re-scoring of vendors
        
        return jsonify({
            'success': True,
            'message': 'Preferences synced successfully',
            'preferences_id': f"pref-{datetime.now().timestamp()}"
        })
        
    except Exception as e:
        logger.error(f"❌ Error syncing preferences: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'RAG-Enhanced Vendor Selection API',
        'timestamp': datetime.now().isoformat(),
        'rag_extractor': 'initialized'
    })

if __name__ == '__main__':
    logger.info("🚀 Starting RAG-Enhanced Vendor Selection API...")
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)
