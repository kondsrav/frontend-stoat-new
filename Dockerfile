# Frontend Dockerfile for Stoat Web Client
# Multi-stage build for optimal production image

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy all package.json files for workspace dependencies
COPY packages/client/package.json packages/client/
COPY packages/revolt.js/package.json packages/revolt.js/
COPY packages/solid-livekit-components/package.json packages/solid-livekit-components/
COPY packages/js-lingui-solid/packages/babel-plugin-extract-messages/package.json packages/js-lingui-solid/packages/babel-plugin-extract-messages/
COPY packages/js-lingui-solid/packages/babel-plugin-lingui-macro/package.json packages/js-lingui-solid/packages/babel-plugin-lingui-macro/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build dependencies first
RUN pnpm run build:deps

# Build the client application
RUN pnpm run build:prod

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Remove default nginx configuration
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Create custom nginx configuration for SPA
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Main location for the app
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create a startup script to handle environment variables
RUN cat > /docker-entrypoint.sh << 'EOF'
#!/bin/sh
set -e

# Replace environment variables in built files if they exist
if [ -f /usr/share/nginx/html/index.html ]; then
    # Replace API URLs with environment variables
    if [ ! -z "$VITE_API_URL" ]; then
        echo "Setting API URL to: $VITE_API_URL"
        find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:14702|$VITE_API_URL|g" {} \;
    fi
    
    if [ ! -z "$VITE_WS_URL" ]; then
        echo "Setting WebSocket URL to: $VITE_WS_URL"
        find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|ws://localhost:14703|$VITE_WS_URL|g" {} \;
    fi
    
    if [ ! -z "$VITE_MEDIA_URL" ]; then
        echo "Setting Media URL to: $VITE_MEDIA_URL"
        find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:14704|$VITE_MEDIA_URL|g" {} \;
    fi
    
    if [ ! -z "$VITE_PROXY_URL" ]; then
        echo "Setting Proxy URL to: $VITE_PROXY_URL"
        find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:14705|$VITE_PROXY_URL|g" {} \;
    fi
fi

# Start nginx
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx with our custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]