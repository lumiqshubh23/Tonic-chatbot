from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import fitz  # PyMuPDF
import pandas as pd
import requests
import openai
import google.generativeai as genai
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import io
import base64
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
     supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TONIC AI Server")

# Configure API clients
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
except KeyError as e:
    logger.error(f"API key not found: {e}")

# Mock user credentials (replace with database in production)
USERS = {
    "admin": "admin123",
    "demo": "demo123"
}

def process_pdf(file_content, filename):
    """Extract text from PDF file"""
    try:
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        return ""

def process_excel(file_content, filename):
    """Extract text from Excel file"""
    try:
        excel_data = pd.read_excel(file_content, sheet_name=None)
        text = ""
        for sheet, df in excel_data.items():
            text += f"\n--- Sheet: {sheet} ---\n{df.to_string(index=False)}"
        return text
    except Exception as e:
        logger.error(f"Excel processing error: {e}")
        return ""

def process_csv(file_content, filename):
    """Extract text from CSV file"""
    try:
        df = pd.read_csv(file_content)
        return df.to_string(index=False)
    except Exception as e:
        logger.error(f"CSV processing error: {e}")
        return ""

def extract_structured_info(text, filename):
    """Extract structured information using Gemini"""
    base_prompt = """Extract structured information from this document for building a knowledge base.
    
    IMPORTANT: When presenting tabular data, please format it as a proper markdown table using | symbols.
    
    Document content: """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        text_chunk = text[:30000]  # Limit text to prevent token limit issues
        gemini_response = model.generate_content(base_prompt + text_chunk)
        structured_output = gemini_response.text
        logger.info(f"Extracted structured data from {filename}")
        return structured_output
    except Exception as e:
        logger.error(f"Gemini failed on {filename}: {e}")
        return ""

def get_perplexity_response(prompt, conversation_history=None):
    """Get response from Perplexity API"""
    try:
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        messages = []
        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["q"]})
                messages.append({"role": "assistant", "content": turn["a"]})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": "sonar",
            "messages": messages,
            "temperature": 0.7,
            "stream": False
        }

        response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload)

        if response.ok:
            citations = ""
            for j in response.json().get("search_results", []):
                tmp_c = j.get('title', '') + " - " + j.get('url', '')
                citations = citations + tmp_c + " \n "
            
            return response.json()["choices"][0]["message"]["content"], citations
        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return f"❌ Perplexity error: {response.status_code}: {response.text}", ""

    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"❌ Perplexity error: {e}", ""

