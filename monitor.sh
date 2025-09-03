#!/bin/bash

# Harvest Planner Monitoring Script
# Run this to check if your services are running

echo "🔍 Checking Harvest Planner Status..."
echo "=================================="

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "📊 PM2 Status:"
    pm2 status
    echo ""
    
    echo "📋 Recent Logs:"
    pm2 logs --lines 10
    echo ""
else
    echo "❌ PM2 not found. Please install PM2 first."
fi

# Check if ports are listening
echo "🌐 Port Status:"
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "✅ Frontend (port 3000): Running"
else
    echo "❌ Frontend (port 3000): Not running"
fi

if netstat -tlnp | grep :5000 > /dev/null; then
    echo "✅ Backend (port 5000): Running"
else
    echo "❌ Backend (port 5000): Not running"
fi

echo ""
echo "🔄 To restart services: pm2 restart all"
echo "📊 To view live logs: pm2 logs"
echo "⏹️  To stop services: pm2 stop all"
