from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
import fitz  # PyMuPDF
import pandas as pd
import openai
import google.generativeai as genai
import tempfile
import re
import logging
import time
import matplotlib.pyplot as plt
import io
import os
import datetime
import requests
import base64
import numpy as np
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    'postgresql://admin:password@localhost:5432/my_new_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
jwt = JWTManager(app)

# Configure CORS properly
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:8501', 'http://127.0.0.1:3000', 'http://127.0.0.1:8501'],
     supports_credentials=True, 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     expose_headers=['Content-Type', 'Authorization'])

# Additional CORS headers for all responses
@app.after_request
def after_request(response):
    # Set CORS headers
    origin = request.headers.get('Origin')
    if origin:
        # Handle both localhost and 127.0.0.1 variations
        allowed_origins = [
            'http://localhost:3000', 
            'http://localhost:8501', 
            'http://127.0.0.1:3000', 
            'http://127.0.0.1:8501'
        ]
        
        # Check if origin is in allowed list
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        # Also handle case where browser sends localhost but we expect 127.0.0.1 or vice versa
        elif origin == 'http://localhost:3000':
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        elif origin == 'http://127.0.0.1:3000':
            response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
    
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
    
    return response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TONIC AI")

# API Keys
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

# Configure AI models
try:
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        genai.configure(api_key=gemini_key)
        logger.info("✅ Gemini API configured successfully")
    else:
        logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
    
    if openai_key:
        openai_client = openai.OpenAI(api_key=openai_key)
        logger.info("✅ OpenAI API configured successfully")
    else:
        logger.warning("⚠️ OPENAI_API_KEY not found in environment variables")
        openai_client = None
        
except Exception as e:
    logger.error(f"Failed to configure AI models: {e}")
    # Initialize with None if configuration fails
    openai_client = None

# User credentials (in production, use a database)
USERS = {
    "admin@123": "admin123",
    "demo@456": "demo123",
    "rahul@123":"rahultest",
    "shubham@123":"shubhamtest"
}

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'

class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationship
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatSession {self.session_name}>'

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<ChatMessage {self.id}>'

class KnowledgeBase(db.Model):
    __tablename__ = 'knowledge_bases'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<KnowledgeBase {self.id}>'

# In-memory storage (in production, use a database)
sessions = {}
knowledge_bases = {}
user_sessions = {}

def ensure_user_exists_for_history(username):
    """
    Ensure a user exists in the database for chat history purposes.
    This function creates a user record if it doesn't exist, without affecting login authentication.
    """
    try:
        # Check if user already exists in database
        user = User.query.filter_by(username=username).first()
        if user:
            return user
        
        # User doesn't exist in database, create them for chat history
        # Note: We don't set a password_hash since this is only for chat history
        # The actual authentication still uses the USERS dictionary
        new_user = User(
            username=username,
            password_hash='chat_history_only'  # Placeholder, not used for auth
        )
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"Created user '{username}' in database for chat history")
        return new_user
        
    except Exception as e:
        logger.error(f"Error ensuring user exists for history: {e}")
        db.session.rollback()
        return None

def process_pdf(file):
    """Extract text from PDF file"""
    try:
        doc = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        return ""

def process_excel(file):
    """Extract text from Excel file"""
    try:
        excel_data = pd.read_excel(file, sheet_name=None)
        text = ""
        for sheet, df in excel_data.items():
            text += f"\n--- Sheet: {sheet} ---\n{df.to_string(index=False)}"
        return text
    except Exception as e:
        logger.error(f"Excel processing error: {e}")
        return ""

def process_csv(file):
    """Extract text from CSV file"""
    try:
        df = pd.read_csv(file)
        return df.to_string(index=False)
    except Exception as e:
        logger.error(f"CSV processing error: {e}")
        return ""

def extract_structured_info(text, filename):
    """Extract structured information using Gemini with table formatting instructions"""
    base_prompt = """Extract structured information from this document for building a knowledge base.
    
    IMPORTANT: When presenting tabular data, please format it as a proper HTML table using <table>, <tr>, <td>, <th> tags.
    For example:
    <table>
    <tr><th>Column 1</th><th>Column 2</th></tr>
    <tr><td>Data 1</td><td>Data 2</td></tr>
    </table>
    
    Alternatively, you can use markdown table format:
    | Column 1 | Column 2 |
    |----------|----------|
    | Data 1   | Data 2   |
    
    Document content: """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        # Limit text to prevent token limit issues
        text_chunk = text[:30000]
        gemini_response = model.generate_content(base_prompt + text_chunk)
        structured_output = gemini_response.text
        logger.info(f"Extracted structured data from {filename}")
        return structured_output
    except Exception as e:
        logger.error(f"Gemini failed on {filename}: {e}")
        # Return a simple text extraction if Gemini fails
        return text[:1000] + "..." if len(text) > 1000 else text

