#!/bin/bash

# Harvest Planner Production Deployment Script
# This script builds and deploys the production version

echo "🚀 Starting Harvest Planner Production Deployment..."
echo "=================================================="

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

# Start the backend
echo "🔧 Starting backend..."
pm2 start ecosystem.config.js --only harvest-planner-backend

# Start the production frontend
echo "📱 Starting production frontend..."
pm2 start ecosystem.config.js --only harvest-planner-frontend-prod

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "✅ Production deployment completed!"
echo "=================================="
echo "🌐 Frontend (Production): http://localhost:3001"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo ""
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart all"
echo "⏹️  Stop with: pm2 stop all"
