import streamlit as st
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
# import plotly
# import plotly.express as px
# import plotly.graph_objects as go
import re
import requests
import base64
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ✅ Must be the first Streamlit command
st.set_page_config(page_title="TONIC AI Assistant", layout="wide")

# ✅ Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TONIC AI")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
# ✅ Configure Gemini & OpenAI - SECURITY ISSUE: API keys should not be hardcoded
# RECOMMENDATION: Use environment variables or Streamlit secrets
try:
    # genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
    # openai_client = openai.OpenAI(api_key=st.secrets["OPENAI_API_KEY"])
    # Use environment variables
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except KeyError:
    st.error("⚠️ API keys not found in Streamlit secrets. Please configure them.")
    st.stop()

# ✅ Initialize session state
if 'sessions' not in st.session_state:
    st.session_state.sessions = {'Default': []}
if 'current_session' not in st.session_state:
    st.session_state.current_session = 'Default'

# ✅ Authentication with persistent login
if "is_authenticated" not in st.session_state:
    st.session_state.is_authenticated = False

# Check for persistent login using query parameters
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

# Check for persistent login on page load
if not st.session_state.is_authenticated:
    check_persistent_login()


# if not st.session_state.is_authenticated:
#     st.title("🔐 TONIC AI Login")
#     username_input = st.text_input("Username")
#     password_input = st.text_input("Password", type="password")
#     login_btn = st.button("Login")


# if not st.session_state.is_authenticated:



