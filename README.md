# Radio Calico

A live radio streaming application with real-time track metadata and user ratings.

## Features

- **Live HLS Audio Streaming** - High-quality audio streaming via CloudFront CDN
- **Real-time Metadata** - Automatic track information updates every 30 seconds
- **User Rating System** - Thumbs up/down voting with vote changing capability
- **Album Art Display** - Dynamic cover art updates with cache-busting
- **Responsive Design** - Mobile-friendly interface
- **No Authentication** - Simple IP-based user identification

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: Vanilla JavaScript, HLS.js
- **Database**: SQLite with track ratings storage
- **Streaming**: HLS (HTTP Live Streaming)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Commands

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

## Architecture

### Backend (server.js)
- Express.js API serving static files and REST endpoints
- SQLite database storing user vote data
- IP-based user identification using SHA256 hashing
- Rating system supporting vote changes

### Frontend
- Single-page application with vanilla JavaScript
- HLS.js for live audio streaming
- Real-time metadata fetching from external JSON endpoint
- CSS custom properties system for theming

### API Endpoints
- `GET /api/ratings/:trackId` - Get vote counts for a track
- `GET /api/user-rating/:trackId` - Get current user's vote
- `POST /api/ratings` - Submit or change a vote

## Database Schema

```sql
track_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(track_id, user_id)
)
```

## External Dependencies

- **HLS Stream**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata API**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album Art**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`

## Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

## License

MIT