# Database Setup Guide for TONIC AI Backend

## PostgreSQL Database Configuration

Your Flask backend has been configured to connect to PostgreSQL with the following credentials:

- **Host**: localhost
- **Port**: 5432
- **Database**: my_new_db
- **Username**: admin
- **Password**: password

## Setup Steps

### 1. Install PostgreSQL Dependencies

```bash
cd react-app/server
pip install -r requirements.txt
```

### 2. Create PostgreSQL Database

Make sure PostgreSQL is running and create the database:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE my_new_db;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE my_new_db TO admin;
\q
```

### 3. Set Environment Variables

Create a `.env` file in the `react-app/server/` directory:

```bash
cp env_template.txt .env
```

Edit the `.env` file with your actual API keys and configuration.

### 4. Initialize Database

Run the database initialization script:

```bash
python init_db.py
```

This will:
- Create all necessary tables
- Add default users (admin@123/admin123, demo/demo123)
- Test the database connection

### 5. Start the Flask Application

```bash
python app.py
```

## Database Schema

The application creates the following tables:

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password_hash`: Password (currently stored as plain text - should be hashed in production)
- `created_at`: User creation timestamp

### Chat Sessions Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `session_name`: Name of the chat session
- `created_at`: Session creation timestamp

### Chat Messages Table
- `id`: Primary key
- `session_id`: Foreign key to chat_sessions table
- `question`: User's question
- `answer`: AI's response
- `timestamp`: Message timestamp

### Knowledge Bases Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `content`: Knowledge base content
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Testing the Connection

You can test the database connection by visiting:
```
http://localhost:5000/api/health
```

This endpoint will show the database connection status.

## Troubleshooting

### Connection Issues
1. Ensure PostgreSQL is running
2. Verify database credentials
3. Check if the database `my_new_db` exists
4. Ensure user `admin` has proper permissions

### Permission Issues
```sql
-- Grant additional permissions if needed
GRANT ALL ON SCHEMA public TO admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;
```

### Port Issues
If PostgreSQL is running on a different port, update the `DATABASE_URL` in your `.env` file:
```
DATABASE_URL=postgresql://admin:password@localhost:YOUR_PORT/my_new_db
```
