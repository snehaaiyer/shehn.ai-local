
#!/usr/bin/env python3
"""
RAG System Startup Script
Starts the RAG-enhanced vendor search system with all components
"""

import subprocess
import time
import logging
import signal
import sys
import os
from threading import Thread

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGSystemManager:
    def __init__(self):
        self.processes = []
        self.running = True
    
    def start_service(self, command, name, port):
        """Start a service with the given command"""
        try:
            logger.info(f"🚀 Starting {name} on port {port}...")
            process = subprocess.Popen(
                command.split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            self.processes.append({
                'name': name,
                'process': process,
                'port': port,
                'command': command
            })
            
            # Start output monitoring thread
            Thread(target=self.monitor_service, args=(process, name), daemon=True).start()
            
            return process
        except Exception as e:
            logger.error(f"❌ Failed to start {name}: {e}")
            return None
    
    def monitor_service(self, process, name):
        """Monitor service output"""
        while self.running and process.poll() is None:
            try:
                line = process.stdout.readline()
                if line:
                    print(f"[{name}] {line.strip()}")
            except Exception as e:
                logger.error(f"Error monitoring {name}: {e}")
                break
    
    def start_all_services(self):
        """Start all RAG system services"""
        logger.info("=" * 60)
        logger.info("🧠 Starting RAG-Enhanced Wedding Vendor Search System")
        logger.info("=" * 60)
        
        # Service configurations
        services = [
            {
                'name': 'RAG-Enhanced Vendor Search API',
                'command': 'python rag_enhanced_vendor_search_api.py',
                'port': 5003,
                'startup_delay': 2
            },
            {
                'name': 'React Frontend',
                'command': 'sh -c "cd react-frontend && npm install && HOST=0.0.0.0 PORT=5000 BROWSER=none npm start"',
                'port': 5000,
                'startup_delay': 5
            }
        ]
        
        # Start services with delays
        for service in services:
            self.start_service(
                service['command'],
                service['name'],
                service['port']
            )
            
            logger.info(f"⏳ Waiting {service['startup_delay']}s for {service['name']} to initialize...")
            time.sleep(service['startup_delay'])
        
        logger.info("=" * 60)
        logger.info("✅ RAG System Started Successfully!")
        logger.info("🌐 Frontend: http://localhost:5000")
        logger.info("🔍 RAG API: http://localhost:5003")
        logger.info("🧠 System: Semantic Vector Search Active")
        logger.info("=" * 60)
        
        # Health check
        self.perform_health_check()
        
        # Keep running
        try:
            while self.running:
                time.sleep(10)
                self.check_processes()
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down RAG system...")
            self.shutdown()
    
    def perform_health_check(self):
        """Perform system health check"""
        logger.info("🔍 Performing RAG system health check...")
        
        import requests
        
        try:
            # Check RAG API
            response = requests.get('http://localhost:5003/api/rag-system-health', timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                logger.info(f"✅ RAG API Health: {health_data['status']}")
                logger.info(f"   - Vector DB Collections: {health_data['rag_components']['style_collection_count']} vendors")
                logger.info(f"   - Embedding Models: {health_data['rag_components']['embedding_models']}")
            else:
                logger.warning(f"⚠️ RAG API health check failed: {response.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ RAG API health check error: {e}")
        
        # Check Frontend
        try:
            response = requests.get('http://localhost:5000', timeout=5)
            if response.status_code == 200:
                logger.info("✅ Frontend Health: operational")
            else:
                logger.warning(f"⚠️ Frontend health check failed: {response.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ Frontend health check error: {e}")
    
    def check_processes(self):
        """Check if processes are still running"""
        for service in self.processes:
            if service['process'].poll() is not None:
                logger.error(f"❌ {service['name']} has stopped unexpectedly")
                # Attempt restart
                logger.info(f"🔄 Attempting to restart {service['name']}...")
                new_process = self.start_service(
                    service['command'],
                    service['name'],
                    service['port']
                )
                if new_process:
                    service['process'] = new_process
    
    def shutdown(self):
        """Shutdown all services"""
        self.running = False
        
        logger.info("🛑 Shutting down all RAG system services...")
        
        for service in self.processes:
            try:
                if service['process'].poll() is None:
                    logger.info(f"   Stopping {service['name']}...")
                    service['process'].terminate()
                    
                    # Wait for graceful shutdown
                    try:
                        service['process'].wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        logger.warning(f"   Force killing {service['name']}...")
                        service['process'].kill()
                        service['process'].wait()
                        
            except Exception as e:
                logger.error(f"Error stopping {service['name']}: {e}")
        
        logger.info("✅ RAG system shutdown complete")
        sys.exit(0)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("📡 Received shutdown signal")
        self.shutdown()

def main():
    """Main function"""
    manager = RAGSystemManager()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, manager.signal_handler)
    signal.signal(signal.SIGTERM, manager.signal_handler)
    
    # Start all services
    manager.start_all_services()

if __name__ == "__main__":
    main()