if not st.session_state.is_authenticated:
    # ==== Modern Login UI CSS ====
    st.markdown(
        """
        <style>
        /* Global Background */
        .stApp {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }
        
        /* Main container */
        .login-main {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin: 2rem auto;
            max-width: 1000px;
            border: 1px solid #e2e8f0;
        }
        
        .welcome-text {
            font-size: 2.5rem;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.5rem;
        }
        
        .brand-text {
            color: #FF6B35;
            font-weight: 700;
        }
        
        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8f9fa;
            color: #4a5568;
            text-decoration: none;
            margin-bottom: 10px;
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .social-btn:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }
        
        .divider {
            text-align: center;
            margin: 20px 0;
            position: relative;
            color: #a0aec0;
        }
        
        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e2e8f0;
        }
        
        .divider span {
            background: white;
            padding: 0 15px;
        }
        
        .form-label {
            display: block;
            font-weight: 500;
            color: #4a5568;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }
        
        .forgot-link {
            color: #FF6B35;
            text-decoration: none;
            font-size: 0.9rem;
            float: right;
            margin-top: 5px;
        }
        
        .forgot-link:hover {
            text-decoration: underline;
            color: #e53e3e;
        }
        
        .register-text {
            text-align: center;
            margin-top: 20px;
            color: #718096;
        }
        
        .register-link {
            color: #FF6B35;
            text-decoration: none;
            font-weight: 500;
        }
        
        .register-link:hover {
            color: #e53e3e;
            text-decoration: underline;
        }
        
        /* Streamlit overrides */
        .stTextInput {
            width: 100% !important;
        }
        
        .stTextInput > div {
            width: 100% !important;
        }
        
        .stTextInput > div > div {
            width: 100% !important;
        }
        
        .stTextInput > div > div > input {
            background: #f8f9fa !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 15px 16px !important;
            font-size: 1rem !important;
            transition: all 0.2s ease !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            max-width: 100% !important;
        }
        
        .stTextInput > div > div > input:focus {
            border-color: #FF6B35 !important;
            background: white !important;
            box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1) !important;
        }
        
        .stCheckbox > label {
            color: #4a5568 !important;
            font-size: 0.9rem !important;
        }
        
        .stButton > button {
            width: 100% !important;
            padding: 15px 20px !important;
            background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            transition: all 0.2s !important;
            margin-top: 10px !important;
        }
        
        .stButton > button:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3) !important;
            background: linear-gradient(135deg, #e53e3e 0%, #FF6B35 100%) !important;
        }
        
        /* Remove default padding */
        .block-container {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
        }
        </style>
        """,
        unsafe_allow_html=True
    )

    # Create main container
    st.markdown('<div class="login-main">', unsafe_allow_html=True)
    
    # Two column layout
    col_left, col_right = st.columns([1, 1])
    
    with col_left:
        # Display the SVG file directly
        with open("assets/Images/Illustration.svg", "r") as f:
            svg_content = f.read()
        
        st.markdown(
            f"""
            
                {svg_content}
           
            """,
            unsafe_allow_html=True
        )
    
    with col_right:
        # st.markdown('<div style="padding: 4rem 3rem; background: white; height: 600px; display: flex; flex-direction: column; justify-content: center;">', unsafe_allow_html=True)
        
        # Welcome text
        st.markdown(
            """
            <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="color: #4a5568; font-size: 2rem; font-weight: 600; margin-bottom: 0;padding-bottom: 0;">Welcome to</h2>
                <h1 style="color: #FF6B35; font-size: 4.8rem; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);">TONIC AI</h1>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # Social login buttons
        # st.markdown(
        #     """
        #     <div style="margin: 30px 0;">
        #         <div class="social-btn" style="margin-bottom: 15px;">
        #             <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 10px;">
        #                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        #                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        #                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        #                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        #             </svg>
        #             Login with Google
        #         </div>
        #         <div class="social-btn">
        #             <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 10px;">
        #                 <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        #             </svg>
        #             Login with Facebook
        #         </div>
        #     </div>
            
        #     <div class="divider">
        #         <span>OR</span>
        #     </div>
        #     """,
        #     unsafe_allow_html=True
        # )
        
        # Form fields with better spacing
        st.markdown('<div style="margin-top: 25px;">', unsafe_allow_html=True)
        st.markdown('<label class="form-label">Email</label>', unsafe_allow_html=True)
        username_input = st.text_input("", placeholder="example@gmail.com", label_visibility="collapsed", key="username")
        
        st.markdown('<div style="margin-top: 20px;">', unsafe_allow_html=True)
        st.markdown('<label class="form-label">Password</label>', unsafe_allow_html=True)
        password_input = st.text_input("", type="password", placeholder="••••••••••", label_visibility="collapsed", key="password")
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Remember me and forgot password
        st.markdown('<div style="margin-top: 15px; margin-bottom: 25px;">', unsafe_allow_html=True)
        col_check, col_forgot = st.columns([1, 1])
        with col_check:
            remember_me = st.checkbox("Remember me", value=True)
        with col_forgot:
            st.markdown('<a href="#" class="forgot-link">Forgot Password?</a>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Login button
        login_btn = st.button("Login", type="primary", use_container_width=True)
        
        # Register link
        st.markdown('<div class="register-text" style="margin-top: 20px;">Don\'t have an account? <a href="#" class="register-link">Register</a></div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)






# if not st.session_state.is_authenticated:
#     # ==== Custom CSS Styling ====
#     st.markdown(
#         """
#         <style>
#         .login-box {
#             background-color: white;
#             border-radius: 16px;
#             padding: 2rem;
#             border: 2px solid #D95B35;
#             max-width: 2000px;
#             min-height: 4000px;
#             margin: 4rem auto;
#             box-shadow: 0 0 12px rgba(0,0,0,0.1);
#         }
#         .login-header {
#             text-align: center;
#             font-size: 1.75rem;
#             font-weight: bold;
#             color: #D95B35;
#             margin-bottom: 1rem;
#         }
#         .stButton > button {
#             background-color: #D95B35;
#             color: white;
#             width: 100%;
#             font-weight: bold;
#             border: none;
#             border-radius: 8px;
#         }
#         .stTextInput > div > input {
#             border: 1px solid #D95B35;
#             border-radius: 4px;
#         }
#         </style>
#         """,
#         unsafe_allow_html=True
#     )

#     # ==== Login UI ====
#     st.markdown('<div class="login-box">', unsafe_allow_html=True)

#     # Local image
#     st.image("Asset-3.png", width=120)

#     st.markdown('<div class="login-header">🔐 TONIC AI Login</div>', unsafe_allow_html=True)

#     username_input = st.text_input("Username")
#     password_input = st.text_input("Password", type="password")
#     login_btn = st.button("Login")

    try:
        USERS = st.secrets["users"]
    except Exception:
        # Fallback users for development
        USERS = {
            "admin": "admin123",
            "demo": "demo123"
        }

    if login_btn:
        if username_input in USERS and password_input == USERS[username_input]:
            st.session_state.is_authenticated = True
            st.session_state.logged_in_user = username_input
            
            # Set persistent login only if "Remember Me" is checked
            if remember_me:
                set_persistent_login(username_input)
                st.success("✅ Login successful - You'll stay logged in even after page refresh!")
            else:
                st.success("✅ Login successful!")
            
            time.sleep(1)  # Brief pause to show success message
            st.rerun()
        else:
            st.error("❌ Invalid username or password")

    st.markdown('</div>', unsafe_allow_html=True)
    st.stop()




   
#     try:
#         # USERS = st.secrets["users"]
#         USERS = {
#     "admin": "admin123",
#     "rahul": "securepass456"
# }
#     except Exception:
#         st.error("⚠️ User credentials not found in Streamlit secrets.")
#         st.stop()

#     if login_btn:
#         if username_input in USERS and password_input == USERS[username_input]:
#             st.session_state.is_authenticated = True
#             st.session_state.username = username_input
#             st.success("✅ Login successful")
#             st.rerun()
#         else:
#             st.error("❌ Invalid username or password")
#     st.stop()

# ✅ Init session state variables
for key in ["knowledge_base", "sessions", "current_session", "tables", "plot_buffer"]:
    if key not in st.session_state:
        if key == "sessions":
            st.session_state[key] = {"Default": []}
        elif key == "current_session":
            st.session_state[key] = "Default"
        elif key in ["tables"]:
            st.session_state[key] = {}
        else:
            st.session_state[key] = []

# ================= Sidebar =================
with st.sidebar:
    st.sidebar.image("Asset-3.png", width=300)
    print(st.session_state)
    if "logged_in_user" in st.session_state:
        st.title(f"👤 Welcome {st.session_state.logged_in_user}!")
        
        # Show persistent login status
        query_params = st.query_params
        if "auth_token" in query_params and "login_time" in query_params:
            try:
                login_timestamp = float(query_params["login_time"])
                expiry_timestamp = login_timestamp + 604800  # 7 days
                expiry_date = datetime.datetime.fromtimestamp(expiry_timestamp)
                
                st.markdown("🔒 **Persistent login active**")
                st.caption(f"Expires: {expiry_date.strftime('%Y-%m-%d %H:%M')}")
                
                # Show days remaining
                days_remaining = (expiry_timestamp - time.time()) / 86400
                if days_remaining > 1:
                    st.caption(f"⏰ {int(days_remaining)} days remaining")
                elif days_remaining > 0:
                    st.caption(f"⏰ Less than 1 day remaining")
            except (ValueError, TypeError):
                st.caption("Session-only login")
        else:
            st.caption("Session-only login (will logout on refresh)")
    else:
        st.title("👤 User")
    # st.title("🔧 Session")

    if st.button("🚪 Logout"):
        st.session_state.is_authenticated = False
        if "logged_in_user" in st.session_state:
            del st.session_state.logged_in_user
        
        # Clear persistent login
        clear_persistent_login()
        
        st.success("✅ Logged out successfully!")
        time.sleep(1)  # Brief pause to show logout message
        st.rerun()

    # Add option to manage persistent login
    if st.session_state.is_authenticated:
        query_params = st.query_params
        if "auth_token" in query_params:
            if st.button("🔓 Disable Auto-Login"):
                clear_persistent_login()
                st.success("Auto-login disabled. You'll need to login again after refresh.")
                time.sleep(1)
                st.rerun()
        else:
            if st.button("🔒 Enable Auto-Login"):
                if "logged_in_user" in st.session_state:
                    set_persistent_login(st.session_state.logged_in_user)
                    st.success("Auto-login enabled! You'll stay logged in after refresh.")
                    time.sleep(1)
                    st.rerun()

    st.markdown("---")
    st.subheader("🧠 Chat Sessions")

    session_names = list(st.session_state.sessions.keys())
    
    # Ensure we have at least one session
    if not session_names:
        session_names = ["Default"]
        st.session_state.sessions["Default"] = []
    
    # Ensure current session exists in the list
    if st.session_state.current_session not in session_names:
        st.session_state.current_session = session_names[0]

    # Get the index safely
    try:
        current_index = session_names.index(st.session_state.current_session)
    except ValueError:
        current_index = 0
        st.session_state.current_session = session_names[0]

    selected = st.selectbox("📂 Select session", session_names, index=current_index)
    
    if selected != st.session_state.current_session:
        st.session_state.current_session = selected
        st.rerun()

    new_session_name = st.text_input("➕ New session name")
    if st.button("Start New Session") and new_session_name:
        if new_session_name not in st.session_state.sessions:
            st.session_state.sessions[new_session_name] = []
            st.session_state.current_session = new_session_name
            st.rerun()
        else:
            st.warning("Session already exists.")

    st.markdown("---")
    rename_to = st.text_input("✏️ Rename current session")
    if st.button("Rename Session") and rename_to:
        if rename_to not in st.session_state.sessions and st.session_state.current_session in st.session_state.sessions:
            st.session_state.sessions[rename_to] = st.session_state.sessions.pop(st.session_state.current_session)
            st.session_state.current_session = rename_to
            st.rerun()
        else:
            st.warning("Session name already exists or current session not found.")

    # Add clear session button
    if st.button("🗑️ Clear Current Session"):
        if st.session_state.current_session in st.session_state.sessions:
            st.session_state.sessions[st.session_state.current_session] = []
            st.rerun()

# =============== Main App ==================
# st.sidebar.image("Assets-04.png", width=150)

# Inject Lexend Deca font and styling
st.markdown("""
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        .custom-title {
            font-family: 'Lexend Deca', sans-serif;
            color: #FF6B35; /* Bright Tonic orange */
            font-size: 38px;
            font-weight: 600;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);
        }
    </style>
""", unsafe_allow_html=True)

col1, col2 = st.columns([2, 4])
with col1:
    st.image("Asset-3.png", width=200)
with col2:
    # st.title("TONIC AI Assistant")
    st.markdown("<div class='custom-title'>TONIC AI Chatbot</div>", unsafe_allow_html=True)
#     st.markdown(
#     """
#     <h1 style='color: #D95B35; font-size: 55px;'>
#         TONIC AI Assistant
#     </h1>
#     """, 
#     unsafe_allow_html=True
# )




# st.title("TONIC AI Assistant")

# uploaded_files = st.file_uploader("📁 Upload PDF/XLSX files", type=["pdf", "xlsx"], accept_multiple_files=True)
uploaded_files = st.file_uploader("📁 Upload PDF/XLSX/CSV files", type=["pdf", "xlsx", "csv"], accept_multiple_files=True)


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
        st.error(f"Gemini failed to process {filename}")
        return ""

# File processing with improved error handling
if uploaded_files and not st.session_state.knowledge_base:
    full_text = ""
    progress_bar = st.progress(0)
    
    for i, file in enumerate(uploaded_files):
        progress_bar.progress((i + 1) / len(uploaded_files))
        
        if file.type == "application/pdf":
            text = process_pdf(file)
        elif file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            text = process_excel(file)
        elif file.type == "text/csv":
            text = process_csv(file)
        else:
            st.warning(f"Unsupported file type: {file.type}")
            continue

        if text:
            structured_output = extract_structured_info(text, file.name)
            if structured_output:
                full_text += f"\n\n--- Extracted from {file.name} ---\n\n{structured_output}"

    st.session_state.knowledge_base = full_text
    progress_bar.empty()

# ================= Chat =====================

st.subheader("💬 Ask a Question")

# Chat input with better UX
# col1, col2 = st.columns([4, 1])
# with col1:
#     user_input = st.text_input("Type your question", key="user_input", placeholder="Ask me anything about your uploaded documents or any general question...")
# with col2:
#     st.write("")  # Add some spacing
#     submit_btn = st.button("📤 Send", type="primary")

# # Also allow Enter key submission
# if user_input and (submit_btn or user_input != st.session_state.get('last_input', '')):
#     st.session_state.last_input = user_input

# Initialize session state
if "user_input" not in st.session_state:
    st.session_state.user_input = ""

if "messages" not in st.session_state:
    st.session_state.messages = []

# --- UI layout ---

st.markdown("""
    <style>
    div.stButton > button:first-child {
        width: 100%;
        height: 3em;
        font-size: 1.1em;
    }
    </style>
""", unsafe_allow_html=True)


col1, col2 = st.columns([6, 0.5])
with col1:
    with st.form("chat_form", clear_on_submit=True):
        user_input = st.text_area(
            "Type your question", 
            value=st.session_state.user_input,
            key="input_box",
            height=100,
            placeholder="Ask me anything about your uploaded documents or any general question..."
        )

        submitted = st.form_submit_button("📤 Send")

# col2 can be left empty or used for future enhancements
with col2:
    st.write("")

# --- Handle submission ---
if submitted and user_input.strip():
    st.session_state.messages.append(user_input.strip())
    st.session_state.user_input = ""  # Clear
    st.rerun()



# # --- Display chat history ---
# if st.session_state.messages:
#     st.markdown("### 💬 Chat History")
#     for msg in st.session_state.messages:
#         st.write(f"👤 {msg}")

# --- Display latest message only ---
if st.session_state.get("messages"):
    latest_msg = st.session_state.messages[-1]  # Get last item
    st.markdown("### 💬 Your Query")
    st.write(f"👤 {latest_msg}")





def extract_code(text):
    """Extract Python code from markdown code blocks"""
    match = re.search(r"```(?:python)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text.strip()

def generate_plot_code(knowledge, query, reply):
    """Generate matplotlib code for visualization"""
    system_prompt = "You are a Python assistant. Output only valid matplotlib code using data given to you. You can generate multiple plots, so generate code in that way. If there is no sufficient Knowledge Base data, rely on the Answer"
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
        return extract_code(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Code generation failed: {e}")
        return None

def get_gemini_response(prompt, conversation_history=None):
    """Get response from Gemini with conversation context"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Build conversation context
        if conversation_history:
            context = "Previous conversation:\n"
            for i, msg in enumerate(conversation_history[-5:]):  # Last 5 messages for context
                context += f"User: {msg['q']}\nAssistant: {msg['a']}\n\n"
            
            full_prompt = context + "Current question:\n" + prompt
        else:
            full_prompt = prompt
            
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return f"❌ Gemini error: {e}"
    
def get_openai_response(prompt, conversation_history=None):
    """
    Get response from OpenAI chat model using `openai_client.chat.completions.create`.
    Supports conversation history (last 5 turns).
    """
    try:
        messages = []

        # Add past messages if available
        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["q"]})
                messages.append({"role": "assistant", "content": turn["a"]})

        # Append the current prompt
        messages.append({"role": "user", "content": prompt})

        # Create the completion
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return f"❌ OpenAI error: {e}"


def get_perplexity_response(prompt, conversation_history=None, model="sonar"):
    """
    Get response from Perplexity API with optional conversation history.
    """
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
            # Optional: Extract citation metadata if present
            
            # citations_dic = response.json()["search_results"]
            citations = ""

            for j in response.json()["search_results"]:
                tmp_c = j.get('title') + " - " + j.get('url')
                print(tmp_c)
                citations = citations + tmp_c + " \n "
            
            return response.json()["choices"][0]["message"]["content"], citations

        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return f"❌ Perplexity error: {response.status_code}: {response.text}", ""

    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"❌ Perplexity error: {e}", ""

# if user_input and (submitted or user_input != st.session_state.get('last_input', '')):



# === INITIAL STATE SETUP === #
if "plot_buffer" not in st.session_state:
    st.session_state.plot_buffer = None
if "plot_generated" not in st.session_state:
    st.session_state.plot_generated = False
if "plot_code" not in st.session_state:
    st.session_state.plot_code = ""
if "tables" not in st.session_state:
    st.session_state.tables = {}
if "last_input" not in st.session_state:
    st.session_state.last_input = ""
if "gemini_reply" not in st.session_state:
    st.session_state.gemini_reply = ""
if "gemini_sources" not in st.session_state:
    st.session_state.gemini_sources = []




# === HANDLE NEW USER INPUT ONLY === #
new_input = user_input and (submitted or user_input.strip() != st.session_state.last_input)

if new_input:
    st.session_state.last_input = user_input.strip()
    st.session_state.plot_generated = False
    st.session_state.plot_buffer = None
    st.session_state.plot_figure = None
    st.session_state.plot_code = None
    st.session_state.tables[st.session_state.current_session] = []

    # base_chat_prompt = """<...your full base prompt here...>"""
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

"- Also provide list of sources/URLs as Sources:\n"
"  from where you have gathered all the data (list no more than 5)\n"
"  - ALSO NEVER LIST ANY SOURCES RELATED TO FORMATTING, ETC. LIST ONLY DATA SOURCES"
)

    kb = st.session_state.knowledge_base
    if isinstance(kb, list):
        kb = "\n".join(kb)

    full_prompt = (
        f"{base_chat_prompt}\n\n"
        f"Knowledge Base:\n{kb}\n\n"
        f"Current Question:\n{user_input}"
    )

    curr_id = st.session_state.current_session
    conversation_history = st.session_state.sessions.get(curr_id, [])

    gemini_reply, gemini_sources = get_perplexity_response(full_prompt, conversation_history)

    st.session_state.gemini_reply = gemini_reply
    st.session_state.gemini_sources = gemini_sources

    # for storing graphs
    # plot_data = None
    # if st.session_state.get("plot_buffer"):
    #     plot_data = base64.b64encode(st.session_state.plot_buffer.getvalue()).decode("utf-8")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    st.session_state.sessions[curr_id].append({
        "q": user_input,
        "a": gemini_reply,
        "timestamp": timestamp
    })

    # ========== PLOT GENERATION ========== #
    if any(word in user_input.lower() for word in ["graph", "plot", "chart", "visual"]):
        if user_input != st.session_state.get('last_plot_input'):
            st.session_state.last_plot_input = user_input
            st.session_state.plot_buffer = None
            st.session_state.plot_figure = None
            st.session_state.plot_generated = False

            for attempt in range(3):
                with st.spinner(f"Generating visual... Attempt {attempt+1}"):
                    plot_code = generate_plot_code(
                        st.session_state.knowledge_base,
                        user_input,
                        gemini_reply
                    )

                    if plot_code:
                        try:
                            plt.clf()
                            exec_globals = {"plt": plt, "__name__": "__main__", "pd": pd}
                            plot_code = re.sub(r"plt\\.show\\(\\)", "", plot_code)
                            exec(plot_code, exec_globals)

                            fig = plt.gcf()
                            # st.pyplot(fig)

                            buf = io.BytesIO()
                            fig.savefig(buf, format="png", dpi=300, bbox_inches='tight')
                            buf.seek(0)

                            st.session_state.plot_buffer = buf
                            st.session_state.plot_figure = fig
                            st.session_state.plot_code = plot_code
                            st.session_state.plot_generated = True
                            break

                        except Exception as e:
                            st.error(f"⚠️ Plot failed: {e}")
        else:
            if st.session_state.get("plot_figure"):
                st.pyplot(st.session_state.plot_figure)

    # ========== TABLE EXTRACTION ========== #
    tables = []
    if "|" in gemini_reply:
        try:
            lines = gemini_reply.split('\n')
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
                        tables.append(df)

            logger.info(f"✅ Found {len(tables)} markdown tables")

        except Exception as e:
            logger.error(f"Markdown table extraction error: {e}")

        if tables:
            st.session_state.tables[st.session_state.current_session] = tables
            st.success(f"✅ Found {len(tables)} table(s) in the response")

# === ALWAYS SHOW LATEST GEMINI REPLY === #
st.markdown("### 🤖 Assistant Response:")
st.markdown(st.session_state.gemini_reply)

# === ALWAYS SHOW PLOT IF AVAILABLE === #
if st.session_state.get("plot_generated") and st.session_state.get("plot_buffer"):
    st.pyplot(st.session_state.plot_figure)
    st.download_button(
        label="📥 Download Plot as PNG",
        data=st.session_state.plot_buffer,
        file_name="plot.png",
        mime="image/png",
        key=f"download_plot_{hash(st.session_state.plot_code)}"
    )

# === ALWAYS SHOW TABLES IF AVAILABLE === #
tables = st.session_state.tables.get(st.session_state.current_session, [])
for idx, df in enumerate(tables):
    with st.expander(f"📊 Table {idx + 1}"):
        st.dataframe(df, use_container_width=True)
        csv = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label=f"⬇️ Download Table {idx + 1} as CSV",
            data=csv,
            file_name=f"table_{idx + 1}_{st.session_state.current_session}_{len(st.session_state.sessions[st.session_state.current_session])}.csv",
            mime="text/csv",
            key=f"download_table_{st.session_state.current_session}_{idx}"
        )









# ========== Chat History ==========
curr_id = st.session_state.current_session
if curr_id in st.session_state.sessions and st.session_state.sessions[curr_id]:
    st.markdown("---")
    st.subheader(f"📜 Chat History: {curr_id}")
    
    # Add option to show/hide chat history
    show_history = st.checkbox("Show chat history", value=True)
    
    if show_history:
        # Reverse order to show newest first
        for i, msg in enumerate(reversed(st.session_state.sessions[curr_id])):
            actual_index = len(st.session_state.sessions[curr_id]) - i
            timestamp = msg.get('timestamp', 'No timestamp')
            
            with st.expander(f"💬 Message {actual_index}: {msg['q'][:50]}... | {timestamp}"):
                st.markdown(f"**🙋 User:** {msg['q']}")
                st.markdown("**🤖 Assistant:**")
                st.markdown(msg['a'])

            # with st.expander(f"💬 Message {actual_index}: {msg['q'][:50]}... | {timestamp}"):
            #     st.markdown(f"**🙋 User:** {msg['q']}")
            #     st.markdown("**🤖 Assistant:**")
            #     st.markdown(msg['a'])

            #     # Display plot if it exists
            #     if msg.get("plot"):
            #         st.markdown("**📊 Generated Plot:**")
            #         st.image(f"data:image/png;base64,{msg['plot']}", use_column_width=True)

            #     if st.button(f"📋 Copy Response", key=f"copy_{actual_index}"):
            #         st.code(msg['a'])


            #     # Add copy button for individual messages
            #     if st.button(f"📋 Copy Response", key=f"copy_{actual_index}"):
            #         st.code(msg['a'])
    
    # Add export chat history functionality
    if st.button("📥 Export Chat History"):
        chat_export = ""
        for i, msg in enumerate(st.session_state.sessions[curr_id]):
            timestamp = msg.get('timestamp', 'No timestamp')
            chat_export += f"=== Message {i+1} | {timestamp} ===\n"
            chat_export += f"User: {msg['q']}\n\n"
            chat_export += f"Assistant: {msg['a']}\n\n"
            chat_export += "-" * 50 + "\n\n"
        
        st.download_button(
            "💾 Download Chat History",
            chat_export.encode('utf-8'),
            file_name=f"chat_history_{curr_id}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mime="text/plain"
        )

# ========== Knowledge Base Status ==========
if st.session_state.knowledge_base:
    with st.expander("📚 Knowledge Base Status"):
        kb_length = len(str(st.session_state.knowledge_base))
        st.write(f"Knowledge base contains {kb_length} characters")
        if st.button("🗑️ Clear Knowledge Base"):
            st.session_state.knowledge_base = []
            st.rerun()