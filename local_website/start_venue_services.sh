#!/bin/bash

# Start Venue Discovery Services
# This script starts all necessary services for the AI-powered venue discovery feature

echo "🏛️ Starting BID AI Venue Discovery Services..."
echo "================================================================"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        return 0
    fi
}

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file=$4
    
    echo "🚀 Starting $name on port $port..."
    
    if check_port $port; then
        $command > $log_file 2>&1 &
        local pid=$!
        echo "$pid" > "${name// /_}.pid"
        echo "   ✅ $name started (PID: $pid)"
        echo "   📝 Logs: $log_file"
    else
        echo "   ❌ Cannot start $name - port $port is busy"
    fi
}

# Create logs directory
mkdir -p logs

# Kill any existing services
echo "🧹 Cleaning up existing services..."
if [ -f "venue_discovery_service.pid" ]; then
    kill $(cat venue_discovery_service.pid) 2>/dev/null
    rm venue_discovery_service.pid
fi

if [ -f "api_service.pid" ]; then
    kill $(cat api_service.pid) 2>/dev/null
    rm api_service.pid
fi

if [ -f "web_server.pid" ]; then
    kill $(cat web_server.pid) 2>/dev/null
    rm web_server.pid
fi

echo "================================================================"

# Start Venue Discovery Service (AI + Serper)
start_service "Venue Discovery Service" "python3 venue_discovery_service.py" 8002 "logs/venue_discovery.log"

# Wait a moment for venue service to initialize
sleep 2

# Start Main API Service
start_service "Main API Service" "python3 api_service.py" 5001 "logs/api_service.log"

# Wait a moment for API service to initialize  
sleep 2

# Start Web Server
start_service "Web Server" "python3 server.py 8003" 8003 "logs/web_server.log"

# Wait for services to start
sleep 3

echo "================================================================"
echo "🎉 All services started successfully!"
echo ""
echo "📱 Application URLs:"
echo "   🌐 Wedding App:          http://localhost:8003"
echo "   🏛️ Venue Discovery:      http://localhost:8003/venues-discovery.html"
echo "   🔧 Main API:             http://localhost:5001"
echo "   🤖 Venue Discovery API:  http://localhost:8002"
echo ""
echo "🔍 Service Status:"

# Check if services are running
check_service() {
    local name=$1
    local port=$2
    local pid_file=$3
    
    if [ -f "$pid_file" ] && kill -0 $(cat $pid_file) 2>/dev/null; then
        if check_port $port; then
            echo "   ❌ $name (PID: $(cat $pid_file)) - Port $port not responding"
        else
            echo "   ✅ $name (PID: $(cat $pid_file)) - Running on port $port"
        fi
    else
        echo "   ❌ $name - Not running"
    fi
}

check_service "Venue Discovery Service" 8002 "venue_discovery_service.pid"
check_service "Main API Service" 5001 "api_service.pid"  
check_service "Web Server" 8003 "web_server.pid"

echo ""
echo "📝 Log Files:"
echo "   📄 Venue Discovery: logs/venue_discovery.log"
echo "   📄 API Service:     logs/api_service.log"
echo "   📄 Web Server:      logs/web_server.log"
echo ""
echo "🛑 To stop all services, run: ./stop_venue_services.sh"
echo "================================================================"

# Keep script running and show live logs
echo "📊 Live Service Status (Press Ctrl+C to exit monitoring):"
echo ""

trap 'echo "👋 Monitoring stopped. Services are still running."; exit 0' INT

while true; do
    sleep 5
    
    # Check if all services are still running
    venue_running=false
    api_running=false
    web_running=false
    
    if [ -f "venue_discovery_service.pid" ] && kill -0 $(cat venue_discovery_service.pid) 2>/dev/null; then
        venue_running=true
    fi
    
    if [ -f "api_service.pid" ] && kill -0 $(cat api_service.pid) 2>/dev/null; then
        api_running=true
    fi
    
    if [ -f "web_server.pid" ] && kill -0 $(cat web_server.pid) 2>/dev/null; then
        web_running=true
    fi
    
    # Clear previous status line and show current status
    echo -ne "\r🔄 Status: "
    
    if $venue_running; then
        echo -ne "🤖✅ "
    else
        echo -ne "🤖❌ "
    fi
    
    if $api_running; then
        echo -ne "🔧✅ "
    else
        echo -ne "🔧❌ "
    fi
    
    if $web_running; then
        echo -ne "🌐✅ "
    else
        echo -ne "🌐❌ "
    fi
    
    echo -ne "$(date +'%H:%M:%S')  "
    
    # If any service died, restart it
    if ! $venue_running && [ -f "venue_discovery_service.pid" ]; then
        echo -ne "\n🔄 Restarting Venue Discovery Service..."
        start_service "Venue Discovery Service" "python3 venue_discovery_service.py" 8002 "logs/venue_discovery.log"
    fi
    
    if ! $api_running && [ -f "api_service.pid" ]; then
        echo -ne "\n🔄 Restarting API Service..."
        start_service "Main API Service" "python3 api_service.py" 5001 "logs/api_service.log"
    fi
    
    if ! $web_running && [ -f "web_server.pid" ]; then
        echo -ne "\n🔄 Restarting Web Server..."
        start_service "Web Server" "python3 server.py 8003" 8003 "logs/web_server.log"
    fi
done 