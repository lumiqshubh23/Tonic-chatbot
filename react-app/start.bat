@echo off
echo 🚀 Starting TONIC AI Assistant...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start backend server
echo 🔧 Starting Flask backend server...
cd server

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install backend dependencies
echo 📥 Installing backend dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found in server directory.
    echo    Please create a .env file with your API keys:
    echo    JWT_SECRET_KEY=your-secret-key
    echo    GEMINI_API_KEY=your-gemini-api-key
    echo    OPENAI_API_KEY=your-openai-api-key
    echo    PERPLEXITY_API_KEY=your-perplexity-api-key
)

REM Start backend server in background
echo 🚀 Starting backend server on http://localhost:5000
start "Backend Server" python app.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Go back to root directory
cd ..

REM Install frontend dependencies
echo 📥 Installing frontend dependencies...
npm install

REM Check if .env file exists for frontend
if not exist ".env" (
    echo 📝 Creating frontend .env file...
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo REACT_APP_NAME=TONIC AI Assistant >> .env
)

REM Start frontend server
echo 🚀 Starting React frontend server on http://localhost:3000
start "Frontend Server" npm start

echo.
echo 🎉 TONIC AI Assistant is starting up!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo.
echo 👤 Default login credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo Press any key to close this window...
pause >nul
