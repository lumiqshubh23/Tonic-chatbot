import streamlit as st
import subprocess
import os
import sys
import time
import requests
from pathlib import Path

# Set page config
st.set_page_config(
    page_title="TONIC AI Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

def check_backend_health():
    """Check if the Flask backend is running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend_server():
    """Start the Flask backend server"""
    server_path = Path(__file__).parent / "server" / "app.py"
    if server_path.exists():
        try:
            # Start the Flask server in a subprocess
            subprocess.Popen([
                sys.executable, str(server_path)
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception as e:
            st.error(f"Failed to start backend server: {e}")
            return False
    else:
        st.error("Backend server file not found")
        return False

def build_react_app():
    """Build the React application"""
    react_path = Path(__file__).parent
    try:
        # Install dependencies if needed
        if not (react_path / "node_modules").exists():
            st.info("Installing React dependencies...")
            subprocess.run(["npm", "install"], cwd=react_path, check=True)
        
        # Build the React app
        st.info("Building React application...")
        subprocess.run(["npm", "run", "build"], cwd=react_path, check=True)
        return True
    except subprocess.CalledProcessError as e:
        st.error(f"Failed to build React app: {e}")
        return False

def serve_react_app():
    """Serve the built React application"""
    build_path = Path(__file__).parent / "build"
    if build_path.exists():
        # Read the built index.html
        index_path = build_path / "index.html"
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Inject Streamlit-specific modifications
            html_content = html_content.replace(
                '<head>',
                '<head><base href="/" />'
            )
            
            # Display the React app
            st.components.v1.html(html_content, height=800, scrolling=True)
        else:
            st.error("Built React app not found. Please build the app first.")
    else:
        st.error("Build directory not found. Please build the React app first.")

def main():
    st.title("🤖 TONIC AI Assistant")
    st.markdown("---")
    
    # Check if backend is running
    if not check_backend_health():
        st.warning("Backend server is not running. Starting it now...")
        if start_backend_server():
            # Wait for server to start
            with st.spinner("Starting backend server..."):
                for i in range(30):  # Wait up to 30 seconds
                    if check_backend_health():
                        st.success("Backend server started successfully!")
                        break
                    time.sleep(1)
                else:
                    st.error("Backend server failed to start")
                    return
        else:
            st.error("Failed to start backend server")
            return
    
    # Build React app if needed
    build_path = Path(__file__).parent / "build"
    if not build_path.exists():
        if st.button("Build React Application"):
            if build_react_app():
                st.success("React app built successfully!")
                st.rerun()
            else:
                st.error("Failed to build React app")
                return
        else:
            st.info("Please build the React application first")
            return
    
    # Serve the React app
    serve_react_app()

if __name__ == "__main__":
    main()