def get_perplexity_response(prompt, conversation_history=None, model="sonar"):
    """Get response from Perplexity API with optional conversation history."""
    if not PERPLEXITY_API_KEY:
        logger.error("Perplexity API key not configured")
        return "❌ Perplexity API key not configured. Please set PERPLEXITY_API_KEY in your environment variables.", ""
        
    try:
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        # Build OpenAI-style messages
        messages = []

        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["q"]})
                messages.append({"role": "assistant", "content": turn["a"]})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "stream": False
        }

        response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload)

        if response.ok:
            citations = ""
            for j in response.json()["search_results"]:
                tmp_c = j.get('title') + " - " + j.get('url')
                citations = citations + tmp_c + " \n "
            
            assistant_response = response.json()["choices"][0]["message"]["content"]
            
            # Console logging for Perplexity Assistant Response
            logger.info("🤖 Perplexity Assistant Response:")
            logger.info(f"Response: {assistant_response}")
            print(f"🤖 Perplexity Assistant Response: {assistant_response}")
            
            return assistant_response, citations
        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return f"❌ Perplexity error: {response.status_code}: {response.text}", ""

    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"❌ Perplexity error: {e}", ""

def extract_code(text):
    """Extract Python code from markdown code blocks"""
    match = re.search(r"```(?:python)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text.strip()

def generate_plot_code(knowledge, query, reply):
    """Generate matplotlib code for visualization"""
    system_prompt = """You are a Python assistant. Output only valid matplotlib code using data given to you. You can generate multiple plots, so generate code in that way. If there is no sufficient Knowledge Base data, rely on the Answer.

IMPORTANT INSTRUCTIONS FOR BUSINESS DATA:
1. For media plans and marketing data, create meaningful visualizations like:
   - Bar charts for budget allocation across platforms
   - Pie charts for audience size breakdown (TAM, SAM, SOM)
   - Line charts for performance metrics (CPC, CPM, CTR)
   - Horizontal bar charts for platform comparisons
2. Use professional colors and styling
3. Include proper titles, labels, and legends
4. Make charts readable and presentation-ready
5. Extract data from tables in the response if available"""
    
    user_prompt = f"""Knowledge Base:\n{knowledge}\n\nUser Query:\n{query}\n\nAnswer:\n{reply}"""
    
    # Try OpenAI first
    if openai_client is not None:
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            plot_code = extract_code(response.choices[0].message.content)
            
            # Console logging for Plot Generation
            logger.info("🎨 Plot Code Generated (OpenAI):")
            logger.info(f"Plot Code: {plot_code}")
            print(f"🎨 Plot Code Generated (OpenAI): {plot_code}")
            
            return plot_code
        except Exception as e:
            logger.error(f"OpenAI code generation failed: {e}")
    
    # Fallback to Perplexity if OpenAI is not available or fails
    if PERPLEXITY_API_KEY:
        try:
            logger.info("🔄 Falling back to Perplexity for plot generation")
            response = get_perplexity_response(
                f"{system_prompt}\n\n{user_prompt}",
                model="sonar"
            )
            plot_code = extract_code(response[0])  # response is (content, sources)
            
            # Console logging for Plot Generation
            logger.info("🎨 Plot Code Generated (Perplexity):")
            logger.info(f"Plot Code: {plot_code}")
            print(f"🎨 Plot Code Generated (Perplexity): {plot_code}")
            
            return plot_code
        except Exception as e:
            logger.error(f"Perplexity code generation failed: {e}")
    
    logger.error("No AI service available for plot generation")
    return None

def extract_data_from_response(response):
    """Extract structured data from AI response for plotting"""
    try:
        # Look for markdown tables in the response
        lines = response.split('\n')
        data_sections = []
        
        for line in lines:
            if '|' in line and line.strip():
                data_sections.append(line.strip())
        
        if data_sections:
            return f"Found table data:\n" + '\n'.join(data_sections)
        
        # Look for structured data patterns
        import re
        
        # Look for patterns like "Category A: 10, Category B: 20"
        pattern = r'([A-Za-z\s]+):\s*(\d+(?:\.\d+)?)'
        matches = re.findall(pattern, response)
        
        if matches:
            categories = [match[0].strip() for match in matches]
            values = [float(match[1]) for match in matches]
            return f"Extracted data:\nCategories: {categories}\nValues: {values}"
        
        # Look for array-like patterns
        array_pattern = r'\[([\d\s,\.]+)\]'
        array_matches = re.findall(array_pattern, response)
        
        if array_matches:
            return f"Found array data: {array_matches}"
        
        # Look for percentage patterns
        percent_pattern = r'(\d+(?:\.\d+)?)%'
        percent_matches = re.findall(percent_pattern, response)
        
        if percent_matches:
            return f"Found percentage data: {percent_matches}"
        
        return "No structured data found in response"
        
    except Exception as e:
        logger.error(f"Data extraction failed: {e}")
        return "Error extracting data from response"

def generate_sample_data_for_query(query):
    """Generate sample data based on the query context"""
    query_lower = query.lower()
    
    if 'sales' in query_lower:
        return {
            'categories': ['Q1', 'Q2', 'Q3', 'Q4'],
            'values': [12000, 15000, 18000, 22000],
            'title': 'Sales Data by Quarter',
            'xlabel': 'Quarter',
            'ylabel': 'Sales ($)'
        }
    elif 'revenue' in query_lower:
        return {
            'categories': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'values': [45000, 52000, 48000, 61000, 58000, 67000],
            'title': 'Revenue Over Time',
            'xlabel': 'Month',
            'ylabel': 'Revenue ($)'
        }
    elif 'performance' in query_lower or 'metrics' in query_lower:
        return {
            'categories': ['Product A', 'Product B', 'Product C', 'Product D'],
            'values': [85, 92, 78, 95],
            'title': 'Performance Metrics',
            'xlabel': 'Products',
            'ylabel': 'Performance Score'
        }
    elif 'engagement' in query_lower:
        return {
            'categories': ['Website', 'Mobile App', 'Social Media', 'Email'],
            'values': [65, 78, 45, 32],
            'title': 'User Engagement by Channel',
            'xlabel': 'Channel',
            'ylabel': 'Engagement Rate (%)'
        }
    else:
        # Default sample data
        return {
            'categories': ['Category A', 'Category B', 'Category C', 'Category D'],
            'values': [25, 40, 30, 55],
            'title': 'Sample Data Visualization',
            'xlabel': 'Categories',
            'ylabel': 'Values'
        }

def extract_tables_from_response(response_text):
    """Extract tables from markdown response"""
    tables = []
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
                if re.match(r'\s*\|?\s*-+\s*\|', block[1]):
                    block.pop(1)

                headers = [col.strip() for col in block[0].split('|') if col.strip()]
                data_rows = []
                for row in block[1:]:
                    cols = [col.strip() for col in row.split('|') if col.strip()]
                    if len(cols) == len(headers):
                        data_rows.append(cols)

                if data_rows:
                    df = pd.DataFrame(data_rows, columns=headers)
                    tables.append(df.to_dict('records'))

        return tables
    except Exception as e:
        logger.error(f"Table extraction error: {e}")
        return []

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        "status": "healthy", 
        "message": "TONIC AI Backend is running",
        "database": db_status
    })



