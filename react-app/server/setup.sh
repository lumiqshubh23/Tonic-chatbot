#!/bin/bash

# TONIC AI Backend Setup Script
# This script sets up the Flask backend with PostgreSQL database

echo "🚀 TONIC AI Backend Setup"
echo "=========================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! python3 -c "import psycopg2; psycopg2.connect(host='localhost', port=5432, user='admin', password='password')" 2>/dev/null; then
    echo "❌ Cannot connect to PostgreSQL. Please ensure:"
    echo "   1. PostgreSQL is installed and running"
    echo "   2. Database credentials are correct:"
    echo "      - Host: localhost"
    echo "      - Port: 5432"
    echo "      - Database: my_new_db"
    echo "      - Username: admin"
    echo "      - Password: password"
    echo "   3. The 'admin' user has proper permissions"
    exit 1
fi

echo "✅ PostgreSQL connection successful"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Initialize database
echo "🗄️  Initializing database..."
python3 init_db.py

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Failed to initialize database"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the server: python3 app.py"
echo "2. Test the APIs: python3 test_apis.py"
echo "3. Access the application at: http://localhost:5000"
echo ""
echo "Default login credentials:"
echo "  Username: admin@123"
echo "  Password: admin123"
echo ""
echo "Happy coding! 🚀"
