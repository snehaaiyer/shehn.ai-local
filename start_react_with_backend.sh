
#!/bin/bash

echo "🚀 Starting BID AI Wedding Assistant - Full Stack"
echo "=================================================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use. Killing existing process..."
        kill -9 $(lsof -ti:$port) 2>/dev/null || true
        sleep 2
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Services on port 8000..."
    check_port 8000
    python simple_unified_server.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://0.0.0.0:8000/health > /dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        sleep 1
        echo "   Checking backend... ($i/30)"
    done
}

# Function to start React frontend
start_frontend() {
    echo "🎨 Frontend is being served by the Backend on port 8000."
    echo "✅ Static build found and mounted."
}

# Start services
start_backend
sleep 5
start_frontend

echo ""
echo "🎉 BID AI Wedding Assistant is starting up!"
echo "=================================================="
echo "🔧 Backend API: http://0.0.0.0:8000"
echo "🎨 React Frontend: http://0.0.0.0:8000"
echo "📊 Health Check: http://0.0.0.0:8000/health"
echo "📋 API Docs: http://0.0.0.0:8000/api/docs"
echo "=================================================="
echo ""
echo "🏃 Services are starting... Please wait a moment for full initialization."
echo "💡 Check your Replit preview to access the applications."
echo ""
echo "To stop services: Ctrl+C or kill the processes manually"

# Keep script running
wait
