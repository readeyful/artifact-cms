const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./artifacts.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Artifacts table
    db.run(`CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      tags TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Likes table
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      artifact_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id),
      UNIQUE(user_id, artifact_id)
    )`);

    console.log('Database tables initialized');
  });
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: this.lastID, username, email } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Create artifact
app.post('/api/artifacts', authenticateToken, (req, res) => {
  const { title, type, description, code, tags, isPublic } = req.body;

  if (!title || !type || !code) {
    return res.status(400).json({ error: 'Title, type, and code are required' });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';

  db.run(
    'INSERT INTO artifacts (user_id, title, type, description, code, tags, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, title, type, description, code, tagsStr, isPublic ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating artifact' });
      }

      db.get('SELECT * FROM artifacts WHERE id = ?', [this.lastID], (err, artifact) => {
        if (err) {
          return res.status(500).json({ error: 'Error retrieving artifact' });
        }
        res.json(formatArtifact(artifact));
      });
    }
  );
});

// Get all artifacts (user's own + public ones)
app.get('/api/artifacts', authenticateToken, (req, res) => {
  const query = `
    SELECT a.*, u.username, 
      (SELECT COUNT(*) FROM likes WHERE artifact_id = a.id) as like_count,
      (SELECT COUNT(*) FROM likes WHERE artifact_id = a.id AND user_id = ?) as user_liked
    FROM artifacts a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ? OR a.is_public = 1
    ORDER BY a.updated_at DESC
  `;

  db.all(query, [req.user.id, req.user.id], (err, artifacts) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching artifacts' });
    }
    res.json(artifacts.map(formatArtifact));
  });
});

// Get single artifact
app.get('/api/artifacts/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT a.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE artifact_id = a.id) as like_count,
      (SELECT COUNT(*) FROM likes WHERE artifact_id = a.id AND user_id = ?) as user_liked
    FROM artifacts a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = ? AND (a.user_id = ? OR a.is_public = 1)
  `;

  db.get(query, [req.user.id, req.params.id, req.user.id], (err, artifact) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching artifact' });
    }
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json(formatArtifact(artifact));
  });
});

// Update artifact
app.put('/api/artifacts/:id', authenticateToken, (req, res) => {
  const { title, type, description, code, tags, isPublic } = req.body;
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';

  db.run(
    `UPDATE artifacts 
     SET title = ?, type = ?, description = ?, code = ?, tags = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [title, type, description, code, tagsStr, isPublic ? 1 : 0, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating artifact' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Artifact not found or unauthorized' });
      }

      db.get('SELECT * FROM artifacts WHERE id = ?', [req.params.id], (err, artifact) => {
        if (err) {
          return res.status(500).json({ error: 'Error retrieving artifact' });
        }
        res.json(formatArtifact(artifact));
      });
    }
  );
});

// Delete artifact
app.delete('/api/artifacts/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM artifacts WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting artifact' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Artifact not found or unauthorized' });
      }
      res.json({ message: 'Artifact deleted successfully' });
    }
  );
});

// Toggle like
app.post('/api/artifacts/:id/like', authenticateToken, (req, res) => {
  const artifactId = req.params.id;
  const userId = req.user.id;

  // Check if already liked
  db.get(
    'SELECT * FROM likes WHERE user_id = ? AND artifact_id = ?',
    [userId, artifactId],
    (err, like) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      if (like) {
        // Unlike
        db.run('DELETE FROM likes WHERE id = ?', [like.id], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error removing like' });
          }
          res.json({ liked: false });
        });
      } else {
        // Like
        db.run(
          'INSERT INTO likes (user_id, artifact_id) VALUES (?, ?)',
          [userId, artifactId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error adding like' });
            }
            res.json({ liked: true });
          }
        );
      }
    }
  );
});

// Helper function to format artifact
function formatArtifact(artifact) {
  return {
    ...artifact,
    tags: artifact.tags ? artifact.tags.split(',') : [],
    isPublic: Boolean(artifact.is_public),
    userLiked: Boolean(artifact.user_liked),
    likeCount: artifact.like_count || 0
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