@app.route('/api/login', methods=['OPTIONS'])
def login_options():
    """Handle preflight OPTIONS request for login endpoint"""
    return make_response(), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    logger.info(f"Login attempt for username: {username}")
    logger.info(f"Available users: {list(USERS.keys())}")
    logger.info(f"User exists: {username in USERS}")
    if username in USERS:
        logger.info(f"Password match: {USERS[username] == password}")
    
    if username in USERS and USERS[username] == password:
        access_token = create_access_token(identity=username)
        logger.info(f"Login successful for user: {username}")
        return jsonify({
            "success": True,
            "token": access_token,
            "username": username,
            "message": "Login successful"
        })
    else:
        logger.warning(f"Login failed for user: {username}")
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    username = get_jwt_identity()
    
    # Clear user data from memory
    if username in knowledge_bases:
        del knowledge_bases[username]
    
    if username in user_sessions:
        del user_sessions[username]
    
    logger.info(f"User {username} logged out successfully")
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_files():
    username = get_jwt_identity()
    
    if 'files' not in request.files:
        return jsonify({"success": False, "message": "No files provided"}), 400
    
    files = request.files.getlist('files')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"success": False, "message": "No files selected"}), 400
    
    full_text = ""
    
    for file in files:
        if file.filename == '':
            continue
            
        if file.content_type == "application/pdf":
            text = process_pdf(file)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            text = process_excel(file)
        elif file.content_type == "text/csv":
            text = process_csv(file)
        else:
            continue

        if text:
            structured_output = extract_structured_info(text, file.filename)
            if structured_output:
                full_text += f"\n\n--- Extracted from {file.filename} ---\n\n{structured_output}"

    # Store knowledge base for user
    if username not in knowledge_bases:
        knowledge_bases[username] = ""
    knowledge_bases[username] = full_text
    
    return jsonify({
        "success": True,
        "message": f"Successfully processed {len(files)} file(s)",
        "knowledge_base": full_text
    })

