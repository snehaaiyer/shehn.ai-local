# 🔧 Google API Setup Instructions

## Current Status
✅ **Google API Key**: Configured  
❌ **Google Client ID**: Missing (This is causing the runtime error)

## The Problem
The runtime error you're seeing is because the Google API requires both:
1. **API Key** (you have this)
2. **OAuth Client ID** (you need this)

## Step-by-Step Solution

### Step 1: Get Your OAuth Client ID

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the same project where you got your API key

2. **Navigate to Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Look for "OAuth 2.0 Client IDs"

3. **Create OAuth 2.0 Client ID** (if you don't have one)
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - **Application type**: Web application
   - **Name**: BID AI Wedding Assistant
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `http://localhost:3001`

4. **Copy the Client ID**
   - It will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### Step 2: Update Your .env File

1. **Open the .env file** in the `react-frontend` directory
2. **Replace the placeholder** with your actual Client ID:

```env
# Google API Configuration
REACT_APP_GOOGLE_API_KEY=AIzaSyA-imnF1AuRsKQUO55rUgXdjNdcz0_mJvw
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com

# Gemini API Configuration (if needed)
REACT_APP_GEMINI_API_KEY=

# Optional: Additional configuration
REACT_APP_GOOGLE_APP_NAME=BID AI Wedding Assistant
REACT_APP_GOOGLE_APP_VERSION=1.0.0
```

### Step 3: Restart the Development Server

1. **Stop the current server** (Ctrl+C in the terminal)
2. **Restart it**:
   ```bash
   npm start
   ```

### Step 4: Test the Integration

1. **Navigate to Google Integration** in your app
2. **You should see** the proper sign-in screen instead of demo mode
3. **Click "Sign in with Google"** to test the OAuth flow

## Alternative: Demo Mode

If you want to test the app without setting up Google API:

1. **The app will automatically run in demo mode** when API keys are missing
2. **You can still see the UI** and understand how the integration works
3. **No runtime errors** will occur

## Troubleshooting

### If you still get errors:
1. **Check the browser console** for specific error messages
2. **Verify the Client ID** is correct (no extra spaces)
3. **Make sure the .env file** is in the `react-frontend` directory
4. **Restart the development server** after making changes

### Common Issues:
- **"Invalid Client ID"**: Check that you copied the entire Client ID
- **"Redirect URI mismatch"**: Make sure `http://localhost:3000` is in your authorized origins
- **"API not enabled"**: Enable Google Calendar API and Gmail API in Google Cloud Console

## Next Steps

Once you have the Client ID configured:
1. ✅ Runtime errors will be fixed
2. ✅ Google Integration will work properly
3. ✅ You can sign in with Google
4. ✅ Calendar and email features will be functional

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your Google Cloud Console settings
3. Make sure all required APIs are enabled
4. Test with a fresh browser session 