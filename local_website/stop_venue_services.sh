#!/bin/bash

# Stop Venue Discovery Services
# This script stops all venue discovery services cleanly

echo "🛑 Stopping BID AI Venue Discovery Services..."
echo "================================================================"

# Function to stop service
stop_service() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat $pid_file)
        echo "🔄 Stopping $name (PID: $pid)..."
        
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            sleep 2
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                echo "   ⚠️  Force killing $name..."
                kill -9 $pid 2>/dev/null
            fi
            
            echo "   ✅ $name stopped"
        else
            echo "   ⚠️  $name was not running"
        fi
        
        rm $pid_file
    else
        echo "   ℹ️  $name PID file not found"
    fi
}

# Stop all services
stop_service "Venue Discovery Service" "venue_discovery_service.pid"
stop_service "Main API Service" "api_service.pid"
stop_service "Web Server" "web_server.pid"

# Clean up any remaining processes
echo ""
echo "🧹 Cleaning up any remaining processes..."

# Kill any remaining Python processes that might be our services
pkill -f "venue_discovery_service.py" 2>/dev/null && echo "   ✅ Killed remaining venue discovery processes"
pkill -f "api_service.py" 2>/dev/null && echo "   ✅ Killed remaining API service processes"
pkill -f "server.py 8003" 2>/dev/null && echo "   ✅ Killed remaining web server processes"

# Clean up log files if requested
read -p "🗑️  Delete log files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf logs
    echo "   ✅ Log files deleted"
else
    echo "   ℹ️  Log files preserved in logs/ directory"
fi

echo ""
echo "================================================================"
echo "✅ All venue discovery services stopped successfully!"
echo ""
echo "💡 To start services again, run: ./start_venue_services.sh"
echo "================================================================" 