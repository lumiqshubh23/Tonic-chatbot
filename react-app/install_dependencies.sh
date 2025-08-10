#!/bin/bash

echo "🚀 Installing TONIC AI React App Dependencies..."

# Install Python dependencies for the server
echo "📦 Installing Python dependencies..."
cd server
pip install -r requirements.txt
cd ..

# Install Node.js dependencies for the React app
echo "📦 Installing Node.js dependencies..."
npm install

# Install additional packages for enhanced functionality
echo "📦 Installing additional packages..."
npm install react-markdown styled-components lucide-react react-hot-toast axios

echo "✅ Installation complete!"
echo ""
echo "🎯 To start the application:"
echo "1. Start the Python server: cd server && python app.py"
echo "2. Start the React app: npm start"
echo ""
echo "📝 Make sure to set up your environment variables in .env file:"
echo "- REACT_APP_API_URL=http://localhost:5000/api"
echo "- GEMINI_API_KEY=your_gemini_api_key"
echo "- OPENAI_API_KEY=your_openai_api_key"
echo "- PERPLEXITY_API_KEY=your_perplexity_api_key"
