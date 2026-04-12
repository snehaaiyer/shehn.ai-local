
import sys
import os
import logging

# Add current directory to path
sys.path.append(os.getcwd())

from config.api_config import SERPER_API_KEY
from serper_images import search_vendors

# Configure logging to see output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_search():
    print(f"🔑 API Key Present: {bool(SERPER_API_KEY)}")
    print("🔍 Testing search_vendors('venues', 'Mumbai')...")
    
    try:
        result = search_vendors('venues', 'Mumbai', num_results=5)
        print(f"📊 Success: {result.get('success')}")
        print(f"📦 Original Count: {result.get('original_count')}")
        print(f"🎯 Filtered Count: {result.get('filtered_count')}")
        print(f"✅ Final Vendors: {len(result.get('vendors', []))}")
        
        if result.get('vendors'):
            v = result['vendors'][0]
            print(f"📝 First Vendor: {v.get('name')} | Phone: {v.get('phone')}")
        else:
            print("❌ No vendors found after filtering")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_search()
