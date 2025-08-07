from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from integrated_wedding_api import IntegratedWeddingAPI
from vendor_recommendations_api import VendorRecommendationService
from setup_agents_fixed import WeddingPlannerCrew

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize services
wedding_api = IntegratedWeddingAPI()
vendor_service = VendorRecommendationService()
planner_crew = WeddingPlannerCrew()

@app.route('/api/wedding-form', methods=['POST'])
def handle_wedding_form():
    """Handle wedding form submission"""
    try:
        data = request.json
        result = wedding_api.process_wedding_form(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/visual-selection', methods=['POST'])
def handle_visual_selection():
    """Handle visual style selection"""
    try:
        data = request.json
        wedding_id = data.get('wedding_id')
        style_preferences = data.get('style_preferences', {})
        result = wedding_api.update_wedding_with_agent_analysis(wedding_id, style_preferences)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendor-recommendations', methods=['POST'])
def get_vendor_recommendations():
    """Get AI-powered vendor recommendations"""
    try:
        data = request.json
        recommendations = vendor_service.get_recommendations(data)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 