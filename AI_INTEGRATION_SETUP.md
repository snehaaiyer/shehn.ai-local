# 🤖 AI Copilot Integration Setup Guide

## Overview
This guide will help you integrate Google Gemini, ChatGPT, and other AI assistants into your wedding planning application.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
pip install -r ai_requirements.txt
```

### 2. Get API Keys

#### Google Gemini (Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy your API key

#### OpenAI (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy your API key

#### Anthropic Claude (Optional)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy your API key

### 3. Set Environment Variables

Create a `.env` file in your project root:

```bash
# AI Copilot API Keys
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database Configuration
NOCODB_API_URL=http://localhost:8080
NOCODB_API_TOKEN=your_nocodb_token

# Serper API Key for vendor search
SERPER_API_KEY=your_serper_api_key
```

### 4. Include AI Script in Frontend

Add this to your HTML files (e.g., `index.html`):

```html
<!-- AI Copilot Integration -->
<script src="/js/ai-copilot.js"></script>
```

### 5. Test the Integration

Start your server and test the AI endpoints:

```bash
# Start the server
python simple_unified_server.py

# Test AI chat endpoint
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Help me plan my wedding", "context": {"budget": "₹10L", "location": "Mumbai"}}'

# Test wedding suggestions
curl -X POST http://localhost:8000/api/ai/wedding-suggestions \
  -H "Content-Type: application/json" \
  -d '{"partner1Name": "Sneha", "partner2Name": "Raj", "region": "Bangalore", "budget": "₹15L"}'
```

## 🎯 Features Available

### 1. **AI Chat Assistant**
- Floating chat widget on all pages
- Context-aware responses
- Wedding planning advice
- Cultural guidance for Indian weddings

### 2. **Wedding Suggestions**
- Personalized theme recommendations
- Budget breakdowns
- Vendor suggestions
- Unique wedding ideas

### 3. **Vendor Analysis**
- AI-powered vendor comparison
- Negotiation tips
- Red flags identification
- Personalized recommendations

### 4. **Timeline Generation**
- Month-by-month planning timeline
- Indian wedding-specific milestones
- Legal requirements checklist
- Final week detailed schedule

## 🎨 Frontend Usage

### Using the AI Chat Widget

The AI chat widget automatically appears on all pages. Users can:

1. Click the "🤖 AI Assistant" button
2. Ask questions about wedding planning
3. Get personalized advice based on their wedding data

### Programmatic Usage

```javascript
// Get wedding suggestions
const suggestions = await aiCopilot.getWeddingSuggestions();

// Analyze vendors
const analysis = await aiCopilot.analyzeVendors(vendorsList, userPreferences);

// Generate timeline
const timeline = await aiCopilot.generateTimeline();

// Chat with assistant
const response = await aiCopilot.chatWithAssistant("What flowers work best for a winter wedding?");
```

## 🛠️ Customization

### Adding New AI Providers

1. Edit `ai_copilot_integration.py`
2. Add your provider's API client
3. Implement the provider methods
4. Update the fallback logic

### Customizing Prompts

Edit the prompt templates in `ai_copilot_integration.py`:

```python
prompt = f"""
You are a professional wedding planner AI assistant. Help plan this wedding:

Wedding Details:
- Couple: {wedding_data.get('partner1Name', '')} & {wedding_data.get('partner2Name', '')}
- Date: {wedding_data.get('weddingDate', '')}
- Location: {wedding_data.get('region', '')}

[Customize this prompt for your needs]
"""
```

### Styling the Chat Widget

Edit the CSS in `ai-copilot.js` or override with your own styles:

```css
#ai-chat-widget {
    /* Your custom styles */
}

.ai-chat-toggle {
    /* Customize the chat button */
}
```

## 📱 Mobile Responsiveness

The AI chat widget is mobile-responsive and will adapt to different screen sizes automatically.

## 🔒 Security Considerations

1. **API Keys**: Never expose API keys in frontend code
2. **Rate Limiting**: Implement rate limiting for AI endpoints
3. **Input Validation**: Validate all user inputs before sending to AI
4. **Cost Management**: Monitor API usage to control costs

## 🚀 Advanced Features

### Integration with Existing Vendor Search

```javascript
// Analyze vendors from search results
const vendors = await fetch('/api/vendors?category=venues&location=bangalore');
const vendorData = await vendors.json();

// Get AI analysis
const analysis = await aiCopilot.analyzeVendors(vendorData.vendors, {
    budget: '₹15L',
    theme: 'Traditional',
    guestCount: '300'
});
```

### Context-Aware Suggestions

The AI assistant automatically uses:
- Current wedding data from localStorage
- User preferences and selections
- Search history and vendor interactions
- Budget and location information

## 🐛 Troubleshooting

### Common Issues

1. **AI not responding**: Check API keys in environment variables
2. **Chat widget not showing**: Ensure `ai-copilot.js` is loaded
3. **CORS errors**: Check server CORS configuration
4. **API rate limits**: Implement request throttling

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('aiCopilotDebug', 'true');
```

## 💰 Cost Optimization

1. **Caching**: Implement response caching for similar queries
2. **Fallbacks**: Use local knowledge base for common questions
3. **User Guidance**: Provide suggested questions to avoid open-ended queries
4. **Request Batching**: Combine multiple requests when possible

## 🔄 Updates and Maintenance

1. Monitor AI provider changelog for API updates
2. Update prompts based on user feedback
3. Analyze usage patterns to improve responses
4. Regular testing of all AI endpoints

## 📞 Support

For technical support:
1. Check server logs for errors
2. Test API endpoints directly
3. Verify environment variables
4. Check network connectivity to AI providers

---

🎉 **Your AI-powered wedding planning assistant is now ready!**

Users can now get intelligent suggestions, vendor analysis, and planning guidance powered by advanced AI models. 