@app.route('/api/chat', methods=['OPTIONS'])
def chat_options():
    """Handle preflight OPTIONS request for chat endpoint"""
    return make_response(), 200

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    username = get_jwt_identity()
    data = request.get_json()
    
    question = data.get('question')
    knowledge_base = data.get('knowledge_base', '')
    conversation_history = data.get('conversation_history', [])
    session_name = data.get('session_name', 'Default')
    
    if not question:
        return jsonify({"success": False, "message": "Question is required"}), 400
    
    # Initialize user sessions if not exists
    if username not in user_sessions:
        user_sessions[username] = {}
    if session_name not in user_sessions[username]:
        user_sessions[username][session_name] = []
    
    # Use stored knowledge base if not provided
    if not knowledge_base and username in knowledge_bases:
        knowledge_base = knowledge_bases[username]
    
    # Base chat prompt - Enhanced to match Streamlit app quality
    base_chat_prompt = (
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
"  Mention that this product allows instant download of the generated table.\n"
"- If the user requests graphs, plots, or charts, do not generate them. "
"A separate module in the system handles visualizations.\n"
"- If relevant information isn't found in the knowledge base, use your own understanding to answer accurately.\n"
"- Always consider the user input carefully. Combine it with the knowledge base and your knowledge to generate accurate and context-aware responses.\n"
"- Maintain conversational context by referring to previous user queries where appropriate. If the query is entirely new, don't use previous knowledge.\n\n"

"**SPECIAL FORMAT — MEDIA PLAN REQUESTS:**\n"
"- If the user asks for a *media plan* or requests *marketing metrics across platforms*, present the data in TONIC-style format.\n"
"- TONIC-style table format:\n"
"  1. Start with a title (e.g., 'Plan KSA') on top.\n"
"  2. First table row = main metric headers: Medium, Clicks, CPC, Impressions, CPM, Views, CPV, CTR, Leads, CPL, Total Cost.\n"
"  3. Second row = subheaders (e.g., Channel, Exp. Link Clicks, etc.).\n"
"  4. List each platform (e.g., TikTok, YouTube) in a row with corresponding metrics.\n"
"  5. At the bottom, include summary rows: Net Total, Total Clicks, Impressions, Views, etc.\n"
"  6. Format the entire table in markdown using `|`, just like other tables.\n"
"  7. Do not explain the table — output the TONIC table directly with any other requested info (like recommendations or insights).\n"
"- Example:\n"
"\n"
"  Plan KSA  \n"
"  | Medium | Clcks | CPC | Impressions | CPM | Views | CPV | CTR | Leads | CPL | Total Cost |\n"
"  | Channel | Exp. Link Clicks | Exp. Tonic CPC | Exp. Impressions | Exp. Tonic CPM | Video Views | Exp. Tonic CPV | Exp.CTR | | Budget |\n"
"  | Tiktok Ad | 11,630 | AED1.29 | 2,907,540 | AED5.16 | 67,843 | AED0.22 | 0.40 | 150 | 100 | 15000 |\n"
"  | Facebook/Instagram | 18,367 | AED1.47 | 6,679,035 | AED4.04 | 734,694 | AED0.04 | 0.28 | 270 | 100 | 27000 |\n"
"  | Twitter X | 4,511 | AED1.40 | 1,051,709 | AED5.99 | 11,429 | AED0.55 | 0.43 | 63 | 100 | 6300 |\n"
"  | YouTube Ads | 5,630 | AED2.13 | 806,248 | AED14.88 | 544,218 | AED0.02 | 0.70 | 120 | 100 | 12000 |\n"
"  | Search Ads | 5,246 | AED2.21 |  |  |  |  |  | 116 | 100 | 11600 |\n"
"  | Google Display Ads | 7,850 | AED1.03 | 2,448,980 | AED3.31 | NA | NA | 0.32 | 81 | 100 | 8100 |\n"
"  | | | | | | | | | | | |\n"
"  | | | | | | | | Net Total | AED80,000 | | |\n"
"  | | | | | | | | Total Clicks | 53,235 | | |\n"
"  | | | | | | | | Total Impressions | 13,893,513 | | |\n"
"  | | | | | | | | Total Views | 1,358,183 | | |\n\n"

"- Use this format **only** if the user's query is about media planning, digital ad performance, or channel-level budget/performance comparison.\n"

"**ENHANCED MEDIA PLAN FORMAT FOR CLIENT PITCHING:**\n"
"- When users request media plans for client pitching, provide a comprehensive structured response including:\n"
"  1. **Audience Size Details** - TAM, SAM, SOM breakdown\n"
"  2. **Target Audience** - Demographics, psychographics, behavioral patterns\n"
"  3. **Approach** - Strategy, objectives, and methodology\n"
"  4. **Media Plan with Platform Split** - Detailed metrics table with all KPIs\n"
"  5. **Notes for PPT Presentation** - Guidelines for creating presentation slides\n"
"- Format the response with clear sections using markdown headers (###)\n"
"- Include detailed explanations and insights for each section\n"
"- Provide realistic and comprehensive data for all metrics\n"
"- Add presentation tips and visual guidance for client pitches\n"

"- Also provide list of sources/URLs as Sources:\n"
"  from where you have gathered all the data (list no more than 5)\n"
"  - ALSO NEVER LIST ANY SOURCES RELATED TO FORMATTING, ETC. LIST ONLY DATA SOURCES"
    )
    
    full_prompt = (
        f"{base_chat_prompt}\n\n"
        f"Knowledge Base:\n{knowledge_base}\n\n"
        f"Current Question:\n{question}"
    )
    
    # Get AI response
    ai_response, sources = get_perplexity_response(full_prompt, conversation_history)
    
    # Console logging for Assistant Response
    logger.info("🤖 Assistant Response:")
    logger.info(f"Response: {ai_response}")
    if sources:
        logger.info(f"Sources: {sources}")
    print(f"🤖 Assistant Response: {ai_response}")
    
    # Debug: Log the AI response for plot-related queries
    if any(word in question.lower() for word in ["graph", "plot", "chart", "visual", "visualization", "diagram"]):
        logger.info(f"🤖 AI Response for plot query: {ai_response[:500]}...")
        logger.info(f"🤖 AI Response length: {len(ai_response)}")
        logger.info(f"🤖 AI Response contains plot keywords: {any(word in ai_response.lower() for word in ['chart', 'graph', 'plot', 'visual'])}")
    
    # Extract tables from response
    tables = extract_tables_from_response(ai_response)
    
    # Generate plot if requested
    plot_data = None
    plot_code_data = None
    
    # ========== PLOT GENERATION ========== #
    # Check if plot generation is requested OR if there's tabular data that could be visualized
    should_generate_plot = (
        any(word in question.lower() for word in ["graph", "plot", "chart", "visual"]) or
        (tables and len(tables) > 0) or  # Generate plot if tables are found
        any(word in question.lower() for word in ["media plan", "marketing", "campaign", "metrics", "data"])  # Generate for business data
    )
    
    if should_generate_plot:
        logger.info(f"🎨 Generating plot for question: {question}")
        logger.info(f"🎨 Plot trigger: Tables found={len(tables) if tables else 0}, Keywords found={[word for word in ['graph', 'plot', 'chart', 'visual', 'media plan', 'marketing', 'campaign', 'metrics', 'data'] if word in question.lower()]}")
        
        for attempt in range(3):
            logger.info(f"🎨 Plot generation attempt {attempt + 1}")
            plot_code = generate_plot_code(
                knowledge_base,
                question,
                ai_response
            )

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

                    plot_data = base64.b64encode(buf.getvalue()).decode("utf-8")
                    plot_code_data = plot_code
                    plt.close(fig)
                    logger.info(f"✅ Plot generated successfully on attempt {attempt + 1}")
                    break

                except Exception as e:
                    logger.error(f"⚠️ Plot failed on attempt {attempt + 1}: {e}")
                    if attempt == 2:  # Last attempt
                        plot_code_data = plot_code
            else:
                logger.warning(f"No plot code generated on attempt {attempt + 1}")
                if attempt == 2:  # Last attempt
                    break
    else:
        logger.info(f"🎨 Plot generation skipped - no trigger conditions met")
    
    # Store in session (in-memory)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_sessions[username][session_name].append({
        "q": question,
        "a": ai_response,
        "timestamp": timestamp
    })
    
    # Store in database
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if user:
            # Get or create session in database
            db_session = ChatSession.query.filter_by(user_id=user.id, session_name=session_name).first()
            if not db_session:
                db_session = ChatSession(
                    user_id=user.id,
                    session_name=session_name
                )
                db.session.add(db_session)
                db.session.flush()  # Get the ID
            
            # Save message to database
            chat_message = ChatMessage(
                session_id=db_session.id,
                question=question,
                answer=ai_response
            )
            db.session.add(chat_message)
            db.session.commit()
            logger.info(f"Message saved to database for user {username}, session {session_name}")
    except Exception as e:
        logger.error(f"Failed to save message to database: {e}")
        db.session.rollback()
        # Continue with the response even if database save fails
    
    # Log response data
    logger.info(f"📤 Sending response to client:")
    logger.info(f"   📄 Response length: {len(ai_response)} characters")
    logger.info(f"   📊 Tables found: {len(tables)}")
    logger.info(f"   🎨 Plot data: {'Present' if plot_data else 'None'}")
    logger.info(f"   📝 Plot code: {'Present' if plot_code_data else 'None'}")
    if plot_data:
        logger.info(f"   🎨 Plot data size: {len(plot_data)} characters")
    if plot_code_data:
        logger.info(f"   📝 Plot code size: {len(plot_code_data)} characters")
    logger.info(f"   🔗 Sources: {len(sources) if sources else 0}")
        
    return jsonify({
        "success": True,
        "response": ai_response,
        "timestamp": timestamp,
        "tables": tables,
        "plot": plot_data,
        "plot_code": plot_code_data,
        "sources": sources
    })

