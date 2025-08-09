# TONIC AI Assistant

A modern AI-powered chatbot application built with Streamlit that supports document processing, chat sessions, and data visualization.

## 🚀 Features

- **Document Processing**: Upload and process PDF, Excel, and CSV files
- **AI Chat**: Interactive chat with multiple AI models (Perplexity, OpenAI, Gemini)
- **Session Management**: Create and manage multiple chat sessions
- **Data Visualization**: Automatic plot generation for data analysis
- **Table Extraction**: Extract and download tables from AI responses
- **Persistent Login**: Stay logged in across browser sessions
- **Modern UI**: Clean, responsive design with custom styling

## 📁 Project Structure

```
my-project/
├── app.py                 # Main Streamlit application
├── utils.py              # Utility functions and helpers
├── api_handlers.py       # API integration functions
├── assets/
│   ├── styles.css        # Custom CSS styles
│   └── Images/           # Image assets
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-project
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv tonic_env
   source tonic_env/bin/activate  # On Windows: tonic_env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   ```

5. **Run the application**
   ```bash
   streamlit run app.py
   ```

## 🎨 Code Organization

### `app.py`
- Main Streamlit application
- UI components and layout
- User interaction handling
- Session management

### `utils.py`
- Utility functions for file processing
- Session state management
- Authentication helpers
- CSS and font loading

### `api_handlers.py`
- AI model integrations
- API response handling
- Chat prompt management
- Data extraction functions

### `assets/styles.css`
- Custom CSS styling
- Responsive design
- Streamlit component overrides
- Modern UI elements

## 🔧 Configuration

### User Credentials
Add user credentials to Streamlit secrets or use the fallback in `utils.py`:
```python
USERS = {
    "admin": "admin123",
    "demo": "demo123"
}
```

### API Keys
Ensure all required API keys are set in your `.env` file:
- `GEMINI_API_KEY`: Google Gemini API
- `OPENAI_API_KEY`: OpenAI API
- `PERPLEXITY_API_KEY`: Perplexity API

## 🎯 Usage

1. **Login**: Use the provided credentials to access the application
2. **Upload Documents**: Upload PDF, Excel, or CSV files for processing
3. **Chat**: Ask questions about your documents or general queries
4. **Sessions**: Create multiple chat sessions for different topics
5. **Visualizations**: Request charts and graphs for data analysis
6. **Export**: Download tables and chat history

## 🎨 Customization

### Styling
Modify `assets/styles.css` to customize the appearance:
- Colors and themes
- Layout and spacing
- Component styling
- Responsive design

### Functionality
- Add new AI models in `api_handlers.py`
- Extend file processing in `utils.py`
- Modify UI components in `app.py`

## 🔒 Security

- API keys are stored in environment variables
- User authentication with session management
- Persistent login with token validation
- Secure file processing

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
