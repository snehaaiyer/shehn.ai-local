#!/bin/bash

# BID AI Wedding App - Database Integration Startup Script
echo "🎉 BID AI Wedding App with Database Integration"
echo "=============================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 required"
    exit 1
fi

# Install Flask if needed
if ! python3 -c "import flask" &> /dev/null; then
    pip3 install flask flask-cors requests
fi

# Start API service
echo "📡 Starting API service..."
python3 api_service.py &
API_PID=$!
sleep 2

# Start web server
echo "🌐 Starting web server..."
python3 -m http.server 8003 &
WEB_PID=$!
sleep 2

echo "✅ Services running!"
echo "🌸 Wedding App: http://localhost:8003"
echo "📡 API Service: http://localhost:5000"
echo "🗄️  NocoDB: http://localhost:8080"

# Open browser
if command -v open &> /dev/null; then
    open "http://localhost:8003"
fi

wait $API_PID $WEB_PID
