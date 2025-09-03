#!/bin/bash

# Harvest Planner Production Build Startup Script
# This script builds and serves the production version

echo "🏗️  Building Harvest Planner for production..."

# Build the React app
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Starting production server..."
    
    # Check if serve is installed
    if command -v serve &> /dev/null; then
        echo "📱 Serving production build on port 3000..."
        serve -s build -l 3000
    else
        echo "❌ 'serve' not found. Installing..."
        npm install -g serve
        echo "📱 Serving production build on port 3000..."
        serve -s build -l 3000
    fi
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
