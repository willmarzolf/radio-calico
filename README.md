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
- **Testing**: Jest, Supertest, jsdom

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

### Development
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

### Testing
- `npm test` - Run all tests (78 tests total)
- `npm run test:backend` - Run backend tests only (47 tests)
- `npm run test:frontend` - Run frontend tests only (31 tests)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage reports

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

## Testing

Radio Calico includes a comprehensive testing suite with **78 tests** covering both backend and frontend functionality.

### Test Structure
- **Backend Tests (47 tests)**: API endpoints, database operations, IP handling, validation
- **Frontend Tests (31 tests)**: Track ID generation, metadata processing, rating system logic
- **Integration Tests**: Complete API workflows with HTTP requests
- **Unit Tests**: Pure function testing without side effects

### Testing Technologies
- **Jest** - Testing framework with multi-project configuration
- **Supertest** - HTTP assertion testing for Express APIs
- **jsdom** - DOM testing environment for frontend tests
- **In-memory SQLite** - Isolated database testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:backend
npm run test:frontend

# Development mode
npm run test:watch

# Coverage reports
npm run test:coverage
```

### Key Features Tested
- Rating API endpoints (GET/POST operations)
- User identification from IP addresses
- Database vote storage and updates
- Input validation and error handling
- Track ID generation consistency
- Metadata processing and caching
- Rating button state management

## Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

## License

MIT