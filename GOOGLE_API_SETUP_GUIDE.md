# Google API Integration Setup Guide

## Overview
This guide will help you set up Google Calendar and Gmail API integration for the BID AI Wedding Assistant application. This integration allows users to manage wedding events, send invitations, and communicate with vendors through their Google accounts.

## Prerequisites
- Google Cloud Console account
- Basic knowledge of Google APIs
- React application with TypeScript

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `bid-ai-wedding-assistant`
4. Click "Create"

### 1.2 Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Google Calendar API**
   - **Gmail API**
   - **Google+ API** (for user profile information)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: BID AI Wedding Assistant
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: Add the following scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/userinfo.email`

4. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Name**: BID AI Wedding Assistant Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001`
     - Your production domain (when deployed)
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `http://localhost:3001`
     - Your production domain (when deployed)

5. Copy the **Client ID** and **Client Secret**

### 1.4 Create API Key (Optional)
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Restrict the API key to:
   - Google Calendar API
   - Gmail API
   - Your application's domain

## Step 2: Environment Configuration

### 2.1 Create Environment Variables
Create a `.env` file in your React project root:

```env
# Google API Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_oauth_client_id_here
REACT_APP_GOOGLE_API_KEY=your_api_key_here

# Optional: Additional configuration
REACT_APP_GOOGLE_APP_NAME=BID AI Wedding Assistant
REACT_APP_GOOGLE_APP_VERSION=1.0.0
```

### 2.2 Update Configuration File
Update `src/config/google_config.ts` with your actual credentials:

```typescript
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_client_id_here',
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || 'your_api_key_here',
  // ... rest of the configuration
};
```

## Step 3: Application Integration

### 3.1 Install Dependencies
The application uses the Google API JavaScript client library, which is loaded dynamically. No additional npm packages are required.

### 3.2 Component Structure
The integration consists of:

1. **GoogleAPIService** (`src/services/google_api_service.ts`)
   - Handles all Google API interactions
   - Manages authentication
   - Provides calendar and email functionality

2. **GoogleIntegration Component** (`src/components/GoogleIntegration.tsx`)
   - User interface for Google integration
   - Calendar event management
   - Email composition and sending

3. **Configuration** (`src/config/google_config.ts`)
   - API credentials and settings
   - Email templates
   - Calendar event templates

### 3.3 Navigation Integration
The Google Integration is accessible through:
- Sidebar navigation: "Google Integration"
- Route: `/google-integration`

## Step 4: Features Overview

### 4.1 Calendar Management
- **Create Events**: Add wedding events with details
- **Update Events**: Modify existing events
- **Delete Events**: Remove events from calendar
- **Event Types**: Ceremony, Reception, Rehearsal, Vendor Meetings
- **Attendees**: Add guest emails for invitations
- **Reminders**: Configure email and popup reminders

### 4.2 Email Management
- **Send Invitations**: Individual and bulk wedding invitations
- **Vendor Communications**: Send inquiries and confirmations
- **Email Templates**: Pre-built templates for common scenarios
- **Email History**: View sent wedding-related emails

### 4.3 Bulk Operations
- **Bulk Invitations**: Send invitations to multiple guests
- **Timeline Creation**: Create multiple events at once
- **Vendor Outreach**: Send inquiries to multiple vendors

## Step 5: Usage Examples

### 5.1 Creating a Wedding Event
```typescript
const event = {
  title: "Wedding Ceremony",
  description: "Our beautiful wedding ceremony",
  startDate: "2024-06-15T14:00:00",
  endDate: "2024-06-15T15:00:00",
  location: "St. Mary's Church, 123 Main St",
  attendees: ["guest1@example.com", "guest2@example.com"],
  eventType: "ceremony",
  reminders: {
    email: true,
    popup: true,
    minutes: 60
  }
};

const eventId = await GoogleAPIService.createWeddingEvent(event);
```

