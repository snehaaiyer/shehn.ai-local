# API Configuration for BID AI Wedding Assistant
import os

# Frontend Configuration
FRONTEND_URL = "http://0.0.0.0:3000"
FRONTEND_HOST = "0.0.0.0"
FRONTEND_PORT = 3000

# Backend Services
API_SERVICES = {
    'unified_wedding_server': {
        'port': 8001,
        'url': 'http://0.0.0.0:8001',
        'health_endpoint': '/health'
    },
    'react_frontend': {
        'port': 3000,
        'url': 'http://0.0.0.0:3000',
        'health_endpoint': '/'
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
# Serper API key for enhanced search
# Get your API key from https://serper.dev
SERPER_API_KEY = os.getenv('SERPER_API_KEY', '44f3982e40a663fc992acb96f7763f3c9f79bed7')

# API key is set directly for immediate use
if not SERPER_API_KEY:
    SERPER_API_KEY = "44f3982e40a663fc992acb96f7763f3c9f79bed7"