#!/bin/bash

# Setup script for React environment variables
echo "🌸 BID AI Wedding Assistant - Environment Setup"
echo "================================================"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Google API Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_oauth_client_id_here
REACT_APP_GOOGLE_API_KEY=your_api_key_here

# Gemini API Configuration (if needed)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Additional configuration
REACT_APP_GOOGLE_APP_NAME=BID AI Wedding Assistant
REACT_APP_GOOGLE_APP_VERSION=1.0.0
EOF
    echo "✅ .env file created successfully"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Edit the .env file and replace the placeholder values with your actual API keys"
echo "2. For Google API setup, follow the guide in GOOGLE_API_SETUP_GUIDE.md"
echo "3. Restart your React development server after updating the .env file"
echo ""
echo "📚 For Google API setup instructions, see: ../GOOGLE_API_SETUP_GUIDE.md" 