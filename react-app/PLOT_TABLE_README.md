# TONIC AI React App - Plot & Table Functionality

## 🎯 Overview

This React application provides a complete AI chat interface with advanced **plot generation** and **table extraction** capabilities, similar to the Streamlit version but with a modern web interface.

## ✨ Key Features

### 📊 Plot Generation
- **Automatic Detection**: Plots are generated when users ask for visualizations or when data is detected in responses
- **Multiple Chart Types**: Bar charts, line charts, pie charts, scatter plots, and more
- **High-Quality Output**: 300 DPI PNG images with proper styling
- **Download Functionality**: Users can download plots as PNG files
- **Smart Triggers**: Plots are generated for:
  - Explicit requests: "show me a graph", "create a chart", "visualize this data"
  - Data detection: responses containing numbers, statistics, trends, comparisons

### 📋 Table Extraction
- **Markdown Tables**: Automatically extracts tables formatted with `|` symbols
- **Pattern Recognition**: Detects structured data like key-value pairs
- **Interactive Display**: Tables are displayed in expandable containers
- **CSV Export**: Users can download tables as CSV files
- **Multiple Tables**: Supports multiple tables per response

### 🔄 Real-time Processing
- **Live Generation**: Plots and tables are generated in real-time
- **Session Persistence**: Visualizations persist across chat sessions
- **Error Handling**: Graceful fallbacks when generation fails

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Run the installation script
./install_dependencies.sh

# Or install manually:
cd server && pip install -r requirements.txt
cd .. && npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### 3. Start the Application
```bash
# Terminal 1: Start the Python server
cd server && python app.py

# Terminal 2: Start the React app
npm start
```

## 🏗️ Architecture

### Backend (Python/Flask)
- **Plot Generation**: Uses matplotlib to create visualizations
- **Table Extraction**: Parses markdown tables and structured data
- **AI Integration**: Perplexity API for responses, OpenAI for plot code generation
- **File Processing**: PDF, Excel, and CSV document processing

### Frontend (React)
- **Chat Interface**: Real-time messaging with AI
- **File Upload**: Drag-and-drop document upload
- **Visualization Display**: Interactive plot and table rendering
- **Download Features**: PNG and CSV export functionality

## 📁 File Structure

```
react-app/
├── src/
│   ├── components/
│   │   ├── ChatInterface.js     # Main chat interface
│   │   ├── ChatMessage.js       # Message display with plots/tables
│   │   └── FileUpload.js        # Document upload component
│   ├── services/
│   │   └── api.js              # API communication
│   └── ...
├── server/
│   ├── app.py                  # Flask backend with plot/table logic
│   └── requirements.txt        # Python dependencies
└── ...
```

## 🎨 Usage Examples

### Generating Plots
```
User: "Show me a bar chart of sales data"
AI: [Generates response with embedded plot]
UI: Displays interactive bar chart with download option
```

### Extracting Tables
```
User: "Create a table of monthly expenses"
AI: [Generates response with markdown table]
UI: Displays formatted table with CSV download
```

### File Upload + Analysis
```
1. Upload PDF/Excel/CSV files
2. Ask questions about the data
3. Get responses with plots and tables
4. Download visualizations and data
```

## 🔧 Configuration

### Plot Generation Settings
The backend automatically detects when to generate plots based on:
- **Keywords**: graph, plot, chart, visual, visualize, show me, display
- **Data Indicators**: data, numbers, statistics, percentage, trend, comparison
- **User Intent**: Questions about trends, comparisons, or visualizations

### Table Extraction Settings
Tables are extracted from:
- **Markdown Format**: `| Column 1 | Column 2 |`
- **Pattern Matching**: Key-value pairs and structured data
- **Response Analysis**: Automatic detection of tabular data

## 🎯 Advanced Features

### Plot Customization
- **Chart Types**: Automatically selects appropriate chart types
- **Styling**: Professional styling with proper labels and legends
- **Responsive**: Plots adapt to different screen sizes
- **Error Recovery**: Multiple attempts if generation fails

### Table Features
- **Sorting**: Click column headers to sort data
- **Search**: Filter table contents
- **Export**: Download as CSV with proper formatting
- **Responsive**: Tables adapt to mobile devices

## 🐛 Troubleshooting

### Common Issues

1. **Plots Not Generating**
   - Check OpenAI API key configuration
   - Verify matplotlib installation
   - Check server logs for errors

2. **Tables Not Extracting**
   - Ensure AI responses contain proper markdown formatting
   - Check for special characters in table data
   - Verify response parsing logic

3. **File Upload Issues**
   - Check file format support (PDF, Excel, CSV)
   - Verify file size limits
   - Check server storage permissions

### Debug Mode
Enable debug logging in the server:
```python
# In server/app.py
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 API Endpoints

### Chat Endpoint
```
POST /api/chat
{
  "question": "string",
  "knowledge_base": "string",
  "conversation_history": []
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response text",
  "tables": [
    {
      "headers": ["Column1", "Column2"],
      "data": [["row1", "data1"], ["row2", "data2"]]
    }
  ],
  "plot": {
    "code": "matplotlib code",
    "image": "base64_encoded_png",
    "type": "matplotlib"
  }
}
```

## 🎨 Customization

### Styling
- Modify styled-components in `ChatMessage.js` for visual customization
- Update color schemes and layouts
- Customize plot styling in the backend

### Functionality
- Add new chart types in `generate_plot_code()`
- Extend table extraction patterns
- Implement additional export formats

## 📈 Performance

### Optimization Tips
- **Caching**: Plots and tables are cached per session
- **Lazy Loading**: Visualizations load on demand
- **Compression**: Images are optimized for web delivery
- **Error Boundaries**: Graceful handling of generation failures

## 🔒 Security

### Best Practices
- **API Key Protection**: Store keys in environment variables
- **Input Validation**: Sanitize user inputs
- **File Upload Security**: Validate file types and sizes
- **CORS Configuration**: Proper cross-origin settings

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Configure production API keys
2. **Static Files**: Build React app with `npm run build`
3. **Server Configuration**: Use production WSGI server
4. **SSL**: Enable HTTPS for secure communication

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Verify API key configurations
4. Test with simple examples first

## 🎉 Success Stories

This implementation provides:
- ✅ **Real-time plot generation** from natural language
- ✅ **Automatic table extraction** from AI responses
- ✅ **Professional UI/UX** with modern design
- ✅ **Robust error handling** and fallbacks
- ✅ **Download functionality** for all visualizations
- ✅ **Session persistence** across interactions

The React app now matches the functionality of your Streamlit version with enhanced user experience and modern web interface!
