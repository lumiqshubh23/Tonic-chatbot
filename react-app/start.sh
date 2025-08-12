#!/bin/bash

echo "🚀 Starting TONIC AI Assistant..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start backend server
echo "🔧 Starting Flask backend server..."
cd server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in server directory."
    echo "   Please create a .env file with your API keys:"
    echo "   JWT_SECRET_KEY=your-secret-key"
    echo "   GEMINI_API_KEY=your-gemini-api-key"
    echo "   OPENAI_API_KEY=your-openai-api-key"
    echo "   PERPLEXITY_API_KEY=your-perplexity-api-key"
fi

# Start backend server in background
echo "🚀 Starting backend server on http://localhost:5000"
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Go back to root directory
cd ..

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Check if .env file exists for frontend
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "REACT_APP_NAME=TONIC AI Assistant" >> .env
fi

# Start frontend server
echo "🚀 Starting React frontend server on http://localhost:3000"
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 TONIC AI Assistant is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "👤 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
