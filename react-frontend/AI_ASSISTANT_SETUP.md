# 🤖 AI Assistant Setup Guide

## Overview
The Bid AI Assistant is an intelligent wedding planning companion that integrates with Google APIs and Gemini AI to provide task automation and personalized assistance.

## Features
- **Smart Scheduling**: Schedule meetings with vendors using Google Calendar
- **Vendor Discovery**: Find vendors using Google Places API
- **Communication**: Send emails through Gmail API
- **Directions**: Get directions using Google Maps API
- **Timeline Creation**: Generate personalized wedding timelines
- **Budget Analysis**: Analyze and break down wedding budgets
- **Vendor Communication**: Manage vendor communications

## API Setup

### 1. Google API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

#### Step 2: Enable Required APIs
Enable the following APIs in your Google Cloud Console:
- Google Calendar API
- Gmail API
- Google Places API
- Google Maps Directions API
- Google Maps Geocoding API

#### Step 3: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Restrict the API key to only the enabled APIs
4. Copy the API key

#### Step 4: Create OAuth 2.0 Credentials (for Gmail/Calendar)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen
4. Add authorized redirect URIs for your app
5. Copy Client ID and Client Secret

### 2. Gemini API Setup

#### Step 1: Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Environment Configuration

Create a `.env` file in the `react-frontend` directory:

```env
# Google API Configuration
REACT_APP_GOOGLE_API_KEY=your_google_api_key_here

# Gemini API Configuration  
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Usage Examples

### Schedule Meeting
```
"Schedule a meeting with the photographer tomorrow at 2 PM"
```

### Find Vendors
```
"Find wedding photographers in Mumbai"
"Find venues near my location"
```

### Send Email
```
"Send an email to the caterer asking about vegetarian options"
```

### Get Directions
```
"Get directions to the wedding venue"
```

### Create Timeline
```
"Create a wedding timeline for my December wedding"
```

### Budget Analysis
```
"Analyze my wedding budget"
```

## User Preferences Integration

The AI assistant automatically loads user preferences from the Wedding Preferences page and uses them to provide personalized assistance:

- **Wedding Date**: Used for timeline creation and scheduling
- **Location**: Used for vendor discovery and directions
- **Budget**: Used for budget analysis and vendor recommendations
- **Photography Styles**: Used for photographer recommendations
- **Venue Type**: Used for venue suggestions
- **Guest Count**: Used for venue capacity recommendations

## Security Notes

1. **API Key Security**: Never commit API keys to version control
2. **OAuth Scopes**: Request only necessary OAuth scopes
3. **Rate Limiting**: Be aware of API rate limits
4. **Data Privacy**: User preferences are stored locally in localStorage

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify API key is correct
   - Check if APIs are enabled
   - Verify API key restrictions

2. **OAuth Not Working**
   - Check redirect URIs configuration
   - Verify OAuth consent screen setup
   - Check client ID and secret

3. **CORS Issues**
   - Ensure proper CORS configuration
   - Check API key restrictions

### Error Messages

- `"User preferences not loaded"`: Set up wedding preferences first
- `"API key not configured"`: Add API keys to environment variables
- `"OAuth not authorized"`: Complete OAuth flow

## Development

### Local Development
1. Set up environment variables
2. Run `npm start`
3. Access AI assistant at `/ai-chat`

### Testing
- Test with sample user preferences
- Verify API integrations work
- Check error handling

## Future Enhancements

- SMS integration for vendor communication
- WhatsApp Business API integration
- Advanced vendor matching algorithms
- Real-time vendor availability checking
- Automated follow-up scheduling
- Integration with wedding planning tools 