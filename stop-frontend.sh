#!/bin/bash

# Stop Frontend Production Server

echo "⏹️  Stopping Harvest Planner Frontend..."

# Check if PID file exists
if [ -f logs/frontend.pid ]; then
    PID=$(cat logs/frontend.pid)
    echo "📋 Stopping process PID: $PID"
    
    # Kill the process
    kill $PID 2>/dev/null
    
    # Wait a moment and force kill if still running
    sleep 2
    if kill -0 $PID 2>/dev/null; then
        echo "🔨 Force killing process..."
        kill -9 $PID 2>/dev/null
    fi
    
    # Remove PID file
    rm -f logs/frontend.pid
    echo "✅ Frontend stopped successfully!"
else
    echo "❌ No PID file found. Process may not be running."
    
    # Try to kill any serve processes
    pkill -f "serve -s build" 2>/dev/null
    echo "🔍 Killed any running serve processes."
fi
