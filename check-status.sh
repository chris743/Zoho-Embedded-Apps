#!/bin/bash

# Check Frontend Status

echo "🔍 Checking Harvest Planner Frontend Status..."
echo "============================================="

# Check if PID file exists
if [ -f logs/frontend.pid ]; then
    PID=$(cat logs/frontend.pid)
    echo "📋 PID: $PID"
    
    # Check if process is running
    if kill -0 $PID 2>/dev/null; then
        echo "✅ Frontend is running (PID: $PID)"
    else
        echo "❌ Frontend is not running (stale PID file)"
        rm -f logs/frontend.pid
    fi
else
    echo "❌ No PID file found"
fi

# Check if port 3000 is listening
echo ""
echo "🌐 Port Status:"
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "✅ Port 3000: Listening"
else
    echo "❌ Port 3000: Not listening"
fi

# Check recent logs
echo ""
echo "📋 Recent Logs (last 10 lines):"
if [ -f logs/frontend.log ]; then
    tail -10 logs/frontend.log
else
    echo "No log file found"
fi

echo ""
echo "🔄 To restart: ./start-frontend-prod.sh"
echo "⏹️  To stop: ./stop-frontend.sh"
echo "📊 To view live logs: tail -f logs/frontend.log"
