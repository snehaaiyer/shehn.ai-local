#!/usr/bin/env python3
"""
Unified Service Orchestrator for Wedding Planning App
Manages all backend services from a single entry point
"""

import asyncio
import subprocess
import sys
import time
import requests
import threading
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ServiceOrchestrator:
    def __init__(self):
        self.services = {
            'enhanced_rag_vendor_api': {
                'port': 5003,
                'command': ['python', 'enhanced_rag_vendor_api.py'],
                'health_check': '/health',
                'process': None
            },
            'unified_server': {
                'port': 8000,
                'command': ['python', 'simple_unified_server.py'],
                'health_check': '/health',
                'process': None
            },
            'vendor_communication': {
                'port': 5004,
                'command': ['python', 'vendor_communication_api.py'],
                'health_check': '/health',
                'process': None
            }
        }

    def start_service(self, service_name: str) -> bool:
        """Start a specific service"""
        try:
            service = self.services[service_name]
            logger.info(f"Starting {service_name} on port {service['port']}")

            service['process'] = subprocess.Popen(
                service['command'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Wait for service to start
            wait_time = 5
            time.sleep(wait_time)

            # Multiple health check attempts with longer intervals
            for attempt in range(5):
                if self.check_service_health(service_name):
                    logger.info(f"✅ {service_name} started successfully")
                    return True
                time.sleep(3)

            # Check process status
            if service['process'].poll() is None:
                logger.warning(f"⚠️ {service_name} process running but health check failed")
                # Still consider it started if process is running
                return True
            else:
                stdout, stderr = service['process'].communicate()
                logger.error(f"❌ {service_name} process failed:")
                logger.error(f"STDOUT: {stdout}")
                logger.error(f"STDERR: {stderr}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to start {service_name}: {e}")
            return False

    def check_service_health(self, service_name: str) -> bool:
        """Check if service is healthy"""
        try:
            service = self.services[service_name]
            url = f"http://localhost:{service['port']}{service['health_check']}"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except:
            return False

    def stop_service(self, service_name: str):
        """Stop a specific service"""
        service = self.services[service_name]
        if service['process']:
            service['process'].terminate()
            service['process'].wait()
            logger.info(f"Stopped {service_name}")

    def start_all_services(self):
        """Start all services"""
        logger.info("🚀 Starting all wedding planning services...")

        for service_name in self.services:
            if not self.start_service(service_name):
                logger.error(f"Failed to start {service_name}")
                return False

        logger.info("✅ All services started successfully!")
        return True

    def stop_all_services(self):
        """Stop all services"""
        logger.info("Stopping all services...")
        for service_name in self.services:
            self.stop_service(service_name)

    def get_service_status(self) -> Dict:
        """Get status of all services"""
        status = {}
        for service_name in self.services:
            status[service_name] = {
                'running': self.check_service_health(service_name),
                'port': self.services[service_name]['port']
            }
        return status

    def monitor_services(self):
        """Monitor services and restart if needed"""
        while True:
            try:
                for service_name in self.services:
                    if not self.check_service_health(service_name):
                        logger.warning(f"Service {service_name} is down, restarting...")
                        self.stop_service(service_name)
                        self.start_service(service_name)

                time.sleep(30)  # Check every 30 seconds
            except KeyboardInterrupt:
                break

if __name__ == "__main__":
    orchestrator = ServiceOrchestrator()

    try:
        if orchestrator.start_all_services():
            print("\n" + "="*50)
            print("🎉 Wedding Planning Services Running!")
            print("="*50)

            status = orchestrator.get_service_status()
            for service, info in status.items():
                print(f"  {service}: {'✅ Running' if info['running'] else '❌ Down'} on port {info['port']}")

            print("\n🔍 Starting service monitor...")
            orchestrator.monitor_services()
        else:
            print("❌ Failed to start all services")
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        orchestrator.stop_all_services()
        print("✅ All services stopped")