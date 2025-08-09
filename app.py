import streamlit as st
import matplotlib.pyplot as plt
import io
import pandas as pd
import re
import datetime
import time

# Import custom modules
from utils import (
    load_css, load_fonts, initialize_session_state, 
    process_pdf, process_excel, process_csv, get_timestamp,
    get_user_credentials, check_persistent_login, 
    set_persistent_login, clear_persistent_login, logger
)
from api_handlers import (
    extract_structured_info, generate_plot_code, 
    get_perplexity_response, get_chat_prompt
)

# ✅ Must be the first Streamlit command
st.set_page_config(page_title="TONIC AI Assistant", layout="wide")

# Load CSS and fonts
load_css("assets/styles.css")
load_fonts()

# Initialize session state
initialize_session_state()
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
        
        # Form fields with better spacing - Using form for Enter key support
        with st.form("login_form", clear_on_submit=False):
            st.markdown('<div style="margin-top: 25px;">', unsafe_allow_html=True)
            st.markdown('<label class="form-label">Email</label>', unsafe_allow_html=True)
            username_input = st.text_input("", placeholder="example@gmail.com", label_visibility="collapsed", key="username")
            
            st.markdown('<div style="margin-top: 20px;">', unsafe_allow_html=True)
            st.markdown('<label class="form-label">Password</label>', unsafe_allow_html=True)
            password_input = st.text_input("", placeholder="••••••••••", label_visibility="collapsed", key="password", type="password")
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Remember me and forgot password
            st.markdown('<div style="margin-top: 15px; margin-bottom: 25px;">', unsafe_allow_html=True)
            col_check, col_forgot = st.columns([1, 1])
            with col_check:
                remember_me = st.checkbox("Remember me", value=True)
            with col_forgot:
                st.markdown('<a href="#" class="forgot-link">Forgot Password?</a>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Login button - Now inside form for Enter key support
            login_btn = st.form_submit_button("Login", type="primary", use_container_width=True)
        
        # Register link (outside form)
        st.markdown('<div class="register-text" style="margin-top: 20px;">Don\'t have an account? <a href="#" class="register-link">Register</a></div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)








    USERS = get_user_credentials()

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





# --- UI layout ---


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





# --- Display latest message only ---
if st.session_state.get("messages"):
    latest_msg = st.session_state.messages[-1]  # Get last item
    st.markdown("### 💬 Your Query")
    st.write(f"👤 {latest_msg}")



# === HANDLE NEW USER INPUT ONLY === #
new_input = user_input and (submitted or user_input.strip() != st.session_state.last_input)

if new_input:
    st.session_state.last_input = user_input.strip()
    st.session_state.plot_generated = False
    st.session_state.plot_buffer = None
    st.session_state.plot_figure = None
    st.session_state.plot_code = None
    st.session_state.tables[st.session_state.current_session] = []

    base_chat_prompt = get_chat_prompt()

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

    timestamp = get_timestamp()
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