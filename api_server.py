from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime, timedelta
import time
import base64
import io
import re
import matplotlib.pyplot as plt
import pandas as pd
import fitz
import requests
import openai
import google.generativeai as genai
from dotenv import load_dotenv
import jwt
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Enable CORS
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TONIC AI API")

# Configure API clients
openai_client = None

try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
    
    # Initialize OpenAI client only if API key is provided
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key and openai_api_key != "your_openai_api_key_here":
        try:
            openai_client = openai.OpenAI(api_key=openai_api_key)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
            openai_client = None
    else:
        logger.warning("OpenAI API key not found or not configured. Plot generation will be disabled.")
        
except Exception as e:
    logger.error(f"API configuration error: {e}")
    openai_client = None

# Mock user credentials
USERS = {
    "admin@123": "admin123",
    "demo": "demo123",
    "user": "password123"
}

# In-memory storage
user_sessions = {}
user_knowledge_bases = {}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def process_pdf(file_content, filename):
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
    try:
        df = pd.read_csv(file_content)
        return df.to_string(index=False)
    except Exception as e:
        logger.error(f"CSV processing error: {e}")
        return ""

def extract_structured_info(text, filename):
    base_prompt = """Extract structured information from this document for building a knowledge base.
    IMPORTANT: When presenting tabular data, please format it as a proper markdown table using | symbols.
    Document content: """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        text_chunk = text[:30000]
        gemini_response = model.generate_content(base_prompt + text_chunk)
        return gemini_response.text
    except Exception as e:
        logger.error(f"Gemini failed on {filename}: {e}")
        return ""

def get_perplexity_response(prompt, conversation_history=None):
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
            return f"❌ Perplexity error: {response.status_code}", ""

    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"❌ Perplexity error: {e}", ""

def generate_plot_code(knowledge, query, reply):
    if not openai_client:
        logger.warning("OpenAI client not available. Plot generation disabled.")
        return None
        
    system_prompt = "You are a Python assistant. Output only valid matplotlib code using data given to you."
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

def get_chat_prompt():
    return (
        "You are an intelligent assistant. Use the extracted knowledge base if it's available to answer user queries. "
        "IMPORTANT FORMATTING:\n"
        "- When presenting tabular data, format it as markdown tables using `|` symbols.\n"
        "- Example:\n"
        "  | Column 1 | Column 2 |\n"
        "  |----------|----------|\n"
        "  | Data 1   | Data 2   |\n\n"
    )

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if username in USERS and USERS[username] == password:
            token_payload = {
                'username': username,
                'exp': datetime.utcnow() + timedelta(days=7 if remember_me else 1)
            }
            token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm="HS256")
            
            if username not in user_sessions:
                user_sessions[username] = {'Default': []}
            if username not in user_knowledge_bases:
                user_knowledge_bases[username] = ""
            
            return jsonify({
                'success': True,
                'user': username,
                'token': token,
                'message': 'Login successful',
                'sessions': user_sessions[username],
                'knowledge_base': user_knowledge_bases[username]
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_files(current_user):
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
        
        user_knowledge_bases[current_user] = extracted_text
        
        return jsonify({
            'success': True,
            'knowledge_base': extracted_text,
            'message': f'Successfully processed {len(files)} file(s)'
        })
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        return jsonify({'error': 'File processing failed'}), 500

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    try:
        data = request.get_json()
        question = data.get('question')
        session_name = data.get('session_name', 'Default')
        knowledge_base = data.get('knowledge_base', user_knowledge_bases.get(current_user, ''))
        conversation_history = data.get('conversation_history', [])
        
        if not question:
            return jsonify({'error': 'No question provided'}), 400
        
        if current_user not in user_sessions:
            user_sessions[current_user] = {}
        if session_name not in user_sessions[current_user]:
            user_sessions[current_user][session_name] = []
        
        base_chat_prompt = get_chat_prompt()
        full_prompt = (
            f"{base_chat_prompt}\n\n"
            f"Knowledge Base:\n{knowledge_base}\n\n"
            f"Current Question:\n{question}"
        )
        
        response, sources = get_perplexity_response(full_prompt, conversation_history)
        
        # Extract tables from response
        tables = []
        if "|" in response:
            lines = response.split('\n')
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
                    if block[1].startswith('|') and '-' in block[1]:
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
        
        # Generate plot if requested
        plot_data = None
        if any(word in question.lower() for word in ["graph", "plot", "chart", "visual"]):
            plot_code = generate_plot_code(knowledge_base, question, response)
            if plot_code:
                try:
                    plt.clf()
                    exec_globals = {"plt": plt, "__name__": "__main__", "pd": pd}
                    plot_code = re.sub(r"plt\.show\(\)", "", plot_code)
                    exec(plot_code, exec_globals)

                    fig = plt.gcf()
                    buf = io.BytesIO()
                    fig.savefig(buf, format="png", dpi=300, bbox_inches='tight')
                    buf.seek(0)
                    
                    plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                    plot_data = {
                        'code': plot_code,
                        'type': 'matplotlib',
                        'image': plot_base64
                    }
                except Exception as e:
                    logger.error(f"Plot generation error: {e}")
        
        # Add to session history
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user_sessions[current_user][session_name].append({
            'q': question,
            'a': response,
            'timestamp': timestamp,
            'tables': tables,
            'plot': plot_data
        })
        
        return jsonify({
            'success': True,
            'response': response,
            'sources': sources,
            'tables': tables,
            'plot': plot_data,
            'timestamp': timestamp,
            'session_history': user_sessions[current_user][session_name]
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500

@app.route('/api/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    try:
        sessions = user_sessions.get(current_user, {})
        return jsonify({
            'success': True,
            'sessions': sessions
        })
    except Exception as e:
        logger.error(f"Get sessions error: {e}")
        return jsonify({'error': 'Failed to get sessions'}), 500

@app.route('/api/sessions', methods=['POST'])
@token_required
def create_session(current_user):
    try:
        data = request.get_json()
        session_name = data.get('session_name')
        
        if not session_name:
            return jsonify({'error': 'Session name is required'}), 400
        
        if current_user not in user_sessions:
            user_sessions[current_user] = {}
        
        if session_name in user_sessions[current_user]:
            return jsonify({'error': 'Session already exists'}), 400
        
        user_sessions[current_user][session_name] = []
        
        return jsonify({
            'success': True,
            'message': f'Session "{session_name}" created successfully',
            'sessions': user_sessions[current_user]
        })
    except Exception as e:
        logger.error(f"Create session error: {e}")
        return jsonify({'error': 'Failed to create session'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
