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
    
    # Start the production server
    serve -s build -l 3000
else
    echo "❌ Build failed!"
    exit 1
fi
