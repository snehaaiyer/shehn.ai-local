#!/bin/bash

# BID AI Wedding Assistant - Local Website Launcher
echo "🌸 Starting BID AI Wedding Assistant..."
echo "═══════════════════════════════════════════"

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found! Please install Python 3.x"
    exit 1
fi

# Find an available port
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    echo "Port $PORT is busy, trying $((PORT+1))..."
    PORT=$((PORT+1))
done

echo "🚀 Starting BID AI Wedding Assistant on port $PORT"
echo "📱 Open your browser and go to: http://localhost:$PORT"
echo "═══════════════════════════════════════════"
echo ""

# Start the server
$PYTHON_CMD server.py $PORT 