
import requests
from replit.object_storage import Client
import os

def store_logo_in_storage():
    """Store the Shehnai logo in Replit Object Storage"""
    try:
        # Initialize Object Storage client
        client = Client()
        
        # Path to the logo file
        logo_path = 'react-frontend/public/shehnai-logo.png'
        
        if os.path.exists(logo_path):
            # Read the logo file
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
            
            # Upload to Object Storage
            client.upload_from_bytes('shehnai-logo.png', logo_data)
            
            print("✅ Shehnai logo successfully stored in Object Storage")
            print("📍 Accessible at: /api/storage/shehnai-logo.png")
            
            return True
        else:
            print(f"❌ Logo file not found at: {logo_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error storing logo: {e}")
        return False

if __name__ == "__main__":
    print("🖼️ Storing Shehnai Logo in Object Storage...")
    store_logo_in_storage()
