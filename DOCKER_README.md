# Stoat Frontend Docker Setup

This directory contains Docker configuration files for the Stoat frontend application.

## Files Created

- `Dockerfile` - Multi-stage Docker build for production-ready frontend
- `docker-compose.yml` - Full stack deployment (frontend + backend)
- `docker-compose.frontend-only.yml` - Frontend only deployment
- `.dockerignore` - Optimizes build context by excluding unnecessary files
- `.env.docker` - Environment variable template
- `docker-build-test.ps1` - PowerShell script to build and test

## Quick Start

### Option 1: Frontend Only (Recommended for Testing)

If you have your backend running locally:

```powershell
# Build and run frontend only
docker-compose -f docker-compose.frontend-only.yml up -d

# View logs
docker-compose -f docker-compose.frontend-only.yml logs -f

# Stop
docker-compose -f docker-compose.frontend-only.yml down
```

The frontend will be available at http://localhost:3000

### Option 2: Full Stack

```powershell
# Build and run both frontend and backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Using the PowerShell Script

```powershell
# Make script executable and run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\docker-build-test.ps1
```

## Environment Configuration

Copy `.env.docker` to `.env` and adjust the values:

```bash
# Backend URLs (adjust to match your backend)
VITE_API_URL=http://localhost:14702
VITE_WS_URL=ws://localhost:14703
VITE_MEDIA_URL=http://localhost:14704
VITE_PROXY_URL=http://localhost:14705
```

## Testing Backend Connection

Once the frontend is running, you can test the connection to your backend:

1. **Check if backend is running:**
   ```powershell
   # Test API endpoint
   curl http://localhost:14702/health
   
   # Or using PowerShell
   Invoke-WebRequest -Uri "http://localhost:14702/health"
   ```

2. **Check frontend health:**
   ```powershell
   curl http://localhost:3000/health
   ```

3. **View container logs:**
   ```powershell
   docker logs <container-name>
   ```

## Troubleshooting

### Build Issues

1. **Large build context:** The build may take 5-10 minutes due to the project size
2. **Memory issues:** Ensure Docker has at least 4GB RAM allocated
3. **Node.js issues:** The build uses Node 20 Alpine - ensure compatibility

### Runtime Issues

1. **Backend connection failed:**
   - Verify backend is running on expected ports (14702-14705)
   - Check firewall settings
   - For Windows, ensure `host.docker.internal` works or use actual IP

2. **Frontend not accessible:**
   - Check if port 3000 is available
   - Verify container is running: `docker ps`
   - Check container logs: `docker logs <container-id>`

### Network Issues

1. **Cross-origin issues:**
   - Ensure backend allows CORS from frontend origin
   - Check if backend is configured for Docker networking

2. **WebSocket connection issues:**
   - Verify WebSocket endpoint is accessible
   - Check if proxy/firewall blocks WebSocket connections

## Docker Commands Reference

```powershell
# Build image manually
docker build -t stoat-frontend .

# Run container manually
docker run -d -p 3000:80 --name stoat-frontend stoat-frontend

# View running containers
docker ps

# View logs
docker logs stoat-frontend

# Stop and remove container
docker stop stoat-frontend && docker remove stoat-frontend

# Remove image
docker rmi stoat-frontend
```

## Production Deployment

For production deployment:

1. Update environment variables in `.env.docker`
2. Use proper domain names instead of localhost
3. Configure SSL/TLS termination
4. Set up proper monitoring and logging
5. Consider using Docker Swarm or Kubernetes for orchestration

## Performance Optimization

The Dockerfile includes several optimizations:

- Multi-stage build to reduce final image size
- Nginx with gzip compression
- Static asset caching
- Health checks
- Proper layer caching for faster rebuilds

## Security Features

- Non-root user in final image
- Security headers in Nginx configuration
- Minimal attack surface with Alpine Linux
- Environment variable injection at runtime