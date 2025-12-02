# Frontend Streamer Dockerfile for air.fun
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend-streamer/package*.json ./packages/frontend-streamer/

# Install dependencies
RUN npm ci --workspace=@air-fun/frontend-streamer

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend-streamer/node_modules ./packages/frontend-streamer/node_modules

# Copy source code
COPY packages/frontend-streamer ./packages/frontend-streamer
COPY tsconfig.json ./

# Build the application
WORKDIR /app/packages/frontend-streamer
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/packages/frontend-streamer/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend-streamer/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
