import os
import json
import requests
from typing import Dict, List, Optional
import google.generativeai as genai
from datetime import datetime

class AICopilotService:
    """
    AI Copilot Integration Service for Wedding Planning
    Supports Google Gemini, OpenAI, and other AI providers
    """
    
    def __init__(self):
        self.gemini_api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        # Initialize Gemini
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
    
    async def get_wedding_suggestions(self, wedding_data: Dict) -> Dict:
        """Get AI-powered wedding planning suggestions"""
        
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
        
        Format as JSON with clear sections.
        """
        
        try:
            if self.gemini_api_key:
                response = self.gemini_model.generate_content(prompt)
                return {
                    'success': True,
                    'suggestions': response.text,
                    'provider': 'Google Gemini',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return await self._fallback_suggestions(wedding_data)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'AI Copilot',
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_vendor_analysis(self, vendors: List[Dict], user_preferences: Dict) -> Dict:
        """AI analysis of vendors based on user preferences"""
        
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
            if self.gemini_api_key:
                response = self.gemini_model.generate_content(prompt)
                return {
                    'success': True,
                    'analysis': response.text,
                    'provider': 'Google Gemini',
                    'vendor_count': len(vendors),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return await self._fallback_vendor_analysis(vendors, user_preferences)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def generate_wedding_timeline(self, wedding_data: Dict) -> Dict:
        """Generate AI-powered wedding planning timeline"""
        
        prompt = f"""
        Create a detailed wedding planning timeline for:
        
        Wedding Date: {wedding_data.get('weddingDate', '')}
        Location: {wedding_data.get('region', '')}
        Wedding Type: {wedding_data.get('weddingType', 'Traditional')}
        
        Create a month-by-month timeline from 12 months before to wedding day, including:
        - Key milestones and deadlines
        - Vendor booking windows
        - Budget allocation timing
        - Legal requirements
        - Final week detailed schedule
        
        Make it specific to Indian weddings with multiple events.
        """
        
        try:
            if self.gemini_api_key:
                response = self.gemini_model.generate_content(prompt)
                return {
                    'success': True,
                    'timeline': response.text,
                    'provider': 'Google Gemini',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return await self._fallback_timeline(wedding_data)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def chat_assistant(self, message: str, context: Dict = None) -> Dict:
        """Interactive AI chat assistant for wedding planning"""
        
        context_info = ""
        if context:
            context_info = f"""
            Current Wedding Context:
            - Couple: {context.get('couple', 'Planning couple')}
            - Budget: {context.get('budget', 'Not set')}
            - Date: {context.get('date', 'Not set')}
            - Location: {context.get('location', 'Not set')}
            """
        
        prompt = f"""
        You are VivahAI, a friendly and knowledgeable Indian wedding planning assistant.
        
        {context_info}
        
        User Question: {message}
        
        Provide helpful, specific advice about:
        - Indian wedding traditions and customs
        - Vendor recommendations
        - Budget planning
        - Timeline management
        - Creative ideas
        - Problem-solving
        
        Be conversational, supportive, and culturally aware.
        """
        
        try:
            if self.gemini_api_key:
                response = self.gemini_model.generate_content(prompt)
                return {
                    'success': True,
                    'response': response.text,
                    'provider': 'Google Gemini',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return await self._fallback_chat(message, context)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def _fallback_suggestions(self, wedding_data: Dict) -> Dict:
        """Fallback suggestions when AI is unavailable"""
        return {
            'success': True,
            'suggestions': "AI service temporarily unavailable. Using curated recommendations...",
            'provider': 'Fallback Service',
            'timestamp': datetime.now().isoformat()
        }
    
    async def _fallback_vendor_analysis(self, vendors: List[Dict], preferences: Dict) -> Dict:
        """Fallback vendor analysis"""
        return {
            'success': True,
            'analysis': f"Found {len(vendors)} vendors. Review ratings, pricing, and availability.",
            'provider': 'Fallback Service',
            'timestamp': datetime.now().isoformat()
        }
    
    async def _fallback_timeline(self, wedding_data: Dict) -> Dict:
        """Fallback timeline generation"""
        return {
            'success': True,
            'timeline': "Standard 12-month wedding planning timeline available in our guides.",
            'provider': 'Fallback Service',
            'timestamp': datetime.now().isoformat()
        }
    
    async def _fallback_chat(self, message: str, context: Dict) -> Dict:
        """Fallback chat response"""
        return {
            'success': True,
            'response': "I'm here to help with your wedding planning! Please check our guides or contact our team.",
            'provider': 'Fallback Service',
            'timestamp': datetime.now().isoformat()
        }

# Initialize the service
ai_copilot = AICopilotService() 