@echo off
REM TONIC AI Assistant - React Edition Deployment Script (Windows)
REM This script automates the setup and deployment process

echo 🚀 TONIC AI Assistant - React Edition Deployment
echo ================================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is installed

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Python is installed

REM Install React dependencies
echo [INFO] Installing React dependencies...
if not exist "node_modules" (
    npm install
    echo [SUCCESS] React dependencies installed
) else (
    echo [WARNING] node_modules already exists, skipping npm install
)

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt
pip install -r server\requirements.txt
echo [SUCCESS] Python dependencies installed

REM Check environment variables
echo [INFO] Checking environment variables...
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    if exist "env.example" (
        copy env.example .env
        echo [WARNING] Please edit .env file and add your API keys:
        echo [WARNING]   - OPENAI_API_KEY
        echo [WARNING]   - GEMINI_API_KEY
        echo [WARNING]   - PERPLEXITY_API_KEY
    ) else (
        echo [ERROR] env.example file not found
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] .env file exists
)

REM Build React app
echo [INFO] Building React application...
npm run build
echo [SUCCESS] React app built successfully

REM Start backend server
echo [INFO] Starting Flask backend server...
start /B python server\app.py

REM Wait for backend to start
echo [INFO] Waiting for backend server to start...
timeout /t 5 /nobreak >nul

REM Start Streamlit app
echo [INFO] Starting Streamlit application...
echo.
echo [SUCCESS] Deployment completed successfully!
echo.
echo [INFO] Access your application at:
echo [INFO]   - Streamlit App: http://localhost:8501
echo [INFO]   - Backend API: http://localhost:5000
echo.
echo [INFO] Press Ctrl+C to stop the application
echo.

streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0

pause
