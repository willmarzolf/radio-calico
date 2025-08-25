const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

function createTestServer(testDb) {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Helper functions (copied from server.js)
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

  // Get track ratings
  app.get('/api/ratings/:trackId', (req, res) => {
    const { trackId } = req.params;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID required' });
    }
    
    testDb.all(`SELECT rating, COUNT(*) as count 
                FROM track_ratings 
                WHERE track_id = ? 
                GROUP BY rating`, [trackId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const ratings = { thumbsUp: 0, thumbsDown: 0 };
      rows.forEach(row => {
        if (row.rating === 1) ratings.thumbsUp = row.count;
        if (row.rating === -1) ratings.thumbsDown = row.count;
      });
      
      res.json(ratings);
    });
  });

  // Submit a rating
  app.post('/api/ratings', (req, res) => {
    const { trackId, rating } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID required' });
    }
    
    if (![1, -1].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be 1 or -1' });
    }
    
    const clientIP = getClientIP(req);
    const serverUserId = generateServerUserId(clientIP);
        
    testDb.run(`INSERT OR REPLACE INTO track_ratings (track_id, user_id, rating) 
                VALUES (?, ?, ?)`, [trackId, serverUserId, rating], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, trackId, rating });
    });
  });

  // Get user's rating for a track
  app.get('/api/user-rating/:trackId', (req, res) => {
    const { trackId } = req.params;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID required' });
    }
    
    const clientIP = getClientIP(req);
    const serverUserId = generateServerUserId(clientIP);
        
    testDb.get('SELECT rating FROM track_ratings WHERE track_id = ? AND user_id = ?', 
               [trackId, serverUserId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const userRating = row ? row.rating : null;
      res.json({ rating: userRating });
    });
  });

  return app;
}

module.exports = { createTestServer };