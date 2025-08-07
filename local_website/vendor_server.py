#!/usr/bin/env python3
"""
Vendor Server for Combined Vendor Screen
Serves the combined vendor screen with communications agent API
"""

import os
import json
import sys
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template_string, request, jsonify, send_file
from flask_cors import CORS

# Add the current directory to path to import communications agent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from communications_agent import CommunicationsAgent
except ImportError:
    # Fallback if communications agent is not available
    class CommunicationsAgent:
        def generate_message(self, message_type, vendor_info, wedding_info, additional_info=None):
            return "Communications agent not available. Please check the system."
        
        def generate_whatsapp_message(self, vendor_info, wedding_info):
            return "WhatsApp message generation not available."

app = Flask(__name__)
CORS(app)

# Initialize communications agent
comm_agent = CommunicationsAgent()

@app.route('/')
def index():
    """Serve the combined vendor screen"""
    html_file = Path(__file__).parent / 'combined-vendor-screen.html'
    
    if html_file.exists():
        with open(html_file, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        return """
        <html>
        <head><title>Vendor Screen Loading...</title></head>
        <body>
            <h1>Loading Combined Vendor Screen...</h1>
            <p>The combined vendor screen is being prepared. Please wait.</p>
            <script>
                setTimeout(function() {
                    window.location.reload();
                }, 2000);
            </script>
        </body>
        </html>
        """

@app.route('/api/generate-message', methods=['POST'])
def generate_message():
    """Generate formal message for vendor communication"""
    try:
        data = request.get_json()
        
        message_type = data.get('message_type', 'inquiry')
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        additional_info = data.get('additional_info', {})
        
        # Generate the message using communications agent
        message = comm_agent.generate_message(
            message_type, vendor_info, wedding_info, additional_info
        )
        
        return jsonify({
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/generate-whatsapp-message', methods=['POST'])
def generate_whatsapp_message():
    """Generate WhatsApp-friendly message"""
    try:
        data = request.get_json()
        
        vendor_info = data.get('vendor_info', {})
        wedding_info = data.get('wedding_info', {})
        
        # Generate WhatsApp message
        message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return jsonify({
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/vendor-data/<category>')
def get_vendor_data(category):
    """Get vendor data for specific category"""
    try:
        # Sample vendor data - in production, this would come from a database
        vendor_data = {
            'venues': [
                {
                    'id': 1,
                    'name': 'Royal Garden Palace',
                    'description': 'Luxury banquet hall with beautiful gardens, perfect for grand celebrations',
                    'location': 'Mumbai',
                    'rating': 4.8,
                    'price': '₹2,00,000 - ₹5,00,000',
                    'capacity': '500-1000 guests',
                    'type': 'premium',
                    'phone': '+91 98765 43210',
                    'email': 'info@royalgardenpalace.com',
                    'category': 'venues'
                },
                {
                    'id': 2,
                    'name': 'Heritage Haveli',
                    'description': 'Traditional Rajasthani architecture with modern amenities',
                    'location': 'Delhi',
                    'rating': 4.6,
                    'price': '₹1,50,000 - ₹3,00,000',
                    'capacity': '200-500 guests',
                    'type': 'mid',
                    'phone': '+91 98765 43211',
                    'email': 'bookings@heritagehaveli.com',
                    'category': 'venues'
                }
            ],
            'decoration': [
                {
                    'id': 11,
                    'name': 'Elegant Decor Studio',
                    'description': 'Creative floral arrangements and stunning stage setups',
                    'location': 'Mumbai',
                    'rating': 4.7,
                    'price': '₹50,000 - ₹2,00,000',
                    'specialty': 'Floral arrangements',
                    'type': 'premium',
                    'phone': '+91 98765 43212',
                    'email': 'info@elegantdecor.com',
                    'category': 'decoration'
                },
                {
                    'id': 12,
                    'name': 'Bloom & Bliss',
                    'description': 'Specialized in traditional and modern decoration themes',
                    'location': 'Bangalore',
                    'rating': 4.5,
                    'price': '₹30,000 - ₹1,50,000',
                    'specialty': 'Theme decoration',
                    'type': 'mid',
                    'phone': '+91 98765 43213',
                    'email': 'contact@bloombliss.com',
                    'category': 'decoration'
                }
            ],
            'catering': [
                {
                    'id': 21,
                    'name': 'Spice Route Catering',
                    'description': 'Authentic Indian cuisine with international options',
                    'location': 'Mumbai',
                    'rating': 4.9,
                    'price': '₹800 - ₹2,500 per person',
                    'specialty': 'Multi-cuisine',
                    'type': 'premium',
                    'phone': '+91 98765 43214',
                    'email': 'orders@spiceroute.com',
                    'category': 'catering'
                },
                {
                    'id': 22,
                    'name': 'Royal Feast',
                    'description': 'Traditional royal cuisine with modern presentation',
                    'location': 'Delhi',
                    'rating': 4.6,
                    'price': '₹600 - ₹1,800 per person',
                    'specialty': 'Royal cuisine',
                    'type': 'mid',
                    'phone': '+91 98765 43215',
                    'email': 'bookings@royalfeast.com',
                    'category': 'catering'
                }
            ],
            'makeup': [
                {
                    'id': 31,
                    'name': 'Glamour Studio',
                    'description': 'Professional bridal makeup and hair styling',
                    'location': 'Mumbai',
                    'rating': 4.8,
                    'price': '₹25,000 - ₹80,000',
                    'specialty': 'Bridal makeup',
                    'type': 'premium',
                    'phone': '+91 98765 43216',
                    'email': 'bookings@glamourstudio.com',
                    'category': 'makeup'
                },
                {
                    'id': 32,
                    'name': 'Beauty Bliss',
                    'description': 'Complete bridal beauty services and packages',
                    'location': 'Pune',
                    'rating': 4.4,
                    'price': '₹15,000 - ₹50,000',
                    'specialty': 'Bridal packages',
                    'type': 'mid',
                    'phone': '+91 98765 43217',
                    'email': 'info@beautybliss.com',
                    'category': 'makeup'
                }
            ],
            'photography': [
                {
                    'id': 41,
                    'name': 'Capture Moments',
                    'description': 'Cinematic wedding photography and videography',
                    'location': 'Mumbai',
                    'rating': 4.9,
                    'price': '₹1,00,000 - ₹5,00,000',
                    'specialty': 'Cinematic style',
                    'type': 'premium',
                    'phone': '+91 98765 43218',
                    'email': 'info@capturemoments.com',
                    'category': 'photography'
                },
                {
                    'id': 42,
                    'name': 'Wedding Chronicles',
                    'description': 'Traditional and candid wedding photography',
                    'location': 'Bangalore',
                    'rating': 4.7,
                    'price': '₹75,000 - ₹3,00,000',
                    'specialty': 'Candid photography',
                    'type': 'mid',
                    'phone': '+91 98765 43219',
                    'email': 'bookings@weddingchronicles.com',
                    'category': 'photography'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'vendors': vendor_data.get(category, []),
            'category': category,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Combined Vendor Screen',
        'timestamp': datetime.now().isoformat(),
        'features': {
            'communications_agent': True,
            'vendor_data': True,
            'message_generation': True,
            'whatsapp_integration': True,
            'email_integration': True
        }
    })

@app.route('/api/test-communication')
def test_communication():
    """Test endpoint for communications agent"""
    try:
        # Test data
        vendor_info = {
            'name': 'Test Vendor',
            'category': 'venues',
            'location': 'Mumbai',
            'price': '₹2,00,000 - ₹5,00,000'
        }
        
        wedding_info = {
            'date': 'December 15, 2024',
            'guest_count': '500',
            'venue': 'Test Venue, Mumbai',
            'duration': '6 hours',
            'customer_name': 'Test Customer',
            'customer_phone': '+91 98765 43210',
            'customer_email': 'test@email.com'
        }
        
        # Generate test messages
        inquiry_message = comm_agent.generate_message('inquiry', vendor_info, wedding_info)
        whatsapp_message = comm_agent.generate_whatsapp_message(vendor_info, wedding_info)
        
        return jsonify({
            'success': True,
            'test_results': {
                'inquiry_message': inquiry_message,
                'whatsapp_message': whatsapp_message
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    port = 8003
    print(f"🌸 Combined Vendor Screen Server")
    print(f"═══════════════════════════════════════════════════════════")
    print(f"🚀 Server starting on http://localhost:{port}")
    print(f"📱 Combined Vendor Screen: http://localhost:{port}")
    print(f"🤖 Communications API: http://localhost:{port}/api/")
    print(f"📊 Health Check: http://localhost:{port}/api/health")
    print(f"🧪 Test Communication: http://localhost:{port}/api/test-communication")
    print(f"═══════════════════════════════════════════════════════════")
    print(f"💡 Features Available:")
    print(f"   ✅ Combined venue and vendor discovery")
    print(f"   ✅ Tabs for decoration, catering, makeup, photography")
    print(f"   ✅ Preferences and filtering")
    print(f"   ✅ WhatsApp and email communication")
    print(f"   ✅ Formal message generation")
    print(f"   ✅ Communications agent integration")
    print(f"═══════════════════════════════════════════════════════════")
    
    app.run(host='0.0.0.0', port=port, debug=True) 