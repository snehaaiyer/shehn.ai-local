#!/bin/bash

echo "🎉 Starting React Wedding Planner on Replit"
echo "============================================"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables for Replit
export HOST=0.0.0.0
export PORT=5000
export BROWSER=none

echo "🚀 Starting React development server..."
echo "📱 Frontend will be available at your Replit domain"

# Start the React app
npm start