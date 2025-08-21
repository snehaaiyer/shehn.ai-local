
from flask import Flask, send_file, jsonify
from flask_cors import CORS
import io
import os
from replit import db
from replit.object_storage import Client

app = Flask(__name__)
CORS(app)

# Initialize Object Storage client
storage_client = Client()

@app.route('/api/storage/<path:filename>')
def serve_image(filename):
    """Serve images from Replit Object Storage"""
    try:
        # Download the file from Object Storage
        file_data = storage_client.download_as_bytes(filename)
        
        # Determine content type based on file extension
        content_type = 'image/png'
        if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            content_type = 'image/jpeg'
        elif filename.lower().endswith('.gif'):
            content_type = 'image/gif'
        elif filename.lower().endswith('.svg'):
            content_type = 'image/svg+xml'
            
        # Create a BytesIO object and return it
        return send_file(
            io.BytesIO(file_data),
            mimetype=content_type,
            as_attachment=False
        )
    except Exception as e:
        print(f"Error serving image {filename}: {e}")
        return jsonify({'error': f'Image not found: {filename}'}), 404

@app.route('/api/storage/upload', methods=['POST'])
def upload_image():
    """Upload image to Object Storage"""
    try:
        from flask import request
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # Read file data
        file_data = file.read()
        filename = file.filename
        
        # Upload to Object Storage
        storage_client.upload_from_bytes(filename, file_data)
        
        return jsonify({
            'success': True,
            'url': f'/api/storage/{filename}',
            'filename': filename
        })
        
    except Exception as e:
        print(f"Error uploading image: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'Image Storage Server'})

if __name__ == '__main__':
    print("🖼️ Starting Image Storage Server...")
    app.run(host='0.0.0.0', port=8002, debug=True)
