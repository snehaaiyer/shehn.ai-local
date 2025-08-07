
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
    echo "🔧 Starting Backend Services on port 5000..."
    check_port 5000
    python simple_unified_server.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://0.0.0.0:5000/health > /dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        sleep 1
        echo "   Checking backend... ($i/30)"
    done
}

# Function to start React frontend
start_frontend() {
    echo "🎨 Starting React Frontend on port 3000..."
    check_port 3000
    cd react-frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing React dependencies..."
        npm install
    fi
    
    # Set environment variables
    export HOST=0.0.0.0
    export PORT=3000
    export BROWSER=none
    
    echo "🚀 Starting React development server..."
    npm start &
    FRONTEND_PID=$!
    cd ..
    echo "✅ Frontend started with PID: $FRONTEND_PID"
}

# Start services
start_backend
sleep 5
start_frontend

echo ""
echo "🎉 BID AI Wedding Assistant is starting up!"
echo "=================================================="
echo "🔧 Backend API: http://0.0.0.0:5000"
echo "🎨 React Frontend: http://0.0.0.0:3000"
echo "📊 Health Check: http://0.0.0.0:5000/health"
echo "📋 API Docs: http://0.0.0.0:5000/api/docs"
echo "=================================================="
echo ""
echo "🏃 Services are starting... Please wait a moment for full initialization."
echo "💡 Check your Replit preview to access the applications."
echo ""
echo "To stop services: Ctrl+C or kill the processes manually"

# Keep script running
wait
