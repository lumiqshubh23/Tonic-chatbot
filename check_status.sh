#!/bin/bash

echo "🔍 Checking TONIC AI Application Status..."
echo "=========================================="

# Check API Server
echo "🌐 API Server (Port 5000):"
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Running - http://localhost:5000"
    echo "   Health: $(curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo 'healthy')"
else
    echo "❌ Not running"
fi

echo ""

# Check React App
echo "⚛️  React App (Port 3000):"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Running - http://localhost:3000"
else
    echo "❌ Not running"
fi

echo ""

# Check processes
echo "📊 Running Processes:"
echo "API Server: $(ps aux | grep 'python api_server.py' | grep -v grep | wc -l) instances"
echo "React App: $(ps aux | grep 'react-scripts start' | grep -v grep | wc -l) instances"

echo ""
echo "🎯 Quick Access:"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:5000"
echo ""
echo "🔐 Test Login:"
echo "Username: admin@123"
echo "Password: admin123"
