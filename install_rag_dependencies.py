
#!/usr/bin/env python3
"""
RAG Dependencies Installation Script
Installs all required packages for the RAG-enhanced vendor search system
"""

import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_package(package_name):
    """Install a Python package"""
    try:
        logger.info(f"📦 Installing {package_name}...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', package_name, '--quiet'
        ])
        logger.info(f"✅ {package_name} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to install {package_name}: {e}")
        return False

def main():
    """Install all RAG dependencies"""
    logger.info("🚀 Installing RAG-Enhanced Vendor Search Dependencies")
    logger.info("=" * 60)
    
    # Core RAG dependencies
    rag_packages = [
        'sentence-transformers',
        'chromadb',
        'numpy',
        'fastapi',
        'uvicorn[standard]',
        'aiohttp',
        'python-multipart',
        'transformers',
        'torch',
        'scipy',
        'scikit-learn'
    ]
    
    failed_packages = []
    
    for package in rag_packages:
        if not install_package(package):
            failed_packages.append(package)
    
    logger.info("=" * 60)
    
    if failed_packages:
        logger.error(f"❌ Failed to install: {', '.join(failed_packages)}")
        logger.info("🔧 Try installing failed packages manually:")
        for package in failed_packages:
            logger.info(f"   pip install {package}")
        sys.exit(1)
    else:
        logger.info("✅ All RAG dependencies installed successfully!")
        logger.info("🧠 RAG system is ready to use")
        logger.info("▶️  Run: python start_rag_system.py")

if __name__ == "__main__":
    main()
