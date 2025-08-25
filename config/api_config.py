# API Configuration for BID AI Wedding Assistant
import os

# Frontend Configuration
FRONTEND_URL = "http://0.0.0.0:5000"
FRONTEND_HOST = "0.0.0.0"
FRONTEND_PORT = 5000

# Backend Services
API_SERVICES = {
    'enhanced_rag_vendor_api': {
        'port': 5003,
        'url': 'http://0.0.0.0:5003'
    },
    'unified_server': {
        'port': 8000,
        'url': 'http://0.0.0.0:8000'
    },
    'vendor_communication': {
        'port': 5004,
        'url': 'http://0.0.0.0:5004'
    }
}

# CORS Configuration
CORS_ORIGINS = [
    "http://0.0.0.0:5000",
    "http://localhost:5000",
    "https://*.replit.dev",
    "https://*.repl.co"
]

# Database Configuration
NOCODB_BASE_URL = os.getenv('NOCODB_BASE_URL', 'http://localhost:8080')
NOCODB_API_TOKEN = os.getenv('NOCODB_API_TOKEN', '')

# AI Service Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
SERPER_API_KEY = os.getenv('SERPER_API_KEY', '')