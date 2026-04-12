#!/usr/bin/env python3
"""
Comprehensive System Diagnostic Tool
Checks:
1. API Server & Endpoints
2. Serper API (Search Agent)
3. NocoDB Connectivity
4. Vector Database (Chroma)
5. Vendor Images
"""

import requests
import os
import sys
from pathlib import Path

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def log(msg, status="INFO"):
    if status == "SUCCESS":
        print(f"{GREEN}✅ {msg}{RESET}")
    elif status == "ERROR":
        print(f"{RED}❌ {msg}{RESET}")
    elif status == "WARNING":
        print(f"{YELLOW}⚠️  {msg}{RESET}")
    else:
        print(f"ℹ️  {msg}")

def check_server():
    print("\n🔍 Checking API Server...")
    try:
        r = requests.get('http://localhost:8000/health', timeout=5)
        if r.status_code == 200:
            log("API Server is Online", "SUCCESS")
            return True
        else:
            log(f"API Server returned {r.status_code}", "ERROR")
            return False
    except:
        log("API Server is Unreachable (Is it running?)", "ERROR")
        return False

def check_serper():
    print("\n🔍 Checking Serper API (Search Agent)...")
    try:
        from config.api_config import SERPER_API_KEY
        if not SERPER_API_KEY:
            log("SERPER_API_KEY not found in config", "ERROR")
            return False
        
        headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}
        payload = {'q': 'test', 'num': 1}
        r = requests.post('https://google.serper.dev/search', headers=headers, json=payload, timeout=5)
        
        if r.status_code == 200:
            log("Serper API is responding", "SUCCESS")
            return True
        elif r.status_code == 401:
            log("Serper API Key is Invalid", "ERROR")
            return False
        else:
            log(f"Serper API Error: {r.status_code}", "ERROR")
            return False
    except ImportError:
        log("Could not import config.api_config", "WARNING")
        return False
    except Exception as e:
        log(f"Serper Check Failed: {e}", "ERROR")
        return False

def check_nocodb():
    print("\n🔍 Checking NocoDB...")
    try:
        from config.nocodb_config import NOCODB_CONFIG
        base_url = NOCODB_CONFIG.get("BASE_URL")
        project_id = NOCODB_CONFIG.get("PROJECT_ID")
        api_token = NOCODB_CONFIG.get("API_TOKEN")
        
        if not base_url or not api_token:
            log("Missing NocoDB Config", "ERROR")
            return False
            
        headers = {'xc-token': api_token}
        r = requests.get(f"{base_url}/api/v1/health", timeout=5)
        
        # Some versions use /api/v1/health, others just root check
        if r.status_code == 200:
             log(f"NocoDB Instance Reachable at {base_url}", "SUCCESS")
        else:
             # Try project info
             r = requests.get(f"{base_url}/api/v1/db/meta/projects", headers=headers, timeout=5)
             if r.status_code == 200:
                 log("NocoDB Connection Successful", "SUCCESS")
             else:
                 log(f"NocoDB Connection Failed: {r.status_code} {r.text[:50]}...", "ERROR")
                 return False
        return True
    except ImportError:
        log("Could not import config.nocodb_config", "WARNING")
        return False
    except Exception as e:
        log(f"NocoDB Check Failed: {e}", "ERROR")
        return False

def check_vector_db():
    print("\n🔍 Checking Vector Database (Chroma)...")
    chroma_path = Path("chroma_db")
    if chroma_path.exists() and chroma_path.is_dir():
        log(f"Chroma DB directory exists at {chroma_path}", "SUCCESS")
        try:
            import chromadb
            client = chromadb.PersistentClient(path="./chroma_db")
            colls = client.list_collections()
            log(f"Vector DB accessible. Collections: {[c.name for c in colls]}", "SUCCESS")
            return True
        except ImportError:
            log("chromadb library not installed", "WARNING")
        except Exception as e:
            log(f"Vector DB Access Error: {e}", "ERROR")
    else:
        log("Chroma DB directory missing", "WARNING")
        return False

def check_images():
    print("\n🔍 Checking Vendor Images...")
    try:
        # Fetch vendors from API
        r = requests.get('http://localhost:8000/api/vendor-data/venues', timeout=5)
        if r.status_code == 200:
            data = r.json()
            # Handle list or dict return
            vendors = data if isinstance(data, list) else data.get('vendors', [])
            
            if not vendors:
                log("No vendors returned from API to check images", "WARNING")
                return
            
            sample = vendors[:3]
            missing_images = 0
            for v in sample:
                img = v.get('image') or v.get('primary_image') or v.get('thumbnail_image')
                if img:
                    log(f"Vendor '{v.get('name')}' has image: {img[:30]}...", "SUCCESS")
                else:
                    log(f"Vendor '{v.get('name')}' is MISSING image", "ERROR")
                    missing_images += 1
            
            if missing_images == len(sample):
                log("ALL sampled vendors are missing images!", "ERROR")
            elif missing_images > 0:
                log("Some vendors are missing images", "WARNING")
        else:
            log(f"Failed to fetch vendors: {r.status_code}", "ERROR")
    except Exception as e:
        log(f"Image Check Failed: {e}", "ERROR")

if __name__ == "__main__":
    print("🚀 STARTING COMPREHENSIVE DIAGNOSTICS")
    check_server()
    check_serper()
    check_nocodb()
    check_vector_db()
    check_images()
    print("\n🏁 DIAGNOSTICS COMPLETE")
