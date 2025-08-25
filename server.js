require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { Client: PostgresClient } = require('pg');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
}

function generateServerUserId(clientIP) {
    return crypto.createHash('sha256').update(clientIP).digest('hex').substring(0, 16);
}

let db;

// Initialize database based on environment
async function initializeDatabase() {
    if (DATABASE_TYPE === 'postgres') {
        // PostgreSQL configuration
        db = new PostgresClient({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'radiocalico',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
        });

        try {
            await db.connect();
            console.log('Connected to PostgreSQL database');
            
            // Create table if not exists (PostgreSQL syntax)
            await db.query(`CREATE TABLE IF NOT EXISTS track_ratings (
                id SERIAL PRIMARY KEY,
                track_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(track_id, user_id)
            )`);
        } catch (err) {
            console.error('Error connecting to PostgreSQL:', err.message);
            process.exit(1);
        }
    } else {
        // SQLite configuration (default)
        const dbPath = process.env.NODE_ENV === 'production' ? '/app/data/database.db' : './database.db';
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                
                // Create table if not exists (SQLite syntax)
                db.run(`CREATE TABLE IF NOT EXISTS track_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    track_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(track_id, user_id)
                )`);
            }
        });
    }
}

// Database query wrapper
function dbQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        if (DATABASE_TYPE === 'postgres') {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve(result.rows);
            });
        } else {
            if (query.includes('SELECT')) {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        }
    });
}

// Single row query wrapper
function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        if (DATABASE_TYPE === 'postgres') {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve(result.rows[0] || null);
            });
        } else {
            db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        }
    });
}

app.get('/', (req, res) => {
    res.sendFile('/public/index.html');
});

// Get track ratings
app.get('/api/ratings/:trackId', async (req, res) => {
    const { trackId } = req.params;
    
    if (!trackId) {
        return res.status(400).json({ error: 'Track ID required' });
    }
    
    try {
        const query = DATABASE_TYPE === 'postgres' 
            ? `SELECT rating, COUNT(*) as count FROM track_ratings WHERE track_id = $1 GROUP BY rating`
            : `SELECT rating, COUNT(*) as count FROM track_ratings WHERE track_id = ? GROUP BY rating`;
        const params = DATABASE_TYPE === 'postgres' ? [trackId] : [trackId];
        const rows = await dbQuery(query, params);
        
        const ratings = { thumbsUp: 0, thumbsDown: 0 };
        rows.forEach(row => {
            if (row.rating === 1) ratings.thumbsUp = parseInt(row.count);
            if (row.rating === -1) ratings.thumbsDown = parseInt(row.count);
        });
        
        res.json(ratings);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Submit a rating
app.post('/api/ratings', async (req, res) => {
    const { trackId, rating } = req.body;
    
    if (!trackId) {
        return res.status(400).json({ error: 'Track ID required' });
    }
    
    if (![1, -1].includes(rating)) {
        return res.status(400).json({ error: 'Rating must be 1 or -1' });
    }
    
    const clientIP = getClientIP(req);
    const serverUserId = generateServerUserId(clientIP);
    
    try {
        const upsertQuery = DATABASE_TYPE === 'postgres' 
            ? `INSERT INTO track_ratings (track_id, user_id, rating) 
               VALUES ($1, $2, $3) 
               ON CONFLICT (track_id, user_id) 
               DO UPDATE SET rating = EXCLUDED.rating`
            : `INSERT OR REPLACE INTO track_ratings (track_id, user_id, rating) 
               VALUES (?, ?, ?)`;
               
        await dbQuery(upsertQuery, [trackId, serverUserId, rating]);
        res.json({ success: true, trackId, rating });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's rating for a track
app.get('/api/user-rating/:trackId', async (req, res) => {
    const { trackId } = req.params;
    
    if (!trackId) {
        return res.status(400).json({ error: 'Track ID required' });
    }
    
    const clientIP = getClientIP(req);
    const serverUserId = generateServerUserId(clientIP);
    
    try {
        const query = DATABASE_TYPE === 'postgres' 
            ? 'SELECT rating FROM track_ratings WHERE track_id = $1 AND user_id = $2'
            : 'SELECT rating FROM track_ratings WHERE track_id = ? AND user_id = ?';
        const row = await dbGet(query, [trackId, serverUserId]);
        
        const userRating = row ? row.rating : null;
        res.json({ rating: userRating });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start server after database initialization
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Using ${DATABASE_TYPE} database`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});