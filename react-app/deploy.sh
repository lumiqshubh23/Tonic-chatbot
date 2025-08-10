#!/bin/bash

# TONIC AI Assistant - React Edition Deployment Script
# This script automates the setup and deployment process

set -e  # Exit on any error

echo "🚀 TONIC AI Assistant - React Edition Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    print_success "Python $PYTHON_VERSION is installed"
}

# Install React dependencies
install_react_deps() {
    print_status "Installing React dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "React dependencies installed"
    else
        print_warning "node_modules already exists, skipping npm install"
    fi
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    pip3 install -r requirements.txt
    pip3 install -r server/requirements.txt
    print_success "Python dependencies installed"
}

# Build React app
build_react_app() {
    print_status "Building React application..."
    npm run build
    print_success "React app built successfully"
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "env.example" ]; then
            cp env.example .env
            print_warning "Please edit .env file and add your API keys:"
            print_warning "  - OPENAI_API_KEY"
            print_warning "  - GEMINI_API_KEY"
            print_warning "  - PERPLEXITY_API_KEY"
        else
            print_error "env.example file not found"
            exit 1
        fi
    else
        print_success ".env file exists"
    fi
}

# Start backend server
start_backend() {
    print_status "Starting Flask backend server..."
    cd server
    python3 app.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health > /dev/null; then
            print_success "Backend server started successfully"
            return 0
        fi
        sleep 1
    done
    
    print_error "Backend server failed to start"
    exit 1
}

# Start Streamlit app
start_streamlit() {
    print_status "Starting Streamlit application..."
    streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main deployment process
main() {
    echo ""
    print_status "Starting deployment process..."
    
    # Check prerequisites
    check_nodejs
    check_python
    
    # Install dependencies
    install_react_deps
    install_python_deps
    
    # Check environment
    check_env
    
    # Build React app
    build_react_app
    
    # Start backend server
    start_backend
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Access your application at:"
    print_status "  - Streamlit App: http://localhost:8501"
    print_status "  - Backend API: http://localhost:5000"
    echo ""
    print_status "Press Ctrl+C to stop the application"
    echo ""
    
    # Start Streamlit
    start_streamlit
}

# Run main function
main "$@"
