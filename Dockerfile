# Multi-stage Dockerfile for Radio Calico
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS prod-deps
RUN npm ci --only=production && npm cache clean --force

# Production build stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy application files
COPY server.js ./
COPY public ./public

# Create volume mount point for persistent database
RUN mkdir -p /app/data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S radiocalico -u 1001

# Set ownership of app directory
RUN chown -R radiocalico:nodejs /app
USER radiocalico

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]