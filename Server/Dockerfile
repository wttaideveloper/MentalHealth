FROM node:22-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
FROM base AS dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Development stage
FROM base AS development
RUN npm install
COPY . .
CMD ["dumb-init", "node", "src/server.js"]

# Production build stage
FROM base AS production

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY uploads ./uploads

# Create directory for generated files
RUN mkdir -p generated && \
    chown -R node:node generated uploads

# Use non-root user for security
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "src/server.js"]
