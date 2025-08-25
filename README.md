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

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HLS.js
- **Database**: SQLite (development), PostgreSQL (production)
- **Web Server**: nginx (production reverse proxy)
- **Streaming**: HLS (HTTP Live Streaming)
- **Testing**: Jest, Supertest, jsdom
- **Deployment**: Docker, Docker Compose
- **Automation**: Cross-platform build scripts

## Quick Start

### Option 1: Native Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

### Option 2: Docker Development

1. Start the development environment:
   ```bash
   docker-compose up
   ```

2. Open your browser to `http://localhost:3000`

### Option 3: Script-based (Recommended)

**Unix/Linux/Mac:**
```bash
./scripts.sh prod    # Start production (PostgreSQL + nginx)
./scripts.sh dev     # Start development
./scripts.sh test    # Run all tests
```

**Windows:**
```bash
scripts prod         # Start production (PostgreSQL + nginx)
scripts dev          # Start development  
scripts test         # Run all tests
```

### Option 4: Docker Production

1. Start the production environment:
   ```bash
   docker-compose -f docker-compose.prod.yml up
   ```

2. Open your browser to `http://localhost` (nginx on port 80)

## Commands

### Script-based Commands (Recommended)

**Unix/Linux/Mac** (`./scripts.sh <command>`) | **Windows** (`scripts <command>`)

**Development:**
- `dev` - Start development server with auto-reload
- `dev-docker` - Start development with Docker
- `install` - Install dependencies

**Production:**
- `prod` - Start full production stack (PostgreSQL + nginx + Node.js)
- `prod-build` - Build production Docker images
- `prod-up` - Start production containers
- `prod-down` - Stop production containers

**Testing:**
- `test` - Run all tests (78 tests)
- `test-backend` - Run backend tests (47 tests)
- `test-frontend` - Run frontend tests (31 tests)
- `test-coverage` - Generate coverage reports

**Management:**
- `status` - Show container status
- `logs` - Show production logs
- `stop` - Stop all containers
- `clean` - Clean up Docker resources

### Native Development
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage reports

### Docker Commands
- `docker-compose up` - Start development environment
- `docker-compose -f docker-compose.prod.yml up` - Start production environment

## Architecture

### Development Environment
```
Direct Access → Node.js App (Port 3000) → SQLite Database
```

### Production Environment  
```
Internet → nginx (Port 80/443) → Node.js App → PostgreSQL Database
```

### Backend (server.js)
- Express.js API serving static files and REST endpoints
- **Multi-database support**: SQLite (dev) and PostgreSQL (prod)
- Database abstraction layer for cross-platform compatibility
- IP-based user identification using SHA256 hashing
- Rating system supporting vote changes

### Frontend
- Single-page application with vanilla JavaScript
- HLS.js for live audio streaming
- Real-time metadata fetching from external JSON endpoint
- CSS custom properties system for theming

### Production Infrastructure
- **nginx**: Reverse proxy with rate limiting and security headers
- **PostgreSQL**: Production database with persistent storage
- **Docker**: Containerized deployment with health checks
- **Resource limits**: CPU and memory constraints for stability

### API Endpoints
- `GET /api/ratings/:trackId` - Get vote counts for a track
- `GET /api/user-rating/:trackId` - Get current user's vote
- `POST /api/ratings` - Submit or change a vote

## Database Schema

### SQLite (Development)
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

### PostgreSQL (Production)
```sql
track_ratings (
  id SERIAL PRIMARY KEY,
  track_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

## Docker Deployment

Radio Calico includes comprehensive Docker support for both development and production environments.

### Docker Features
- **Multi-stage builds** - Separate optimized images for development and production
- **Production stack**: PostgreSQL + nginx + Node.js with health checks
- **Development stack**: SQLite + Node.js with hot reload
- **Security hardening** - Non-root user execution with resource limits
- **Persistent storage** - Database data preserved in Docker volumes

### Production Deployment (Script-based)
```bash
# Unix/Linux/Mac
./scripts.sh prod        # Start full production stack
./scripts.sh status      # Check container health
./scripts.sh logs        # View logs
./scripts.sh prod-down   # Stop production

# Windows  
scripts prod             # Start full production stack
scripts status           # Check container health
scripts logs             # View logs  
scripts prod-down        # Stop production
```

### Production Deployment (Docker)
```bash
# Build and start production containers (PostgreSQL + nginx + Node.js)
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

### Development with Docker
```bash
# Script-based (recommended)
./scripts.sh dev-docker  # Unix/Linux/Mac
scripts dev-docker       # Windows

# Direct Docker commands
docker-compose up
docker-compose up --build  # Rebuild after changes
```

## Configuration

### Port Configuration
- **Development**: Node.js app runs on port 3000
- **Production**: nginx runs on port 80/443, proxies to Node.js on port 3000

### Environment Variables

**Application:**
- `NODE_ENV` - Set to `development` or `production`
- `PORT` - Server port (defaults to 3000)
- `DATABASE_TYPE` - Set to `sqlite` (default) or `postgres`

**PostgreSQL (Production):**
- `POSTGRES_HOST` - PostgreSQL host (defaults to `postgres`)
- `POSTGRES_PORT` - PostgreSQL port (defaults to 5432)
- `POSTGRES_DB` - Database name (defaults to `radiocalico`)
- `POSTGRES_USER` - Database user (defaults to `postgres`)
- `POSTGRES_PASSWORD` - Database password (required for production)

### Production Setup
1. Copy `.env.prod.example` to `.env.prod`
2. Update `POSTGRES_PASSWORD` with a secure password
3. Run `./scripts.sh prod` or `scripts prod`

## License

MIT