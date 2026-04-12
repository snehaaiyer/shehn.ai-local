import sys
import os
import json
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

# Import config for keys
try:
    from config.api_config import SERPER_API_KEY
except ImportError:
    print("Could not import SERPER_API_KEY, using fallback")
    SERPER_API_KEY = "44f3982e40a663fc992acb96f7763f3c9f79bed7"

# Import the Enhanced Crew
try:
    from enhanced_indian_wedding_crew import get_enhanced_indian_wedding_crew
except ImportError as e:
    print(f"Error importing enhanced crew: {e}")
    sys.exit(1)

def test_workflow():
    print(f"🚀 Starting Real Agent Workflow Test (Key: {SERPER_API_KEY[:4]}...)")
    
    # Initialize Crew
    crew = get_enhanced_indian_wedding_crew(SERPER_API_KEY)
    
    if not crew.llm:
        print("❌ LLM Not available. Is Ollama running?")
        return

    # Test Data
    wedding_data = {
        "weddingType": "Traditional Hindu",
        "city": "Mumbai",
        "budgetRange": "₹50-70 Lakhs",
        "guestCount": 200,
        "events": ["Wedding", "Reception"]
    }
    
    print("\n🔍 Requesting Comprehensive Plan (this calls LLMs + Serper)...")
    start = datetime.now()
    
    result = crew.get_comprehensive_wedding_plan(wedding_data)
    
    duration = (datetime.now() - start).total_seconds()
    print(f"\n⏱️ Duration: {duration}s")
    
    if result.get("success"):
        print("✅ SUCCESS!")
        plan = result.get("comprehensive_plan", {})
        print(f"Venues Found: {len(plan.get('venue_recommendations', []))}")
        print(f"Budget Items: {len(plan.get('budget_breakdown', {}))}")
        
        print("\n--- VENUE RECOMMENDATIONS ---")
        for v in plan.get('venue_recommendations', []):
            print(v)
            
        # Check if Serper was actually used (hard to verify unless logs show it, but 'venue_recommendations' should be specific)
    else:
        print(f"❌ FAILED: {result.get('error')}")

if __name__ == "__main__":
    test_workflow()
