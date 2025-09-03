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
        'url': 'http://0.0.0.0:5003',
        'health_endpoint': '/health'
    },
    'unified_wedding_server': {
        'port': 8001,
        'url': 'http://0.0.0.0:8001',
        'health_endpoint': '/health'
    },
    'vendor_communication': {
        'port': 5004,
        'url': 'http://0.0.0.0:5004',
        'health_endpoint': '/health'
    },
    'main_frontend': {
        'port': 5000,
        'url': 'http://0.0.0.0:5000',
        'health_endpoint': '/health'
    }
}

# Service Health Check Configuration
HEALTH_CHECK_TIMEOUT = 10
HEALTH_CHECK_RETRIES = 3

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