def generate_plot_code(knowledge, query, reply):
    """Generate matplotlib code for visualization"""
    system_prompt = """You are a Python assistant specialized in data visualization. 
    Generate ONLY valid matplotlib code that creates meaningful visualizations.
    
    IMPORTANT RULES:
    1. Output ONLY the Python code, no explanations
    2. Use matplotlib.pyplot as plt
    3. Use pandas as pd if needed
    4. Create clear, readable visualizations
    5. If no data is available, create sample data for demonstration
    6. Always set proper titles, labels, and legends
    7. Use appropriate chart types (bar, line, pie, scatter, etc.)
    8. Make sure the code runs without errors"""
    
    user_prompt = f"""Knowledge Base:\n{knowledge}\n\nUser Query:\n{query}\n\nAnswer:\n{reply}"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Code generation failed: {e}")
        return None

def execute_plot_code(plot_code):
    """Execute matplotlib code and return base64 encoded image"""
    try:
        # Clear any existing plots
        plt.clf()
        
        # Create execution environment
        exec_globals = {
            "plt": plt, 
            "pd": pd, 
            "__name__": "__main__",
            "np": __import__('numpy')
        }
        
        # Remove plt.show() calls as we want to capture the plot
        plot_code = re.sub(r"plt\.show\(\)", "", plot_code)
        
        # Execute the code
        exec(plot_code, exec_globals)
        
        # Get the current figure
        fig = plt.gcf()
        
        # Save to bytes buffer
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=300, bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        
        # Close the figure to free memory
        plt.close(fig)
        
        return img_base64
        
    except Exception as e:
        logger.error(f"Plot execution failed: {e}")
        return None

def extract_tables_from_response(response_text):
    """Extract tables from response text"""
    tables = []
    
    # Check for markdown tables
    if "|" in response_text:
        try:
            lines = response_text.split('\n')
            table_blocks = []
            current_block = []

            for line in lines:
                if '|' in line and line.strip():
                    current_block.append(line.strip())
                elif current_block:
                    table_blocks.append(current_block)
                    current_block = []

            if current_block:
                table_blocks.append(current_block)

            for block in table_blocks:
                if len(block) >= 2:
                    # Remove separator lines (lines with only dashes and pipes)
                    if re.match(r'\s*\|?\s*-+\s*\|', block[1]):
                        block.pop(1)

                    headers = [col.strip() for col in block[0].split('|') if col.strip()]
                    data_rows = []
                    for row in block[1:]:
                        cols = [col.strip() for col in row.split('|') if col.strip()]
                        if len(cols) == len(headers):
                            data_rows.append(cols)

                    if data_rows:
                        tables.append({
                            'headers': headers,
                            'data': data_rows
                        })

        except Exception as e:
            logger.error(f"Markdown table extraction error: {e}")

    # Also try to extract structured data that might not be in markdown format
    try:
        # Look for patterns that might indicate tabular data
        data_patterns = [
            r'(\w+):\s*(\d+\.?\d*)',  # Key: value patterns
            r'(\w+)\s+(\d+\.?\d*)',   # Word followed by number
        ]
        
        for pattern in data_patterns:
            matches = re.findall(pattern, response_text)
            if len(matches) >= 2:  # At least 2 data points to make a table
                tables.append({
                    'headers': ['Category', 'Value'],
                    'data': matches
                })
                break
                
    except Exception as e:
        logger.error(f"Pattern-based table extraction error: {e}")

    return tables

def get_chat_prompt():
    """Get the base chat prompt for the AI assistant"""
    return (
        "You are an intelligent assistant. Use the extracted knowledge base if it's available to answer user queries. "
        "In addition, rely on your own knowledge whenever needed, based on the user's input. "
        "If the answer cannot be found in the knowledge base, use your general understanding to respond.\n\n"

        "IMPORTANT FORMATTING:\n"
        "- When presenting tabular data, format it as markdown tables using `|` symbols.\n"
        "- Example:\n"
        "  | Column 1 | Column 2 |\n"
        "  |----------|----------|\n"
        "  | Data 1   | Data 2   |\n\n"

        "**POINTS TO KEEP IN MIND:**\n"
        "- If the user requests Excel-like output, assume tabular format and provide markdown directly.\n"
        "- If the user requests graphs, plots, or charts, do not generate them. "
        "A separate module in the system handles visualizations.\n"
        "- If relevant information isn't found in the knowledge base, use your own understanding to answer accurately.\n"
        "- Always consider the user input carefully. Combine it with the knowledge base and your knowledge to generate accurate and context-aware responses.\n"
        "- Maintain conversational context by referring to previous user queries where appropriate.\n\n"
    )

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if username in USERS and USERS[username] == password:
            return jsonify({
                'success': True,
                'user': username,
                'message': 'Login successful'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Login failed'
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and processing"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        extracted_text = ""
        
        for file in files:
            if file.filename:
                file_content = file.read()
                
                if file.filename.lower().endswith('.pdf'):
                    text = process_pdf(file_content, file.filename)
                elif file.filename.lower().endswith(('.xlsx', '.xls')):
                    text = process_excel(file_content, file.filename)
                elif file.filename.lower().endswith('.csv'):
                    text = process_csv(file_content, file.filename)
                else:
                    continue
                
                if text:
                    structured_output = extract_structured_info(text, file.filename)
                    if structured_output:
                        extracted_text += f"\n\n--- Extracted from {file.filename} ---\n\n{structured_output}"
        
        return jsonify({
            'success': True,
            'knowledge_base': extracted_text,
            'message': f'Successfully processed {len(files)} file(s)'
        })
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        return jsonify({'error': 'File processing failed'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat requests"""
    try:
        data = request.get_json()
        question = data.get('question')
        knowledge_base = data.get('knowledge_base', '')
        conversation_history = data.get('conversation_history', [])
        
        if not question:
            return jsonify({'error': 'No question provided'}), 400
        
        base_chat_prompt = get_chat_prompt()
        full_prompt = (
            f"{base_chat_prompt}\n\n"
            f"Knowledge Base:\n{knowledge_base}\n\n"
            f"Current Question:\n{question}"
        )
        
        response, sources = get_perplexity_response(full_prompt, conversation_history)
        
        # Extract tables from response
        tables = extract_tables_from_response(response)
        
        # Generate plot if requested or if data is present
        plot_data = None
        visualization_keywords = ["graph", "plot", "chart", "visual", "visualize", "show me", "display", "create a graph", "make a chart"]
        data_keywords = ["data", "numbers", "statistics", "percentage", "increase", "decrease", "trend", "comparison"]
        
        needs_visualization = any(word in question.lower() for word in visualization_keywords)
        has_data = any(word in response.lower() for word in data_keywords)
        
        if needs_visualization or has_data:
            plot_code = generate_plot_code(knowledge_base, question, response)
            if plot_code:
                plot_image = execute_plot_code(plot_code)
                if plot_image:
                    plot_data = {
                        'code': plot_code,
                        'image': plot_image,
                        'type': 'matplotlib'
                    }
        
        return jsonify({
            'success': True,
            'response': response,
            'sources': sources,
            'tables': tables,
            'plot': plot_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle CORS preflight requests"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
