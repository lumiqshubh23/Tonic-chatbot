#!/bin/bash

# Check if virtual environment exists
if [ -d "tonic_env" ]; then
    echo "Activating virtual environment..."
    source tonic_env/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv tonic_env
    source tonic_env/bin/activate
    echo "Installing requirements..."
    pip install -r requirements.txt
fi

# Install streamlit if not already installed
pip install streamlit

# Run the application
echo "Starting TONIC AI Chat Application..."
streamlit run app.py --server.port 8501 --server.address 0.0.0.0

