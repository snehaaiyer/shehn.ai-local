#!/usr/bin/env python3
"""
Show Actual Agent Recommendations and Output
"""

from working_wedding_agents import get_working_agents
import json

def show_agent_recommendations():
    """Show actual agent recommendations with real output"""
    
    # Test with realistic wedding data
    test_data = {
        'weddingType': 'Traditional Hindu',
        'city': 'Mumbai',
        'budgetRange': '₹50-70 Lakhs',
        'weddingStyle': 'Traditional',
        'guestCount': 200,
        'events': ['Wedding Ceremony', 'Reception'],
        'priorities': ['Venue', 'Catering', 'Photography'],
        'weddingDate': '2024-12-15',
        'season': 'Winter'
    }
    
    print("🤖 GETTING LIVE AI AGENT RECOMMENDATIONS...")
    print("="*60)
    
    # Initialize agents (without search to avoid tool issues)
    agents = get_working_agents()
    
    print("\n1️⃣ VENDOR RECOMMENDATIONS:")
    print("-" * 40)
    vendor_result = agents.get_vendor_recommendations(test_data)
    print("Raw Agent Response:")
    if 'error' not in vendor_result:
        print(f"✅ Success! Keys: {list(vendor_result.keys())}")
        for key, value in vendor_result.items():
            print(f"\n{key.upper()}:")
            if isinstance(value, list):
                for i, item in enumerate(value, 1):
                    print(f"  {i}. {item}")
            elif isinstance(value, dict):
                for k, v in value.items():
                    print(f"  {k}: {v}")
            else:
                print(f"  {value}")
    else:
        print(f"❌ Error: {vendor_result['error']}")
    
    print("\n2️⃣ STYLE RECOMMENDATIONS:")
    print("-" * 40)
    style_result = agents.get_style_recommendations(test_data)
    print("Raw Agent Response:")
    if 'error' not in style_result:
        print(f"✅ Success! Keys: {list(style_result.keys())}")
        for key, value in style_result.items():
            print(f"\n{key.upper()}:")
            if isinstance(value, list):
                for i, item in enumerate(value, 1):
                    print(f"  {i}. {item}")
            elif isinstance(value, dict):
                for k, v in value.items():
                    print(f"  {k}: {v}")
            else:
                print(f"  {value}")
    else:
        print(f"❌ Error: {style_result['error']}")
    
    print("\n3️⃣ COMPLETE FORM PROCESSING:")
    print("-" * 40)
    form_result = agents.process_wedding_form(test_data)
    print("Raw Agent Response:")
    if form_result.get('success'):
        print(f"✅ Success! AI Powered: {form_result.get('ai_powered')}")
        print(f"Agents Used: {form_result.get('agents_used')}")
        print(f"Search Enabled: {form_result.get('search_enabled')}")
        
        # Show parsed insights
        insights = form_result.get('parsed_insights', {})
        print(f"\nBUDGET ANALYSIS:")
        budget_analysis = insights.get('budget_analysis', {})
        print(f"  Categories Found: {budget_analysis.get('categories_found', [])}")
        
        print(f"\nVENDOR INSIGHTS:")
        vendor_insights = insights.get('vendor_insights', {})
        print(f"  Categories: {vendor_insights.get('categories', [])}")
        
        # Show raw agent analysis (truncated)
        raw_analysis = str(form_result.get('agent_analysis', ''))
        if len(raw_analysis) > 500:
            print(f"\nRAW AGENT ANALYSIS (first 500 chars):")
            print(raw_analysis[:500] + "...")
        else:
            print(f"\nRAW AGENT ANALYSIS:")
            print(raw_analysis)
            
    else:
        print(f"❌ Error: {form_result.get('error')}")
    
    print("\n" + "="*60)
    print("🎉 LIVE AGENT OUTPUT DEMONSTRATION COMPLETE!")
    print("This shows the actual AI recommendations your system generates.")

if __name__ == "__main__":
    show_agent_recommendations() 