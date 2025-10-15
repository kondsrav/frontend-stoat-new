# Windows Development Quick Start

Since building Rust on Windows requires additional dependencies (CMake, NASM), here's a Docker-based approach for easier development:

## Option 1: Frontend + Docker Backend (Recommended)

### 1. Start Backend via Docker
```powershell
cd D:\backend\stoatchat

# Start full backend stack
docker compose up -d

# Check services are running
docker compose ps
```

### 2. Configure Frontend for Docker Backend
Create `D:\latest_frontend\for-web\packages\client\.env.local`:
```env
# Point to Docker backend services
VITE_API_URL=http://localhost:80/api
VITE_WS_URL=ws://localhost:80/ws  
VITE_MEDIA_URL=http://localhost:80/autumn
VITE_PROXY_URL=http://localhost:80/january
```

### 3. Start Frontend
```powershell
cd D:\latest_frontend\for-web
pnpm dev:web
```

## Option 2: Full Local Development

If you want to build backend locally, install prerequisites:

### Install Build Tools
```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Install CMake
winget install Kitware.CMake

# Install NASM
winget install NASM.NASM

# Restart PowerShell and try again
cargo run --bin revolt-delta
```

## Development Workflow

1. **Make Frontend Changes**: Auto-reload at http://localhost:5173/
2. **Make Backend Changes**: 
   - Docker: Rebuild image and restart container
   - Local: Restart the specific Rust binary

## Building for Production

### Frontend
```powershell
cd D:\latest_frontend\for-web
pnpm build
# Output: packages/client/dist/
```

### Backend (Docker)
```powershell
cd D:\backend\stoatchat
docker build -t your-registry/stoat-backend:latest .
```

## Deploy Updated Version

1. Push images to your registry
2. Update server compose file with new tags
3. Deploy:
```bash
# On server
docker compose pull
docker compose up -d --force-recreate
```

This approach lets you develop the frontend easily while using Docker for the complex backend build process.