@app.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    username = get_jwt_identity()
    user_sessions_list = user_sessions.get(username, {})
    return jsonify({
        "success": True,
        "sessions": list(user_sessions_list.keys())
    })

@app.route('/api/sessions', methods=['POST'])
@jwt_required()
def create_session():
    username = get_jwt_identity()
    data = request.get_json()
    session_name = data.get('session_name')
    
    if not session_name:
        return jsonify({"success": False, "message": "Session name is required"}), 400
    
    if username not in user_sessions:
        user_sessions[username] = {}
    
    if session_name in user_sessions[username]:
        return jsonify({"success": False, "message": "Session already exists"}), 400
    
    user_sessions[username][session_name] = []
    
    return jsonify({
        "success": True,
        "message": f"Session '{session_name}' created successfully"
    })

@app.route('/api/sessions/<session_name>', methods=['DELETE'])
@jwt_required()
def delete_session(session_name):
    username = get_jwt_identity()
    
    if username in user_sessions and session_name in user_sessions[username]:
        del user_sessions[username][session_name]
        return jsonify({
            "success": True,
            "message": f"Session '{session_name}' deleted successfully"
        })
    
    return jsonify({"success": False, "message": "Session not found"}), 404

@app.route('/api/sessions/<session_name>/clear', methods=['POST'])
@jwt_required()
def clear_session(session_name):
    username = get_jwt_identity()
    
    if username in user_sessions and session_name in user_sessions[username]:
        user_sessions[username][session_name] = []
        return jsonify({
            "success": True,
            "message": f"Session '{session_name}' cleared successfully"
        })
    
    return jsonify({"success": False, "message": "Session not found"}), 404

