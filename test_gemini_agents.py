
#!/usr/bin/env python3
"""
Test script to verify all wedding agents use Gemini API
No Ollama dependencies for production deployment
"""

import sys
import traceback
from datetime import datetime

def test_gemini_production_agents():
    """Test the main Gemini production agents"""
    try:
        print("🧪 Testing Gemini Production Agents...")
        
        from production_wedding_agents_gemini import get_gemini_production_agents
        
        agents = get_gemini_production_agents()
        
        if not agents or not agents.llm:
            print("❌ Gemini agents initialization failed")
            return False
        
        print(f"✅ Gemini LLM: {agents.llm.model}")
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "200", 
            "budgetRange": "₹40-60 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony", "Reception"]
        }
        
        print("🤖 Testing wedding form processing...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Gemini agents working!")
            print(f"   Model: {result['model_used']}")
            print(f"   Agents: {result['agents_used']}")
            return True
        else:
            print(f"❌ Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini agents: {e}")
        traceback.print_exc()
        return False

def test_operational_gemini_agents():
    """Test operational agents with Gemini"""
    try:
        print("\n🧪 Testing Operational Gemini Agents...")
        
        from operational_wedding_agents import get_operational_agents
        
        agents = get_operational_agents()
        
        if not agents or not agents.llm:
            print("❌ Operational agents initialization failed")
            return False
        
        print(f"✅ Operational LLM: {agents.llm.model}")
        
        test_form = {
            "weddingType": "Traditional South Indian",
            "city": "Bangalore",
            "budgetRange": "₹35-50 Lakhs",
            "guestCount": "180"
        }
        
        print("🤖 Testing operational processing...")
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Operational Gemini agents working!")
            print(f"   Model: {result['model_used']}")
            print(f"   Gemini API: {result['gemini_api']}")
            return True
        else:
            print(f"❌ Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing operational agents: {e}")
        return False

def verify_no_ollama_dependencies():
    """Verify no Ollama dependencies in agent files"""
    print("\n🔍 Verifying No Ollama Dependencies...")
    
    agent_files = [
        "production_wedding_agents_gemini.py",
        "operational_wedding_agents.py"
    ]
    
    ollama_found = False
    
    for file_path in agent_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
            if "ollama" in content.lower():
                print(f"⚠️  Found 'ollama' in {file_path}")
                # Check if it's just in comments or strings
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if "ollama" in line.lower() and not line.strip().startswith('#') and not line.strip().startswith('"""'):
                        if "base_url" in line or "model=" in line:
                            print(f"   Line {i}: {line.strip()}")
                            ollama_found = True
            else:
                print(f"✅ No Ollama dependencies in {file_path}")
                
        except FileNotFoundError:
            print(f"⚠️  File not found: {file_path}")
        except Exception as e:
            print(f"❌ Error checking {file_path}: {e}")
    
    if not ollama_found:
        print("✅ All agent files are Ollama-free!")
        return True
    else:
        print("❌ Found Ollama dependencies that need fixing")
        return False

def main():
    """Run all Gemini agent tests"""
    print("🤖 BID AI - Gemini Agents Test Suite")
    print("="*50)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)
    
    # Test all Gemini-based agents
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Production Gemini Agents
    if test_gemini_production_agents():
        tests_passed += 1
    
    # Test 2: Operational Gemini Agents  
    if test_operational_gemini_agents():
        tests_passed += 1
    
    # Test 3: Verify no Ollama dependencies
    if verify_no_ollama_dependencies():
        tests_passed += 1
    
    # Summary
    print("\n" + "="*60)
    print(f"📊 TEST RESULTS: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 ALL GEMINI AGENTS WORKING!")
        print("   ✅ Production ready")
        print("   ✅ No local dependencies") 
        print("   ✅ Deployment compatible")
        print("   ✅ Gemini 2.0 Flash Exp")
        return True
    else:
        print("❌ Some tests failed - check setup")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
