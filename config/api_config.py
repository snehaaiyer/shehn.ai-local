import os

# NocoDB Configuration
NOCODB_API_TOKEN = "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk"

# Base URLs - ngrok takes precedence over localhost
NGROK_URL = os.getenv('NGROK_URL', 'http://localhost:8080')

# Ensure URL ends with /api/v2
def get_nocodb_url():
    """Get the current NocoDB URL with proper API path"""
    base_url = NGROK_URL.rstrip('/')
    return f"{base_url}/api/v2"

# Table IDs
TABLE_IDS = {
    "weddings": "mslkrxqymrbe01d",
    "venues": "m8o47zj6gmkmguz",
    "vendors": "mpw9em3omtlqlsg",
    "preferences": "mx7nrptxiiqbsty",
    "couples": "mcv14lxgtp3rwa5"
}

# API Headers
NOCODB_HEADERS = {
    "xc-token": NOCODB_API_TOKEN,
    "Content-Type": "application/json"
}

# Other API Configurations
SERPER_API_KEY = "19dd65af8ee73ed572d5b91d25a32d01eec1a31f"
OLLAMA_HOST = "http://localhost:11434"

def get_api_headers():
    """Get the current API headers"""
    return NOCODB_HEADERS.copy()

def test_nocodb_connection():
    """Test the NocoDB connection"""
    import requests
    try:
        url = f"{get_nocodb_url()}/tables/{TABLE_IDS['weddings']}/records?limit=1"
        print(f"Testing connection to: {url}")
        response = requests.get(
            url,
            headers=get_api_headers()
        )
        if response.status_code == 200:
            print("✅ NocoDB connection successful")
            return True
        else:
            print(f"❌ NocoDB connection failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing NocoDB connection: {e}")
        return False 