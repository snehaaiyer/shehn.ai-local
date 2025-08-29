
#!/usr/bin/env python3
"""
Test Ollama Local Integration for BID AI Wedding Assistant
"""

import requests
import json
import asyncio
from datetime import datetime

def check_ollama_status():
    """Check if Ollama is running and responsive"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print("✅ Ollama is running")
            print(f"   Available models: {len(models)}")
            for model in models:
                print(f"   - {model.get('name', 'Unknown')}")
            return True
        else:
            print(f"❌ Ollama API returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ollama not accessible: {e}")
        return False

def test_ollama_generate():
    """Test basic Ollama generation"""
    try:
        payload = {
            "model": "nous-hermes:latest",
            "prompt": "You are a wedding planning assistant. Briefly explain 3 key benefits of using AI for wedding planning.",
            "stream": False,
            "options": {
                "temperature": 0.7,
                "max_tokens": 200
            }
        }
        
        response = requests.post(
            'http://localhost:11434/api/generate',
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Ollama generation test successful")
            print(f"   Response: {result.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ Generation test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Generation test error: {e}")
        return False

def test_ollama_chat():
    """Test Ollama chat format"""
    try:
        payload = {
            "model": "nous-hermes:latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful wedding planning AI assistant."
                },
                {
                    "role": "user", 
                    "content": "What are 3 key things to consider when planning an Indian wedding?"
                }
            ],
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }
        
        response = requests.post(
            'http://localhost:11434/api/chat',
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            message_content = result.get('message', {}).get('content', '')
            print("✅ Ollama chat test successful")
            print(f"   Response: {message_content[:100]}...")
            return True
        else:
            print(f"❌ Chat test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Chat test error: {e}")
        return False

async def test_ai_service():
    """Test the ollama_ai_service.py integration"""
    try:
        from ollama_ai_service import ollama_service
        
        wedding_data = {
            'partner1Name': 'Priya',
            'partner2Name': 'Arjun',
            'weddingDate': '2024-12-15',
            'region': 'Mumbai',
            'budget': '₹40-60 Lakhs',
            'guestCount': '200',
            'theme': 'Traditional'
        }
        
        result = await ollama_service.get_wedding_suggestions(wedding_data)
        
        if result['success']:
            print("✅ AI Service integration test successful")
            print(f"   Provider: {result['provider']}")
            print(f"   Response length: {len(result['suggestions'])} characters")
            return True
        else:
            print(f"❌ AI Service test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ AI Service test error: {e}")
        return False

async def test_production_agents():
    """Test production wedding agents"""
    try:
        from production_wedding_agents import get_production_agents
        
        agents = get_production_agents()
        
        if not agents.llm:
            print("❌ Production agents - LLM not available")
            return False
        
        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "200",
            "budgetRange": "₹40-60 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony"]
        }
        
        result = agents.process_wedding_form(test_form)
        
        if result["success"]:
            print("✅ Production agents test successful")
            print(f"   AI Powered: {result['ai_powered']}")
            print(f"   Agents Used: {result['agents_used']}")
            return True
        else:
            print(f"❌ Production agents test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Production agents test error: {e}")
        return False

async def main():
    """Run all Ollama integration tests"""
    print("🤖 BID AI - Ollama Integration Test Suite")
    print("=" * 50)
    
    # Check Ollama status
    if not check_ollama_status():
        print("\n❌ Ollama is not running. Please start it with:")
        print("   ollama serve")
        return
    
    print("\n🧪 Running integration tests...")
    
    # Test basic generation
    test_ollama_generate()
    print()
    
    # Test chat format
    test_ollama_chat()
    print()
    
    # Test AI service
    await test_ai_service()
    print()
    
    # Test production agents
    await test_production_agents()
    
    print("\n" + "=" * 50)
    print("🎉 Ollama Integration Test Complete!")
    print("✅ If all tests passed, Ollama is working properly")
    print("❌ If tests failed, check error messages above")

if __name__ == "__main__":
    asyncio.run(main())