### 5.2 Sending Wedding Invitations
```typescript
const guestList = ["guest1@example.com", "guest2@example.com"];
const weddingDetails = {
  date: "June 15, 2024",
  time: "2:00 PM",
  venue: "St. Mary's Church",
  address: "123 Main St, City, State",
  coupleNames: "John & Jane Doe"
};

const messageIds = await GoogleAPIService.sendBulkInvitations(guestList, weddingDetails);
```

### 5.3 Sending Vendor Inquiries
```typescript
const inquiryDetails = {
  vendorName: "ABC Photography",
  serviceType: "Photography",
  weddingDate: "June 15, 2024",
  guestCount: 150,
  location: "City, State",
  budgetRange: "$2000-$3000",
  coupleNames: "John & Jane Doe"
};

const messageId = await GoogleAPIService.sendVendorInquiry("vendor@example.com", inquiryDetails);
```

## Step 6: Security Considerations

### 6.1 API Key Security
- Never expose API keys in client-side code
- Use environment variables for sensitive data
- Restrict API keys to specific domains and APIs
- Regularly rotate API keys

### 6.2 OAuth Security
- Use HTTPS in production
- Implement proper state parameter validation
- Store tokens securely
- Handle token refresh properly

### 6.3 Data Privacy
- Only request necessary scopes
- Implement proper data retention policies
- Handle user data deletion requests
- Comply with GDPR and other privacy regulations

## Step 7: Testing

### 7.1 Local Development
1. Start your React application: `npm start`
2. Navigate to `/google-integration`
3. Click "Sign in with Google"
4. Grant necessary permissions
5. Test calendar and email functionality

### 7.2 Testing Checklist
- [ ] Google Sign-in works
- [ ] Calendar events can be created
- [ ] Calendar events can be updated
- [ ] Calendar events can be deleted
- [ ] Emails can be sent
- [ ] Bulk invitations work
- [ ] Vendor inquiries work
- [ ] Error handling works properly

## Step 8: Deployment

### 8.1 Production Setup
1. Update authorized origins in Google Cloud Console
2. Set production environment variables
3. Ensure HTTPS is enabled
4. Test all functionality in production environment

### 8.2 Environment Variables for Production
```env
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
REACT_APP_GOOGLE_API_KEY=your_production_api_key
```

## Step 9: Troubleshooting

### 9.1 Common Issues

**"Failed to initialize Google API"**
- Check if Google API script is loading
- Verify API key and client ID
- Check browser console for errors

**"User not signed in"**
- Ensure user has granted necessary permissions
- Check OAuth consent screen configuration
- Verify scopes are properly configured

**"Calendar access denied"**
- Check if Calendar API is enabled
- Verify user has granted calendar permissions
- Check API quotas

**"Gmail access denied"**
- Check if Gmail API is enabled
- Verify user has granted Gmail permissions
- Check if user has Gmail account

### 9.2 Debug Mode
Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('google_api_debug', 'true');
```

## Step 10: API Quotas and Limits

### 10.1 Google Calendar API
- **Queries per day**: 1,000,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 10,000

### 10.2 Gmail API
- **Queries per day**: 1,000,000,000
- **Queries per 100 seconds per user**: 250
- **Queries per 100 seconds**: 1,000

### 10.3 Best Practices
- Implement request throttling
- Cache responses when appropriate
- Handle quota exceeded errors gracefully
- Monitor API usage

## Step 11: Future Enhancements

### 11.1 Planned Features
- **Calendar Sync**: Sync with other calendar providers
- **Email Templates**: More customizable templates
- **RSVP Management**: Track guest responses
- **Vendor Portal**: Dedicated vendor communication
- **Analytics**: Track email open rates and responses

### 11.2 Integration Opportunities
- **Slack/Discord**: Notifications for events
- **WhatsApp**: Alternative communication channel
- **SMS**: Text message reminders
- **Social Media**: Share wedding updates

## Support and Resources

### Documentation
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google API JavaScript Client](https://developers.google.com/api-client-library/javascript)

### Community
- [Google Cloud Community](https://cloud.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-calendar-api)
- [GitHub Issues](https://github.com/your-repo/issues)

This setup guide provides everything needed to integrate Google Calendar and Gmail APIs into your wedding planning application. Follow each step carefully and test thoroughly before deploying to production. 