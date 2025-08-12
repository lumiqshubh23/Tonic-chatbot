from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
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
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    logger.error(f"Failed to configure AI models: {e}")
    # Initialize with None if configuration fails
    openai_client = None

# User credentials (in production, use a database)
USERS = {
    "admin@123": "admin123",
    "demo": "demo123"
}

# In-memory storage (in production, use a database)
sessions = {}
knowledge_bases = {}
user_sessions = {}

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
            
            return response.json()["choices"][0]["message"]["content"], citations
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
    if openai_client is None:
        logger.error("OpenAI client not configured, skipping plot generation")
        return None
        
    # Extract data from the AI response if it contains tables
    extracted_data = extract_data_from_response(reply)
    logger.info(f"📊 Extracted data from AI response: {extracted_data[:200]}...")
    
    # If no data found in response, generate sample data based on query
    if "No structured data found" in extracted_data:
        sample_data = generate_sample_data_for_query(query)
        extracted_data = f"""Sample data generated for query:
Categories: {sample_data['categories']}
Values: {sample_data['values']}
Title: {sample_data['title']}
X-axis: {sample_data['xlabel']}
Y-axis: {sample_data['ylabel']}"""
        logger.info(f"📊 Generated sample data: {sample_data}")
    else:
        logger.info(f"📊 Using extracted data from AI response")
    
    system_prompt = """You are a Python assistant. Output only valid matplotlib code using data given to you. 
    
    IMPORTANT INSTRUCTIONS:
    1. If data is provided in the response, use that data for plotting
    2. If no specific data is provided, create sample data based on the query context
    3. Always create a meaningful visualization that matches the user's request
    4. Use appropriate chart types: bar charts for comparisons, line charts for trends, pie charts for proportions
    5. Include proper labels, titles, and formatting
    6. Use the provided sample data if no other data is available
    
    Example format:
    import matplotlib.pyplot as plt
    import numpy as np
    
    # Data (use provided data or create sample data)
    categories = ['Category A', 'Category B', 'Category C']
    values = [10, 20, 15]
    
    plt.figure(figsize=(10, 6))
    plt.bar(categories, values, color='red')
    plt.title('Chart Title')
    plt.xlabel('Categories')
    plt.ylabel('Values')
    plt.tight_layout()
    """
    
    user_prompt = f"""Knowledge Base:\n{knowledge}\n\nUser Query:\n{query}\n\nAI Response:\n{reply}\n\nExtracted Data:\n{extracted_data}"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        return extract_code(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Code generation failed: {e}")
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
    return jsonify({"status": "healthy", "message": "TONIC AI Backend is running"})



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
    
    # Base chat prompt
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
            "- If the user requests graphs, plots, or charts, provide the data in a structured format (like a markdown table) that can be used for visualization. "
            "A separate module in the system will handle the actual chart generation.\n"
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
    
    # Check if plot generation is requested
    plot_keywords = ["graph", "plot", "chart", "visual", "visualization", "chart", "diagram"]
    should_generate_plot = any(word in question.lower() for word in plot_keywords)
    
    logger.info(f"📊 Plot generation check for question: '{question}'")
    logger.info(f"📊 Should generate plot: {should_generate_plot}")
    logger.info(f"📊 Plot keywords found: {[word for word in plot_keywords if word in question.lower()]}")
    
    if should_generate_plot:
        
        # Try multiple attempts like in Streamlit
        for attempt in range(3):
            logger.info(f"🎨 Plot generation attempt {attempt + 1}")
            plot_code = generate_plot_code(knowledge_base, question, ai_response)
            
            if plot_code:
                logger.info(f"🎨 Plot code generated, length: {len(plot_code)} characters")
                plot_code_data = plot_code  # Always send the plot code to React
                
                try:
                    # Clear any existing plots
                    plt.clf()
                    plt.close('all')
                    
                    # Set up execution environment (simpler like Streamlit)
                    exec_globals = {"plt": plt, "__name__": "__main__", "pd": pd}
                    
                    # Clean up the plot code
                    plot_code = re.sub(r"plt\.show\(\)", "", plot_code)
                    
                    # Execute the plot code
                    exec(plot_code, exec_globals)
                    
                    # Get the current figure
                    fig = plt.gcf()
                    if fig is None:
                        logger.warning("No figure found after executing plot code")
                        continue  # Try next attempt
                    
                    # Save the plot to bytes
                    buf = io.BytesIO()
                    fig.savefig(buf, format="png", dpi=300, bbox_inches='tight')
                    buf.seek(0)
                    plot_data = base64.b64encode(buf.getvalue()).decode("utf-8")
                    plt.close(fig)
                    logger.info(f"✅ Plot generated successfully on attempt {attempt + 1}, size: {len(plot_data)} characters")
                    break  # Success, exit the retry loop
                    
                except Exception as e:
                    logger.error(f"Plot generation failed on attempt {attempt + 1}: {e}")
                    print(f"\n❌ PLOT GENERATION ERROR (Attempt {attempt + 1}): {e}")
                    print(f"📝 Question: {question}")
                    print(f"🎨 Plot Code: {plot_code}")
                    print(f"{'='*80}\n")
                    
                    if attempt == 2:  # Last attempt
                        # Still send the plot code even if generation fails
                        plot_code_data = plot_code
            else:
                logger.warning(f"No plot code generated on attempt {attempt + 1}")
                if attempt == 2:  # Last attempt
                    break
    
    # Store in session
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_sessions[username][session_name].append({
        "q": question,
        "a": ai_response,
        "timestamp": timestamp
    })
    
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
