#!/bin/bash

# Harvest Planner Frontend Production Deployment Script
# This script builds and deploys the frontend production version

echo "🚀 Starting Harvest Planner Frontend Production Deployment..."
echo "============================================================="

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing PM2 processes
echo "🔄 Stopping existing services..."
pm2 delete all 2>/dev/null || true

# Install serve globally if not already installed
echo "📦 Checking for serve package..."
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve package..."
    npm install -g serve
fi

# Build the React application
echo "🏗️  Building React application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"

# Start the production frontend
echo "📱 Starting production frontend..."
pm2 start ecosystem.config.js --only harvest-planner-frontend-prod

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "✅ Frontend production deployment completed!"
echo "============================================"
echo "🌐 Frontend (Production): http://localhost:3000"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart harvest-planner-frontend-prod"
echo "⏹️  Stop with: pm2 stop harvest-planner-frontend-prod"
