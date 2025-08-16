#!/usr/bin/env python3

import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Environment variables that might affect OpenAI:")
proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']
for var in proxy_vars:
    if var in os.environ:
        print(f"{var}: {os.environ[var]}")

print("\nOpenAI API Key present:", bool(os.getenv("OPENAI_API_KEY")))

print("\nTrying to initialize OpenAI client...")
try:
    # Clear any proxy environment variables
    for var in proxy_vars:
        if var in os.environ:
            print(f"Clearing {var}")
            del os.environ[var]
    
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✅ OpenAI client initialized successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"Error type: {type(e)}")
    
    # Try to see what parameters are being passed
    import inspect
    try:
        # This will show us what parameters the OpenAI client is receiving
        print("\nTrying to inspect the OpenAI client initialization...")
        client = openai.OpenAI.__new__(openai.OpenAI)
        print("✅ OpenAI client created without initialization!")
    except Exception as e2:
        print(f"❌ Even creation failed: {e2}")
