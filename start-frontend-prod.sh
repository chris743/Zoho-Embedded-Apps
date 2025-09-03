#!/bin/bash

# Simple Frontend Production Startup Script
# Just builds and serves the frontend

echo "🏗️  Building React app for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Starting production server on port 3000..."
    
    # Install serve if not available
    if ! command -v serve &> /dev/null; then
        echo "📦 Installing serve..."
        npm install -g serve
    fi
    
    # Start the production server in background with nohup
    nohup serve -s build -l 3000 > logs/frontend.log 2>&1 &
    echo $! > logs/frontend.pid
    
    echo "✅ Frontend started in background!"
    echo "📋 PID: $(cat logs/frontend.pid)"
    echo "📊 Logs: tail -f logs/frontend.log"
    echo "⏹️  Stop: kill $(cat logs/frontend.pid)"
else
    echo "❌ Build failed!"
    exit 1
fi
