#!/usr/bin/env python3
"""
Ollama AI Service Integration for BID AI Wedding Assistant
Provides real AI responses using local Ollama models
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Any
import os
from datetime import datetime
import asyncio
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OllamaAIService:
    """
    AI Service using Ollama for real AI responses
    """
    
    def __init__(self, model: str = "nous-hermes:latest", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
        self.chat_url = f"{base_url}/api/chat"
        
    async def _make_request(self, prompt: str, system_prompt: str = None) -> str:
        """Make request to Ollama API"""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2048
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', '')
                    else:
                        logger.error(f"Ollama API error: {response.status}")
                        return self._get_fallback_response(prompt)
                        
        except Exception as e:
            logger.error(f"Error calling Ollama: {e}")
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback response when Ollama is unavailable"""
        return "I'm currently experiencing technical difficulties. Please try again later or contact support."
    
    async def get_wedding_suggestions(self, wedding_data: Dict) -> Dict:
        """Get AI-powered wedding planning suggestions"""
        
        system_prompt = """You are a professional Indian wedding planner AI assistant. 
        Provide detailed, culturally-aware suggestions for Indian weddings.
        Focus on practical, actionable advice that considers Indian traditions and modern preferences."""
        
        prompt = f"""
        You are a professional wedding planner AI assistant. Help plan this wedding:
        
        Wedding Details:
        - Couple: {wedding_data.get('partner1Name', '')} & {wedding_data.get('partner2Name', '')}
        - Date: {wedding_data.get('weddingDate', '')}
        - Location: {wedding_data.get('region', '')}
        - Budget: {wedding_data.get('budget', 'Not specified')}
        - Guest Count: {wedding_data.get('guestCount', 'Not specified')}
        - Theme: {wedding_data.get('theme', 'Not specified')}
        
        Please provide:
        1. 5 creative theme suggestions based on their preferences
        2. Budget breakdown recommendations
        3. Timeline suggestions (3 months before wedding)
        4. Vendor recommendations for their location
        5. Unique ideas to make their wedding special
        
        Format your response in a clear, structured manner with numbered sections.
        """
        
        try:
            response = await self._make_request(prompt, system_prompt)
            return {
                'success': True,
                'suggestions': response,
                'provider': 'Ollama (Nous-Hermes)',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'Ollama AI',
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_vendor_analysis(self, vendors: List[Dict], user_preferences: Dict) -> Dict:
        """AI analysis of vendors based on user preferences"""
        
        system_prompt = """You are an expert wedding vendor analyst.
        Analyze vendors objectively and provide actionable insights.
        Focus on value, quality, and compatibility with the couple's needs."""
        
        prompt = f"""
        Analyze these wedding vendors and provide personalized recommendations:
        
        User Preferences:
        - Budget: {user_preferences.get('budget', 'Flexible')}
        - Style: {user_preferences.get('theme', 'Classic')}
        - Priorities: {user_preferences.get('priorities', [])}
        
        Vendors to analyze:
        {json.dumps(vendors[:5], indent=2)}
        
        Provide:
        1. Top 3 vendor recommendations with reasons
        2. Budget optimization tips
        3. Questions to ask each vendor
        4. Red flags to watch for
        5. Negotiation strategies
        
        Be specific and actionable.
        """
        
        try:
            response = await self._make_request(prompt, system_prompt)
            return {
                'success': True,
                'analysis': response,
                'provider': 'Ollama (Nous-Hermes)',
                'vendor_count': len(vendors),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'Ollama AI',
                'timestamp': datetime.now().isoformat()
            }
    
    async def generate_wedding_timeline(self, wedding_data: Dict) -> Dict:
        """Generate wedding planning timeline"""
        
        system_prompt = """You are a wedding timeline expert.
        Create detailed, practical timelines for Indian weddings.
        Consider cultural traditions and modern planning needs."""
        
        prompt = f"""
        Create a detailed wedding planning timeline for:
        
        Wedding Details:
        - Date: {wedding_data.get('weddingDate', '')}
        - Type: {wedding_data.get('weddingType', 'Traditional')}
        - Location: {wedding_data.get('city', '')}
        - Guest Count: {wedding_data.get('guestCount', '')}
        
        Please provide:
        1. 12-month timeline with key milestones
        2. 6-month detailed planning checklist
        3. 3-month intensive planning schedule
        4. 1-month final preparations
        5. Week-of wedding schedule
        
        Include Indian wedding specific elements and cultural considerations.
        """
        
        try:
            response = await self._make_request(prompt, system_prompt)
            return {
                'success': True,
                'timeline': response,
                'provider': 'Ollama (Nous-Hermes)',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'Ollama AI',
                'timestamp': datetime.now().isoformat()
            }
    
    async def chat_assistant(self, message: str, context: Dict = None) -> Dict:
        """AI chat assistant for wedding planning - Brief and task-focused"""
        
        system_prompt = """You are Bid AI, a brief and efficient wedding planning assistant.

        CORE PRINCIPLES:
        - Keep responses under 2-3 sentences
        - Focus on actionable tasks, not explanations
        - Ask specific questions to gather needed info
        - Provide direct answers with clear next steps
        - Use bullet points for multiple items
        - Be task-oriented, not conversational

        RESPONSE STYLE:
        - "I'll help you [specific task]. What's your [specific detail needed]?"
        - "Here are 3 options: [bullet points]"
        - "To proceed, I need: [specific info]"
        - "Next step: [action item]"

        NO GENERIC ADVICE - ONLY SPECIFIC TASKS."""
        
        # Build context-aware prompt
        context_info = ""
        if context:
            context_info = f"""
            Context:
            - Budget: {context.get('budget', 'Not specified')}
            - Location: {context.get('location', 'Not specified')}
            - Wedding Type: {context.get('weddingType', 'Traditional')}
            - Guest Count: {context.get('guestCount', 'Not specified')}
            """
        
        prompt = f"""
        {context_info}
        
        User Message: {message}
        
        TASK ANALYSIS:
        - Identify the specific task the user wants to accomplish
        - Provide only the essential information needed
        - Give clear next steps or ask for specific details
        - Keep response brief and actionable
        
        If user asks about:
        - Vendors: Ask for category, location, budget range
        - Budget: Ask for total budget to create breakdown
        - Timeline: Ask for wedding date to create schedule
        - Venue: Ask for guest count, location, style preference
        - Photography: Ask for style preference, budget, date
        
        RESPOND WITH: Task + Required Info + Next Step
        """
        
        try:
            response = await self._make_request(prompt, system_prompt)
            return {
                'success': True,
                'response': response,
                'provider': 'Ollama (Nous-Hermes)',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'Ollama AI',
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_vendor_recommendations(self, search_query: str, wedding_context: Dict) -> Dict:
        """Get AI-powered vendor recommendations based on search query"""
        
        system_prompt = """You are a wedding vendor recommendation expert.
        Analyze search queries and provide intelligent vendor suggestions.
        Consider budget, location, style, and cultural preferences."""
        
        prompt = f"""
        Analyze this vendor search query and provide recommendations:
        
        Search Query: {search_query}
        
        Wedding Context:
        - Budget: {wedding_context.get('budget', 'Flexible')}
        - Location: {wedding_context.get('location', 'Not specified')}
        - Style: {wedding_context.get('theme', 'Traditional')}
        - Guest Count: {wedding_context.get('guestCount', 'Not specified')}
        - Wedding Type: {wedding_context.get('weddingType', 'Traditional')}
        
        Please provide:
        1. Recommended vendor categories to search
        2. Specific search terms and keywords
        3. Important criteria to consider
        4. Budget-friendly alternatives
        5. Questions to ask vendors
        
        Focus on practical, actionable recommendations.
        """
        
        try:
            response = await self._make_request(prompt, system_prompt)
            return {
                'success': True,
                'recommendations': response,
                'provider': 'Ollama (Nous-Hermes)',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'Ollama AI',
                'timestamp': datetime.now().isoformat()
            }

# Global instance
ollama_service = OllamaAIService()

# Test function
async def test_ollama_integration():
    """Test the Ollama AI service"""
    print("🧪 Testing Ollama AI Integration...")
    
    # Test chat
    chat_result = await ollama_service.chat_assistant(
        "I need help finding a photographer for my traditional Indian wedding in Mumbai",
        {"budget": "₹2-3 lakhs", "location": "Mumbai", "weddingType": "Traditional"}
    )
    
    print("✅ Chat Test Result:")
    print(chat_result.get('response', 'No response'))
    
    # Test vendor recommendations
    vendor_result = await ollama_service.get_vendor_recommendations(
        "photographer candid traditional",
        {"budget": "₹2-3 lakhs", "location": "Mumbai", "theme": "Traditional"}
    )
    
    print("\n✅ Vendor Recommendations Test Result:")
    print(vendor_result.get('recommendations', 'No recommendations'))

if __name__ == "__main__":
    asyncio.run(test_ollama_integration()) 