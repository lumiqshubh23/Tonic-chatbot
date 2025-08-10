# TONIC AI Assistant - React Edition

A modern React-based AI assistant with the same functionality as the original Streamlit app, featuring document processing, AI chat, and data visualization capabilities.

## Features

- 🔐 **Authentication System** - Secure login with persistent sessions
- 📁 **File Upload** - Support for PDF, Excel, and CSV files
- 🤖 **AI Chat Interface** - Powered by Perplexity API
- 📊 **Data Visualization** - Automatic plot generation using matplotlib
- 📋 **Table Extraction** - Extract and display tables from AI responses
- 💬 **Session Management** - Multiple chat sessions with history
- 📥 **Export Functionality** - Download tables as CSV and plots as images
- 🎨 **Modern UI** - Beautiful, responsive design with styled-components

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Styled Components** - CSS-in-JS styling
- **React Dropzone** - File upload with drag & drop
- **React Markdown** - Markdown rendering
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyMuPDF** - PDF processing
- **Pandas** - Excel/CSV processing
- **OpenAI API** - GPT-4 for plot generation
- **Google Gemini** - Document processing
- **Perplexity API** - AI chat responses

### Deployment
- **Streamlit** - Web app deployment
- **Node.js** - React build process

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-app
   ```

2. **Install React dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r server/requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```

### Development

1. **Start the Flask backend server**
   ```bash
   cd server
   python app.py
   ```

2. **Start the React development server**
   ```bash
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Build

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Start the Flask server**
   ```bash
   cd server
   python app.py
   ```

3. **Serve the built app**
   The built files will be in the `build/` directory

## Deployment on Streamlit

### Method 1: Direct Streamlit Deployment

1. **Install Streamlit**
   ```bash
   pip install streamlit
   ```

2. **Run the Streamlit app**
   ```bash
   streamlit run streamlit_app.py
   ```

3. **Access the app**
   Navigate to the URL provided by Streamlit (usually `http://localhost:8501`)

### Method 2: Streamlit Cloud Deployment

1. **Push your code to GitHub**

2. **Deploy on Streamlit Cloud**
   - Go to [share.streamlit.io](https://share.streamlit.io)
   - Connect your GitHub repository
   - Set the main file path to `streamlit_app.py`
   - Add your environment variables in the Streamlit Cloud dashboard

3. **Configure environment variables**
   Add these secrets in Streamlit Cloud:
   ```
   OPENAI_API_KEY = your_openai_api_key
   GEMINI_API_KEY = your_gemini_api_key
   PERPLEXITY_API_KEY = your_perplexity_api_key
   ```

## API Endpoints

### Authentication
- `POST /api/login` - User login

### File Processing
- `POST /api/upload` - Upload and process files

### Chat
- `POST /api/chat` - Send chat message and get AI response

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
react-app/
├── public/                 # Static files
├── src/
│   ├── components/         # React components
│   │   ├── Login.js       # Login page
│   │   ├── Dashboard.js   # Main dashboard
│   │   ├── Sidebar.js     # Navigation sidebar
│   │   ├── ChatInterface.js # Chat functionality
│   │   ├── FileUpload.js  # File upload component
│   │   └── ChatMessage.js # Message display
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication context
│   ├── services/          # API services
│   │   └── api.js        # API client
│   ├── App.js            # Main app component
│   └── index.js          # App entry point
├── server/               # Flask backend
│   ├── app.py           # Main server file
│   └── requirements.txt # Backend dependencies
├── streamlit_app.py     # Streamlit deployment
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## Usage

### Login
- Use the provided credentials:
  - Username: `admin`, Password: `admin123`
  - Username: `demo`, Password: `demo123`

### File Upload
1. Drag and drop files or click to select
2. Supported formats: PDF, Excel (.xlsx, .xls), CSV
3. Files are processed and added to the knowledge base

### Chat
1. Type your question in the chat input
2. The AI will respond using the uploaded documents and its knowledge
3. Tables in responses are automatically extracted and displayed
4. Charts are generated for visualization requests

### Sessions
- Create multiple chat sessions
- Switch between sessions
- Export chat history
- Clear session data

## Customization

### Styling
- Modify styled-components in each component
- Update colors in `src/index.css`
- Change the theme in `src/contexts/AuthContext.js`

### API Integration
- Update API endpoints in `src/services/api.js`
- Modify backend logic in `server/app.py`
- Add new AI providers in the backend

### Features
- Add new file types in `server/app.py`
- Implement new visualization types
- Add user management features

## Troubleshooting

### Common Issues

1. **Backend server not starting**
   - Check if port 5000 is available
   - Verify API keys are set correctly
   - Check Python dependencies

2. **React app not building**
   - Ensure Node.js version is 16+
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

3. **File upload failing**
   - Check file size limits
   - Verify file format support
   - Check backend server status

4. **AI responses not working**
   - Verify API keys are valid
   - Check API rate limits
   - Review backend logs

### Logs
- Backend logs: Check terminal running Flask server
- Frontend logs: Check browser developer console
- Streamlit logs: Check Streamlit output

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This React version maintains full compatibility with the original Streamlit app while providing a modern, responsive user interface.