@app.route('/api/sessions/<session_name>/messages', methods=['GET'])
@jwt_required()
def get_session_messages(session_name):
    username = get_jwt_identity()
    
    if username in user_sessions and session_name in user_sessions[username]:
        return jsonify({
            "success": True,
            "messages": user_sessions[username][session_name]
        })
    
    return jsonify({"success": False, "message": "Session not found"}), 404

# ==================== CHAT HISTORY APIs ====================

@app.route('/api/chat-history', methods=['GET'])
@jwt_required()
def get_chat_history():
    """Get all chat history for the authenticated user"""
    username = get_jwt_identity()
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get all chat sessions for the user
        chat_sessions = ChatSession.query.filter_by(user_id=user.id).order_by(ChatSession.created_at.desc()).all()
        
        history = []
        for session in chat_sessions:
            # Get messages for this session
            messages = ChatMessage.query.filter_by(session_id=session.id).order_by(ChatMessage.timestamp).all()
            
            session_data = {
                "session_id": session.id,
                "session_name": session.session_name,
                "created_at": session.created_at.isoformat(),
                "message_count": len(messages),
                "messages": [
                    {
                        "id": msg.id,
                        "question": msg.question,
                        "answer": msg.answer,
                        "timestamp": msg.timestamp.isoformat()
                    } for msg in messages
                ]
            }
            history.append(session_data)
        
        return jsonify({
            "success": True,
            "chat_history": history,
            "total_sessions": len(history)
        })
        
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return jsonify({"success": False, "message": "Failed to fetch chat history"}), 500

