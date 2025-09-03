#!/bin/bash

# Harvest Planner Production Startup Script
# Run this on your Ubuntu VM to start the application

echo "🚀 Starting Harvest Planner Production Environment..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start the frontend with PM2
echo "📱 Starting frontend..."
pm2 start ecosystem.config.js --only harvest-planner-frontend

# Start the backend with PM2
echo "🔧 Starting backend..."
pm2 start ecosystem.config.js --only harvest-planner-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Harvest Planner is now running!"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart all"
echo "⏹️  Stop with: pm2 stop all"
