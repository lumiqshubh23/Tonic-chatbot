#!/usr/bin/env python3
"""
Test script for TONIC AI Backend APIs
This script tests the database connection and API endpoints.
"""

import requests
import json
import sys
import time

# API base URL
BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_login():
    """Test login and get JWT token"""
    print("\n🔐 Testing login...")
    try:
        login_data = {
            "username": "admin@123",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/api/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data['username']}")
            return data.get('token')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_chat_history_apis(token):
    """Test chat history APIs"""
    if not token:
        print("❌ No token available for testing chat history APIs")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📝 Testing Chat History APIs...")
    
    # Test 1: Create a new chat session
    print("1. Creating new chat session...")
    try:
        session_data = {"session_name": "Test Session"}
        response = requests.post(f"{BASE_URL}/api/chat-history", json=session_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            session_id = data['session']['id']
            print(f"✅ Session created: {session_id}")
        else:
            print(f"❌ Session creation failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Session creation error: {e}")
        return
    
    # Test 2: Add a message to the session
    print("2. Adding message to session...")
    try:
        message_data = {
            "question": "What is artificial intelligence?",
            "answer": "Artificial intelligence is a branch of computer science that aims to create intelligent machines."
        }
        response = requests.post(f"{BASE_URL}/api/chat-history/{session_id}/messages", 
                               json=message_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            message_id = data['chat_message']['id']
            print(f"✅ Message added: {message_id}")
        else:
            print(f"❌ Message addition failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Message addition error: {e}")
    
    # Test 3: Get session history
    print("3. Getting session history...")
    try:
        response = requests.get(f"{BASE_URL}/api/chat-history/{session_id}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session history retrieved: {data['session']['message_count']} messages")
        else:
            print(f"❌ Session history retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Session history retrieval error: {e}")
    
    # Test 4: Get all chat history
    print("4. Getting all chat history...")
    try:
        response = requests.get(f"{BASE_URL}/api/chat-history", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ All chat history retrieved: {data['total_sessions']} sessions")
        else:
            print(f"❌ All chat history retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ All chat history retrieval error: {e}")
    
    # Test 5: Search chat history
    print("5. Searching chat history...")
    try:
        response = requests.get(f"{BASE_URL}/api/chat-history/search?q=artificial", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Search completed: {data['total_results']} results found")
        else:
            print(f"❌ Search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Search error: {e}")
    
    # Test 6: Export session
    print("6. Exporting session...")
    try:
        response = requests.get(f"{BASE_URL}/api/chat-history/export/{session_id}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session exported: {data['export_data']['session_info']['total_messages']} messages")
        else:
            print(f"❌ Export failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Export error: {e}")
    
    # Test 7: Update session name
    print("7. Updating session name...")
    try:
        update_data = {"session_name": "Updated Test Session"}
        response = requests.put(f"{BASE_URL}/api/chat-history/{session_id}", 
                              json=update_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Session updated: {data['session']['session_name']}")
        else:
            print(f"❌ Session update failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Session update error: {e}")
    
    # Test 8: Delete the test session
    print("8. Cleaning up - deleting test session...")
    try:
        response = requests.delete(f"{BASE_URL}/api/chat-history/{session_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Test session deleted successfully")
        else:
            print(f"❌ Session deletion failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Session deletion error: {e}")

def test_legacy_apis(token):
    """Test legacy session management APIs"""
    if not token:
        print("❌ No token available for testing legacy APIs")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔄 Testing Legacy Session APIs...")
    
    # Test 1: Get sessions
    print("1. Getting sessions...")
    try:
        response = requests.get(f"{BASE_URL}/api/sessions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sessions retrieved: {len(data['sessions'])} sessions")
        else:
            print(f"❌ Sessions retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Sessions retrieval error: {e}")
    
    # Test 2: Create session
    print("2. Creating legacy session...")
    try:
        session_data = {"session_name": "Legacy Test Session"}
        response = requests.post(f"{BASE_URL}/api/sessions", json=session_data, headers=headers)
        if response.status_code == 200:
            print("✅ Legacy session created")
        else:
            print(f"❌ Legacy session creation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Legacy session creation error: {e}")

def main():
    """Main test function"""
    print("🚀 TONIC AI Backend API Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Health check failed. Make sure the server is running.")
        sys.exit(1)
    
    # Test 2: Login
    token = test_login()
    if not token:
        print("\n❌ Login failed. Check database and user credentials.")
        sys.exit(1)
    
    # Test 3: Chat History APIs
    test_chat_history_apis(token)
    
    # Test 4: Legacy APIs
    test_legacy_apis(token)
    
    print("\n✅ All tests completed!")
    print("🎉 Your TONIC AI Backend is working correctly!")

if __name__ == "__main__":
    main()