@app.route('/api/chat-history/<int:session_id>', methods=['GET'])
@jwt_required()
def get_chat_session_history(session_id):
    """Get chat history for a specific session"""
    username = get_jwt_identity()
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the specific chat session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Get messages for this session
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.timestamp).all()
        
        session_data = {
            "session_id": chat_session.id,
            "session_name": chat_session.session_name,
            "created_at": chat_session.created_at.isoformat(),
            "message_count": len(messages),
            "messages": [
                {
                    "id": msg.id,
                    "question": msg.question,
                    "answer": msg.answer,
                    "timestamp": msg.timestamp.isoformat()
                } for msg in messages
            ]
        }
        
        return jsonify({
            "success": True,
            "session": session_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching session history: {e}")
        return jsonify({"success": False, "message": "Failed to fetch session history"}), 500

@app.route('/api/chat-history', methods=['POST'])
@jwt_required()
def create_chat_session():
    """Create a new chat session"""
    username = get_jwt_identity()
    data = request.get_json()
    
    logger.info(f"Creating chat session for user: {username}")
    logger.info(f"Request data: {data}")
    
    session_name = data.get('session_name', 'New Session')
    logger.info(f"Session name: {session_name}")
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Check if session name already exists for this user
        # For "Default" sessions, we allow multiple sessions with the same name
        if session_name != "Default":
            existing_session = ChatSession.query.filter_by(user_id=user.id, session_name=session_name).first()
            if existing_session:
                return jsonify({"success": False, "message": "Session name already exists"}), 400
        
        # Create new session
        new_session = ChatSession(
            user_id=user.id,
            session_name=session_name
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Chat session created successfully",
            "session": {
                "id": new_session.id,
                "session_name": new_session.session_name,
                "created_at": new_session.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to create chat session"}), 500

@app.route('/api/chat-history/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_chat_session(session_id):
    """Update chat session name"""
    username = get_jwt_identity()
    data = request.get_json()
    
    new_session_name = data.get('session_name')
    if not new_session_name:
        return jsonify({"success": False, "message": "Session name is required"}), 400
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Check if new name already exists
        existing_session = ChatSession.query.filter_by(
            user_id=user.id, 
            session_name=new_session_name
        ).filter(ChatSession.id != session_id).first()
        
        if existing_session:
            return jsonify({"success": False, "message": "Session name already exists"}), 400
        
        # Update session name
        chat_session.session_name = new_session_name
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Session updated successfully",
            "session": {
                "id": chat_session.id,
                "session_name": chat_session.session_name,
                "created_at": chat_session.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating chat session: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to update session"}), 500

@app.route('/api/chat-history/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_session(session_id):
    """Delete a chat session and all its messages"""
    username = get_jwt_identity()
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Delete all messages in the session first (cascade should handle this, but explicit for safety)
        ChatMessage.query.filter_by(session_id=session_id).delete()
        
        # Delete the session
        db.session.delete(chat_session)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Session deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting chat session: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to delete session"}), 500

@app.route('/api/chat-history/<int:session_id>/messages', methods=['POST'])
@jwt_required()
def add_chat_message(session_id):
    """Add a new message to a chat session"""
    username = get_jwt_identity()
    data = request.get_json()
    
    question = data.get('question')
    answer = data.get('answer')
    
    if not question or not answer:
        return jsonify({"success": False, "message": "Question and answer are required"}), 400
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Create new message
        new_message = ChatMessage(
            session_id=session_id,
            question=question,
            answer=answer
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Message added successfully",
            "chat_message": {
                "id": new_message.id,
                "question": new_message.question,
                "answer": new_message.answer,
                "timestamp": new_message.timestamp.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error adding chat message: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to add message"}), 500

@app.route('/api/chat-history/<int:session_id>/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_message(session_id, message_id):
    """Delete a specific message from a chat session"""
    username = get_jwt_identity()
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Get the message
        chat_message = ChatMessage.query.filter_by(id=message_id, session_id=session_id).first()
        if not chat_message:
            return jsonify({"success": False, "message": "Message not found"}), 404
        
        # Delete the message
        db.session.delete(chat_message)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Message deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting chat message: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to delete message"}), 500

@app.route('/api/chat-history/search', methods=['GET'])
@jwt_required()
def search_chat_history():
    """Search chat history by question or answer content"""
    username = get_jwt_identity()
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({"success": False, "message": "Search query is required"}), 400
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Search in messages
        from sqlalchemy import or_
        
        messages = db.session.query(ChatMessage).join(ChatSession).filter(
            ChatSession.user_id == user.id,
            or_(
                ChatMessage.question.ilike(f'%{query}%'),
                ChatMessage.answer.ilike(f'%{query}%')
            )
        ).order_by(ChatMessage.timestamp.desc()).all()
        
        results = []
        for msg in messages:
            session = ChatSession.query.get(msg.session_id)
            results.append({
                "message_id": msg.id,
                "session_id": msg.session_id,
                "session_name": session.session_name if session else "Unknown Session",
                "question": msg.question,
                "answer": msg.answer,
                "timestamp": msg.timestamp.isoformat()
            })
        
        return jsonify({
            "success": True,
            "search_results": results,
            "total_results": len(results),
            "query": query
        })
        
    except Exception as e:
        logger.error(f"Error searching chat history: {e}")
        return jsonify({"success": False, "message": "Failed to search chat history"}), 500

@app.route('/api/chat-history/export/<int:session_id>', methods=['GET'])
@jwt_required()
def export_chat_session(session_id):
    """Export chat session as JSON"""
    username = get_jwt_identity()
    
    try:
        # Ensure user exists in database for chat history
        user = ensure_user_exists_for_history(username)
        if not user:
            return jsonify({"success": False, "message": "Failed to create user for chat history"}), 500
        
        # Get the session
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=user.id).first()
        if not chat_session:
            return jsonify({"success": False, "message": "Session not found"}), 404
        
        # Get messages for this session
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.timestamp).all()
        
        export_data = {
            "session_info": {
                "session_id": chat_session.id,
                "session_name": chat_session.session_name,
                "created_at": chat_session.created_at.isoformat(),
                "exported_at": datetime.datetime.utcnow().isoformat(),
                "total_messages": len(messages)
            },
            "messages": [
                {
                    "id": msg.id,
                    "question": msg.question,
                    "answer": msg.answer,
                    "timestamp": msg.timestamp.isoformat()
                } for msg in messages
            ]
        }
        
        return jsonify({
            "success": True,
            "export_data": export_data
        })
        
    except Exception as e:
        logger.error(f"Error exporting chat session: {e}")
        return jsonify({"success": False, "message": "Failed to export session"}), 500

def init_database():
    """Initialize database tables and add default users"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            logger.info("Database tables created successfully")
            
            # Add default users if they don't exist
            default_users = [
                {"username": "admin@123", "password": "admin123"},
                {"username": "demo", "password": "demo123"}
            ]
            
            for user_data in default_users:
                existing_user = User.query.filter_by(username=user_data["username"]).first()
                if not existing_user:
                    # In a real application, you should hash passwords
                    new_user = User(
                        username=user_data["username"],
                        password_hash=user_data["password"]  # In production, use proper hashing
                    )
                    db.session.add(new_user)
                    logger.info(f"Created default user: {user_data['username']}")
            
            db.session.commit()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

if __name__ == '__main__':
    # Initialize database before running the app
    init_database()
    app.run(debug=True, host='0.0.0.0', port=5000)
