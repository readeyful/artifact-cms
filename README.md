# Claude Artifact CMS - Multi-User Edition

A collaborative artifact management system allowing multiple users to create, share, and preview Claude-generated artifacts.

## Features

### 🔐 Authentication
- User registration and login
- Secure JWT-based authentication
- Password hashing with bcrypt

### 📦 Artifact Management
- Create, edit, and delete artifacts
- Support for HTML, React, Markdown, Mermaid, and SVG
- Public/private visibility control
- Real-time preview in modal

### 👥 Social Features
- Like/unlike artifacts
- View artifacts from other users
- Filter by user (my artifacts, public artifacts)
- See who created each artifact

### 🔍 Search & Filter
- Search by title, description, tags, or username
- Filter by artifact type
- Filter by scope (all/mine/public)

### 💾 Database
- SQLite database for persistence
- Stores users, artifacts, and likes
- Automatic timestamps

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

The server will start on `http://localhost:3000`

3. **Access the application:**
Open your browser and navigate to `http://localhost:3000`

## Usage

### First Time Setup
1. Click "Register" to create a new account
2. Enter username, email, and password (minimum 6 characters)
3. You'll be automatically logged in

### Adding Artifacts
1. Fill in the artifact form:
   - Title (required)
   - Type (HTML, React, Markdown, Mermaid, SVG)
   - Description (optional)
   - Tags (comma-separated, optional)
   - Code (required)
   - Public checkbox (make visible to all users)
2. Click "Add Artifact"

### Managing Artifacts
- **Preview**: Click the green "Preview" button to see your artifact rendered
- **Edit**: Click the blue edit icon (only on your own artifacts)
- **Delete**: Click the red trash icon (only on your own artifacts)
- **Copy**: Click the gray copy icon to copy the code to clipboard
- **Like**: Click the heart icon to like/unlike artifacts

### Viewing Others' Artifacts
- Public artifacts from other users appear in your feed
- Use the "Public Artifacts" filter to see only shared artifacts
- You can preview and like others' artifacts
- You cannot edit or delete artifacts you don't own

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Artifacts
- `GET /api/artifacts` - Get all accessible artifacts
- `GET /api/artifacts/:id` - Get single artifact
- `POST /api/artifacts` - Create new artifact
- `PUT /api/artifacts/:id` - Update artifact
- `DELETE /api/artifacts/:id` - Delete artifact
- `POST /api/artifacts/:id/like` - Toggle like on artifact

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `created_at` - Timestamp

### Artifacts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Artifact title
- `type` - Artifact type (html, react, etc.)
- `description` - Optional description
- `code` - Artifact code
- `tags` - Comma-separated tags
- `is_public` - Boolean for visibility
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Likes Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `artifact_id` - Foreign key to artifacts
- `created_at` - Timestamp

## Security Notes

⚠️ **Important for Production:**

1. **Change the JWT secret** in `server.js`:
   ```javascript
   const JWT_SECRET = 'your-secure-random-secret-key-here';
   ```

2. **Use environment variables:**
   ```javascript
   const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
   const PORT = process.env.PORT || 3000;
   ```

3. **Add HTTPS** in production

4. **Rate limiting** for API endpoints

5. **Input validation** and sanitization

6. **Database backups** regularly

## Technology Stack

### Backend
- Express.js - Web framework
- SQLite3 - Database
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- cors - Cross-origin resource sharing

### Frontend
- React 18 - UI framework
- Tailwind CSS - Styling
- Lucide React - Icons

## Development

### Run with auto-reload:
```bash
npm run dev
```

### Database location:
The SQLite database is stored in `./artifacts.db`

To reset the database, simply delete this file and restart the server.

## Troubleshooting

### Port already in use
Change the PORT in `server.js`:
```javascript
const PORT = 3001; // or any available port
```

### CORS errors
Make sure the API_URL in `public/index.jsx` matches your server URL:
```javascript
const API_URL = 'http://localhost:3000/api';
```

### Database errors
Delete `artifacts.db` and restart to recreate tables

## License

MIT License - Feel free to use and modify for your needs!
