# TONIC AI - Frontend & API Integration

This project integrates a React frontend with a Flask API backend, providing a complete AI-powered document analysis and chat application.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│   React App     │ ◄─────────────► │   Flask API     │
│  (Frontend)     │                 │   (Backend)     │
│                 │                 │                 │
│ - Login UI      │                 │ - Authentication│
│ - Chat Interface│                 │ - File Upload   │
│ - File Upload   │                 │ - AI Processing │
│ - Session Mgmt  │                 │ - Plot Generation│
└─────────────────┘                 └─────────────────┘
        │                                    │
        │                                    │
        ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│   LocalStorage  │                 │   AI Services   │
│ - JWT Tokens    │                 │ - Perplexity AI │
│ - User Sessions │                 │ - Gemini AI     │
│ - Knowledge Base│                 │ - OpenAI GPT-4  │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <your-repo>
cd my-project
```

### 2. Run the Application
```bash
./start_app.sh
```

This script will:
- Create a Python virtual environment
- Install all dependencies
- Create a `.env` template (if not exists)
- Start both the Flask API server and React development server

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000

## 🔧 Configuration

### Environment Variables (.env)
Create a `.env` file in the root directory:

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Flask Secret Key
SECRET_KEY=your-secret-key-here

# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### Default Users
The application comes with these default users:
- Username: `admin`, Password: `admin123`
- Username: `demo`, Password: `demo123`
- Username: `user`, Password: `password123`

## 📁 Project Structure

```
my-project/
├── api_server.py              # Main Flask API server
├── api_requirements.txt       # Python dependencies
├── start_app.sh              # Startup script
├── .env                      # Environment variables
├── react-app/                # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   ├── contexts/         # React contexts
│   │   └── App.js           # Main app component
│   ├── package.json         # Node.js dependencies
│   └── public/              # Static assets
└── README.md                # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login with JWT token
- `POST /api/logout` - User logout

### File Management
- `POST /api/upload` - Upload and process documents (PDF, Excel, CSV)

### Chat & AI
- `POST /api/chat` - Send messages and get AI responses
- `GET /api/sessions` - Get user chat sessions
- `POST /api/sessions` - Create new chat session
- `DELETE /api/sessions/<name>` - Delete chat session
- `POST /api/sessions/<name>/clear` - Clear session messages

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication Flow

1. **Login**: User submits credentials → API validates → Returns JWT token
2. **Token Storage**: Frontend stores JWT in localStorage
3. **API Requests**: Frontend includes JWT in Authorization header
4. **Token Validation**: API validates JWT for protected endpoints
5. **Logout**: Frontend clears localStorage, API invalidates token

## 📊 Features

### Frontend (React)
- ✅ Modern, responsive UI with styled-components
- ✅ JWT-based authentication
- ✅ Real-time chat interface
- ✅ File upload with drag & drop
- ✅ Session management
- ✅ Plot visualization
- ✅ Table display and export
- ✅ Toast notifications

### Backend (Flask)
- ✅ RESTful API with CORS support
- ✅ JWT authentication
- ✅ File processing (PDF, Excel, CSV)
- ✅ AI integration (Perplexity, Gemini, OpenAI)
- ✅ Plot generation with matplotlib
- ✅ Session management
- ✅ Error handling and logging

## 🔄 Data Flow

### 1. File Upload Process
```
User Uploads File → React Frontend → Flask API → AI Processing → Knowledge Base
```

### 2. Chat Process
```
User Message → React Frontend → Flask API → AI Services → Response + Plots/Tables → Frontend Display
```

### 3. Session Management
```
User Actions → React Frontend → Flask API → Session Storage → UI Updates
```

## 🛠️ Development

### Running Components Separately

#### Flask API Server
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r api_requirements.txt

# Run server
python api_server.py
```

#### React Frontend
```bash
cd react-app
npm install
npm start
```

### API Testing
Test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Upload files (with JWT token)
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@document.pdf"
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the Flask API is running on port 5000
   - Check that CORS is properly configured in `api_server.py`

2. **JWT Token Issues**
   - Clear localStorage and re-login
   - Check that the SECRET_KEY is set in `.env`

3. **File Upload Failures**
   - Verify file format (PDF, Excel, CSV)
   - Check file size limits
   - Ensure API keys are configured

4. **AI Service Errors**
   - Verify API keys in `.env`
   - Check internet connectivity
   - Review API service quotas

### Debug Mode
Enable debug mode by setting `FLASK_DEBUG=True` in `.env` for detailed error messages.

## 🚀 Deployment

### Production Setup
1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server (Gunicorn)
3. Configure a reverse proxy (Nginx)
4. Set up HTTPS certificates
5. Use a production database for sessions

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "api_server.py"]
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Coding! 🚀**
