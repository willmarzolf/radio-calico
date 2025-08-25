# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Native Development
- `npm run dev` - Start development server with auto-reload (nodemon)
- `npm start` - Start production server
- `npm test` - Run all tests (backend + frontend)
- `npm run test:backend` - Run backend tests only
- `npm run test:frontend` - Run frontend tests only
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage reports
- Server runs on port 3000 by default (configurable via PORT environment variable)

### Docker Development
- `docker-compose up` - Start development environment with hot reload
- `docker-compose -f docker-compose.prod.yml up` - Start production environment
- `docker build --target development -t radiocalico:dev .` - Build development image
- `docker build --target production -t radiocalico:prod .` - Build production image

## Architecture Overview

This is a live radio streaming application with real-time track metadata and user ratings.

### Backend Architecture (server.js)
- **Express.js API server** serving both static files and REST endpoints
- **SQLite database** (`database.db`) with single table `track_ratings` storing user votes
- **User identification** via IP address hashing (no authentication required)
- **Rating system** supports thumbs up (+1) and thumbs down (-1) with vote changing capability

### Frontend Architecture
- **Single-page application** (`public/index.html`) with vanilla JavaScript
- **HLS.js integration** for live audio streaming from CloudFront CDN
- **Real-time metadata fetching** every 30 seconds from external JSON endpoint
- **CSS architecture** split into:
  - `settings.css` - CSS custom properties (variables) for theming
  - `style.css` - Main styles that reference the variables via `@import`

### Key Components

**RadioPlayer class (public/script.js)**:
- Manages HLS audio stream, volume controls, play/pause
- Handles track metadata updates and album art display
- Implements rating system with visual feedback
- Generates unique track IDs from title/artist for rating persistence

**Rating System**:
- Users can vote thumbs up/down and change their votes anytime
- Backend uses `INSERT OR REPLACE` for vote updates
- Frontend tracks user's current vote state with visual indicators
- Vote counts displayed in real-time

### Database Schema
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

### API Endpoints
- `GET /api/ratings/:trackId` - Get vote counts for a track
- `GET /api/user-rating/:trackId` - Get current user's vote for a track  
- `POST /api/ratings` - Submit or change a vote (body: {trackId, rating})

### Styling System
The CSS uses a comprehensive variable system in `settings.css` with organized categories:
- Colors (backgrounds, text, accents, borders, states)
- Typography (fonts, sizes, weights)
- Spacing (padding, margins, gaps)
- Sizing (component dimensions)
- Border radius and box shadows
- Transitions and opacity values

### External Dependencies
- **HLS streaming**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata API**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album art**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`

## Important Implementation Details

- Track IDs are generated client-side using base64 encoding of lowercase "title|artist"
- User IDs are SHA256 hashes of client IP addresses (first 16 characters)
- The application supports changing ratings (no "you already voted" restrictions)
- Album art updates with cache-busting timestamps
- Responsive design with mobile breakpoint at 480px
- No authentication system - relies on IP-based user identification
- Error handling includes HLS error recovery and graceful metadata fetch failures

## Testing Framework

The project includes a comprehensive testing suite with 78 tests covering both backend and frontend functionality.

### Test Structure
```
tests/
├── backend/
│   ├── unit/           # Unit tests for individual functions
│   ├── integration/    # API endpoint integration tests
│   └── helpers/        # Test utilities and database setup
└── frontend/
    ├── unit/           # Frontend logic and component tests
    └── mocks/          # Mock objects and API responses
```

### Testing Technologies
- **Jest** - Primary testing framework with multi-project configuration
- **Supertest** - HTTP assertion testing for Express.js APIs
- **jsdom** - DOM testing environment for frontend tests
- **In-memory SQLite** - Isolated database testing

### Test Coverage
- **Backend Tests (47 tests)**: API endpoints, database operations, IP handling, input validation
- **Frontend Tests (31 tests)**: Track ID generation, metadata processing, rating system logic
- **Integration Tests**: Complete API workflows with real HTTP requests
- **Unit Tests**: Pure function testing without side effects

### Key Test Files
- `tests/backend/integration/ratings-api.test.js` - Complete API testing
- `tests/backend/unit/database.test.js` - SQLite operations and schema validation
- `tests/frontend/unit/track-id.test.js` - Track ID generation consistency
- `tests/frontend/unit/ratings.test.js` - Rating system logic and validation
- `tests/frontend/unit/metadata.test.js` - Metadata processing and error handling

### Testing Best Practices
- All tests use isolated environments (in-memory database, mocked APIs)
- Tests are fast-running and can be executed frequently during development
- Both happy path and error scenarios are covered
- API mocking prevents external dependencies during testing
- Database tests use transactions for complete isolation

## Docker Containerization

The project includes comprehensive Docker support for both development and production deployments.

### Docker Architecture
- **Multi-stage Dockerfile** with separate development and production targets
- **Development stage** includes all dependencies and supports hot reload via volume mounting
- **Production stage** uses optimized builds with only production dependencies
- **Security hardening** with non-root user execution and resource limits

### Docker Files
- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Development environment with hot reload
- `docker-compose.prod.yml` - Production deployment with resource constraints
- `.dockerignore` - Optimized build context excluding unnecessary files

### Container Features
- **Persistent storage** - Database persisted via Docker volumes at `/app/data`
- **Health checks** - Built-in container health monitoring
- **Resource limits** - Production containers limited to 1 CPU and 512MB RAM
- **Port mapping** - Application accessible on host port 3000
- **Volume mounting** - Development containers support live code updates

### Deployment Options
- **Development**: `docker-compose up` - Full development environment with nodemon
- **Production**: `docker-compose -f docker-compose.prod.yml up` - Optimized production deployment
- **Standalone**: Direct `docker run` commands for custom deployments
- **Optional nginx**: Production compose includes nginx reverse proxy profile

### Docker Environment Variables
- `NODE_ENV` - Set to `development` or `production`
- `PORT` - Server port (defaults to 3000)

## important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.