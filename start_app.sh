#!/bin/bash

echo "🚀 Starting TONIC AI Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r api_requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Flask Secret Key
SECRET_KEY=your-secret-key-here

# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
EOF
    echo "📝 Please edit .env file with your API keys before running the application."
fi

# Install React dependencies
echo "📦 Installing React dependencies..."
cd react-app
npm install
cd ..

# Start API server in background
echo "🌐 Starting Flask API server..."
python api_server.py &
API_PID=$!

# Wait a moment for API server to start
sleep 3

# Start React development server
echo "⚛️  Starting React development server..."
cd react-app
npm start &
REACT_PID=$!
cd ..

echo "✅ Application started successfully!"
echo "📱 React app: http://localhost:3000"
echo "🌐 API server: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    deactivate
    echo "✅ Servers stopped. Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
