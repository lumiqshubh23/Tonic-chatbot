# TONIC AI Backend API Documentation

## Database Configuration

The application uses PostgreSQL with the following configuration:
- **Host**: localhost
- **Port**: 5432
- **Database**: my_new_db
- **Username**: admin
- **Password**: password

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Authentication

#### Login
- **POST** `/api/login`
- **Body**: `{"username": "string", "password": "string"}`
- **Response**: `{"success": true, "token": "jwt_token", "username": "string"}`

#### Logout
- **POST** `/api/logout`
- **Headers**: Authorization required
- **Response**: `{"success": true, "message": "Logged out successfully"}`

### 2. Chat History APIs

#### Get All Chat History
- **GET** `/api/chat-history`
- **Headers**: Authorization required
- **Response**:
```json
{
  "success": true,
  "chat_history": [
    {
      "session_id": 1,
      "session_name": "Session Name",
      "created_at": "2024-01-01T00:00:00",
      "message_count": 5,
      "messages": [
        {
          "id": 1,
          "question": "User question",
          "answer": "AI response",
          "timestamp": "2024-01-01T00:00:00"
        }
      ]
    }
  ],
  "total_sessions": 1
}
```

#### Get Specific Session History
- **GET** `/api/chat-history/{session_id}`
- **Headers**: Authorization required
- **Response**:
```json
{
  "success": true,
  "session": {
    "session_id": 1,
    "session_name": "Session Name",
    "created_at": "2024-01-01T00:00:00",
    "message_count": 5,
    "messages": [...]
  }
}
```

#### Create New Chat Session
- **POST** `/api/chat-history`
- **Headers**: Authorization required
- **Body**: `{"session_name": "New Session Name"}`
- **Response**:
```json
{
  "success": true,
  "message": "Chat session created successfully",
  "session": {
    "id": 1,
    "session_name": "New Session Name",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

#### Update Chat Session Name
- **PUT** `/api/chat-history/{session_id}`
- **Headers**: Authorization required
- **Body**: `{"session_name": "Updated Session Name"}`
- **Response**:
```json
{
  "success": true,
  "message": "Session updated successfully",
  "session": {
    "id": 1,
    "session_name": "Updated Session Name",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

#### Delete Chat Session
- **DELETE** `/api/chat-history/{session_id}`
- **Headers**: Authorization required
- **Response**: `{"success": true, "message": "Session deleted successfully"}`

#### Add Message to Session
- **POST** `/api/chat-history/{session_id}/messages`
- **Headers**: Authorization required
- **Body**: `{"question": "User question", "answer": "AI response"}`
- **Response**:
```json
{
  "success": true,
  "message": "Message added successfully",
  "chat_message": {
    "id": 1,
    "question": "User question",
    "answer": "AI response",
    "timestamp": "2024-01-01T00:00:00"
  }
}
```

#### Delete Specific Message
- **DELETE** `/api/chat-history/{session_id}/messages/{message_id}`
- **Headers**: Authorization required
- **Response**: `{"success": true, "message": "Message deleted successfully"}`

#### Search Chat History
- **GET** `/api/chat-history/search?q={search_query}`
- **Headers**: Authorization required
- **Response**:
```json
{
  "success": true,
  "search_results": [
    {
      "message_id": 1,
      "session_id": 1,
      "session_name": "Session Name",
      "question": "User question",
      "answer": "AI response",
      "timestamp": "2024-01-01T00:00:00"
    }
  ],
  "total_results": 1,
  "query": "search term"
}
```

#### Export Chat Session
- **GET** `/api/chat-history/export/{session_id}`
- **Headers**: Authorization required
- **Response**:
```json
{
  "success": true,
  "export_data": {
    "session_info": {
      "session_id": 1,
      "session_name": "Session Name",
      "created_at": "2024-01-01T00:00:00",
      "exported_at": "2024-01-01T00:00:00",
      "total_messages": 5
    },
    "messages": [...]
  }
}
```

### 3. Legacy Session Management (In-Memory)

#### Get Sessions
- **GET** `/api/sessions`
- **Headers**: Authorization required
- **Response**: `{"success": true, "sessions": ["session1", "session2"]}`

#### Create Session
- **POST** `/api/sessions`
- **Headers**: Authorization required
- **Body**: `{"session_name": "New Session"}`
- **Response**: `{"success": true, "message": "Session created successfully"}`

#### Delete Session
- **DELETE** `/api/sessions/{session_name}`
- **Headers**: Authorization required
- **Response**: `{"success": true, "message": "Session deleted successfully"}`

#### Clear Session
- **POST** `/api/sessions/{session_name}/clear`
- **Headers**: Authorization required
- **Response**: `{"success": true, "message": "Session cleared successfully"}`

#### Get Session Messages
- **GET** `/api/sessions/{session_name}/messages`
- **Headers**: Authorization required
- **Response**: `{"success": true, "messages": [...]}`

### 4. File Upload

#### Upload Files
- **POST** `/api/upload`
- **Headers**: Authorization required
- **Body**: FormData with files
- **Response**: `{"success": true, "message": "Files processed successfully", "knowledge_base": "extracted_text"}`

### 5. Chat

#### Send Message
- **POST** `/api/chat`
- **Headers**: Authorization required
- **Body**: `{"question": "string", "knowledge_base": "string", "conversation_history": [], "session_name": "string"}`
- **Response**:
```json
{
  "success": true,
  "response": "AI response",
  "timestamp": "2024-01-01T00:00:00",
  "tables": [],
  "plot": "base64_image_data",
  "plot_code": "matplotlib_code",
  "sources": "citations"
}
```

### 6. Health Check

#### Health Check
- **GET** `/api/health`
- **Response**: `{"status": "healthy", "message": "TONIC AI Backend is running", "database": "connected"}`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_name)
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Knowledge Bases Table
```sql
CREATE TABLE knowledge_bases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize Database**:
   ```bash
   python init_db.py
   ```

3. **Start the Server**:
   ```bash
   python app.py
   ```

## Error Handling

All API endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- **200**: Success
- **400**: Bad Request
- **401**: Unauthorized
- **404**: Not Found
- **500**: Internal Server Error

## Notes

- The application maintains both in-memory sessions (legacy) and database storage
- Chat messages are automatically saved to the database when using the `/api/chat` endpoint
- All database operations include proper error handling and rollback mechanisms
- The application includes comprehensive logging for debugging
