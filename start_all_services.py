
#!/usr/bin/env python3
"""
BID AI Wedding Assistant - Comprehensive Service Startup
Starts all microservices and checks their health status
"""

import subprocess
import time
import sys
import os
import requests
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_port(port):
    """Check if a port is available"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0  # True if port is in use
    except:
        return False

def check_ollama_service():
    """Check if Ollama is running and has the required model"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [model.get('name', '') for model in models]
            
            # Check for required models
            required_models = ['llama3.2:latest', 'nous-hermes:latest', 'llama3.2:1b']
            available_models = [model for model in required_models if any(req in model_name for req in [model] for model_name in model_names)]
            
            if available_models:
                logger.info(f"✅ Ollama is running with models: {available_models}")
                return True
            else:
                logger.warning(f"⚠️ Ollama running but missing required models: {required_models}")
                return False
        else:
            logger.error(f"❌ Ollama API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Ollama not accessible: {e}")
        return False

def start_ollama():
    """Start Ollama service"""
    if check_port(11434):
        logger.info("✅ Ollama is already running on port 11434")
        return check_ollama_service()
    
    logger.info("🚀 Starting Ollama service...")
    try:
        # Try to start Ollama in background
        process = subprocess.Popen(['ollama', 'serve'], 
                                 stdout=subprocess.DEVNULL, 
                                 stderr=subprocess.DEVNULL)
        
        # Wait a moment for service to start
        time.sleep(3)
        
        if check_port(11434):
            logger.info("✅ Ollama service started successfully")
            return check_ollama_service()
        else:
            logger.error("❌ Failed to start Ollama service")
            return False
    except FileNotFoundError:
        logger.error("❌ Ollama not found. Please install Ollama first.")
        return False
    except Exception as e:
        logger.error(f"❌ Error starting Ollama: {e}")
        return False

def check_nocodb_connection():
    """Check NocoDB connection"""
    try:
        from vendor_database import get_vendor_database
        vendor_db = get_vendor_database()
        stats = vendor_db.get_database_stats()
        logger.info(f"✅ NocoDB connection successful: {stats}")
        return True
    except Exception as e:
        logger.warning(f"⚠️ NocoDB connection issue: {e}")
        return False

def test_serper_api():
    """Test Serper API connection"""
    try:
        from serper_images import serper_client
        # Simple test search
        test_result = serper_client.search_images("wedding", 1)
        if test_result:
            logger.info("✅ Serper API connection successful")
            return True
        else:
            logger.warning("⚠️ Serper API test returned no results")
            return False
    except Exception as e:
        logger.warning(f"⚠️ Serper API connection issue: {e}")
        return False

def verify_static_files():
    """Verify static files exist"""
    static_dir = Path("local_website")
    critical_files = [
        "index.html",
        "css/styles.css",
        "js/app.js",
        "js/navigation.js"
    ]
    
    missing_files = []
    for file_path in critical_files:
        file_location = static_dir / file_path
        if not file_location.exists():
            missing_files.append(file_path)
    
    if missing_files:
        logger.error(f"❌ Missing critical files: {missing_files}")
        return False
    else:
        logger.info("✅ All critical static files found")
        return True

def start_main_server():
    """Start the main unified server"""
    try:
        logger.info("🚀 Starting BID AI Wedding Assistant Unified Server...")
        
        # Import and run the main server
        from simple_unified_server import main
        main()
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")

def run_health_checks():
    """Run comprehensive health checks"""
    logger.info("🔍 Running system health checks...")
    logger.info("=" * 60)
    
    checks = {
        "Ollama AI Service": start_ollama,
        "NocoDB Database": check_nocodb_connection,
        "Serper API": test_serper_api,
        "Static Files": verify_static_files
    }
    
    results = {}
    for check_name, check_func in checks.items():
        try:
            results[check_name] = check_func()
        except Exception as e:
            logger.error(f"❌ {check_name} check failed: {e}")
            results[check_name] = False
    
    logger.info("=" * 60)
    logger.info("📊 Health Check Summary:")
    
    all_healthy = True
    for service, status in results.items():
        status_icon = "✅" if status else "❌"
        logger.info(f"   {status_icon} {service}")
        if not status:
            all_healthy = False
    
    if all_healthy:
        logger.info("🎉 All services are healthy and ready!")
    else:
        logger.warning("⚠️ Some services have issues but the app can still run")
    
    logger.info("=" * 60)
    return results

def main():
    """Main startup function"""
    print("🌸 BID AI Wedding Assistant - Service Startup")
    print("=" * 60)
    print("🚀 Initializing all microservices...")
    print("=" * 60)
    
    # Run health checks
    health_results = run_health_checks()
    
    # Print startup summary
    logger.info("🎯 Starting unified server with the following services:")
    logger.info("   📱 Frontend (React-like SPA)")
    logger.info("   🎉 Vendor Discovery")
    logger.info("   💬 Communications Agent") 
    logger.info("   💰 Budget Analysis")
    logger.info("   🤖 AI Copilot (Ollama)")
    logger.info("   💾 Database (NocoDB)")
    logger.info("   🔍 Vendor Search (Serper)")
    logger.info("   📊 API Documentation")
    
    logger.info("=" * 60)
    logger.info("🌐 Server will be available at:")
    logger.info("   📱 Main App: http://0.0.0.0:5000")
    logger.info("   🎉 Vendor Discovery: http://0.0.0.0:5000/vendor-discovery")
    logger.info("   🤖 API Docs: http://0.0.0.0:5000/api/docs")
    logger.info("   📊 Health Check: http://0.0.0.0:5000/health")
    logger.info("=" * 60)
    logger.info("🛑 Press Ctrl+C to stop all services")
    logger.info("=" * 60)
    
    # Start the main server
    start_main_server()

if __name__ == "__main__":
    main()
