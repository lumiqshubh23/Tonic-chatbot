"""
Utility functions and constants for TONIC AI Assistant
"""

import streamlit as st
import fitz  # PyMuPDF
import pandas as pd
import logging
import re
import time
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TONIC AI")

# Constants
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

def load_css(css_file_path):
    """Load CSS file and inject it into Streamlit"""
    try:
        with open(css_file_path, 'r') as f:
            css = f.read()
        st.markdown(f'<style>{css}</style>', unsafe_allow_html=True)
    except FileNotFoundError:
        logger.warning(f"CSS file not found: {css_file_path}")

def load_fonts():
    """Load Google Fonts"""
    st.markdown("""
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;500;700&display=swap" rel="stylesheet">
    """, unsafe_allow_html=True)

def initialize_session_state():
    """Initialize all session state variables"""
    # Authentication
    if "is_authenticated" not in st.session_state:
        st.session_state.is_authenticated = False
    
    # Chat sessions
    if 'sessions' not in st.session_state:
        st.session_state.sessions = {'Default': []}
    if 'current_session' not in st.session_state:
        st.session_state.current_session = 'Default'
    
    # Knowledge base and data
    for key in ["knowledge_base", "tables", "plot_buffer"]:
        if key not in st.session_state:
            if key == "tables":
                st.session_state[key] = {}
            else:
                st.session_state[key] = []
    
    # Plot generation
    for key in ["plot_generated", "plot_code", "last_input", "gemini_reply", "gemini_sources"]:
        if key not in st.session_state:
            if key in ["plot_generated"]:
                st.session_state[key] = False
            elif key in ["gemini_sources"]:
                st.session_state[key] = []
            else:
                st.session_state[key] = ""
    
    # Chat input
    if "user_input" not in st.session_state:
        st.session_state.user_input = ""
    if "messages" not in st.session_state:
        st.session_state.messages = []

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

def extract_code(text):
    """Extract Python code from markdown code blocks"""
    match = re.search(r"```(?:python)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text.strip()

def get_timestamp():
    """Get current timestamp in formatted string"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_user_credentials():
    """Get user credentials from secrets or fallback"""
    try:
        return st.secrets["users"]
    except Exception:
        # Fallback users for development
        return {
            "admin": "admin123",
            "demo": "demo123"
        }

def check_persistent_login():
    """Check if user has persistent login token"""
    query_params = st.query_params
    if "auth_token" in query_params and "username" in query_params and "login_time" in query_params:
        username = query_params["username"]
        login_time = query_params["login_time"]
        
        # Check if token is still valid (7 days expiry)
        try:
            login_timestamp = float(login_time)
            current_time = time.time()
            # Token expires after 7 days (604800 seconds)
            if current_time - login_timestamp > 604800:
                st.warning("⚠️ Your login session has expired. Please log in again.")
                clear_persistent_login()
                return False
        except (ValueError, TypeError):
            clear_persistent_login()
            return False
        
        # Simple token validation (in production, use proper JWT or secure tokens)
        expected_token = f"tonic_auth_{username}_{login_time}_2024"
        if query_params["auth_token"] == expected_token:
            st.session_state.is_authenticated = True
            st.session_state.logged_in_user = username
            return True
    return False

def set_persistent_login(username):
    """Set persistent login by updating URL parameters"""
    # Simple token generation (in production, use proper JWT or secure tokens)
    login_time = str(time.time())
    auth_token = f"tonic_auth_{username}_{login_time}_2024"
    st.query_params["auth_token"] = auth_token
    st.query_params["username"] = username
    st.query_params["login_time"] = login_time

def clear_persistent_login():
    """Clear persistent login tokens"""
    params_to_clear = ["auth_token", "username", "login_time"]
    for param in params_to_clear:
        if param in st.query_params:
            del st.query_params[param]
