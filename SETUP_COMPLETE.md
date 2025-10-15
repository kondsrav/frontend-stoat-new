# ✅ Development Environment Setup Complete

## Current Status

✅ **Frontend**: Running at http://localhost:5173/  
✅ **Backend API**: Running at http://localhost:14702/  
✅ **Backend Events**: Running at http://localhost:14703/  
✅ **File Server**: Running at http://localhost:14704/  
✅ **Proxy Server**: Running at http://localhost:14705/  

## What Was Fixed

1. **Frontend Configuration**: Updated to force localhost URLs during development
2. **Environment Variables**: Created `.env.local` to override API endpoints
3. **Backend Services**: Verified all Docker containers are running correctly
4. **Development Workflow**: Simplified setup for Windows development

## Test Your Setup

### 1. Test Frontend
- Open http://localhost:5173/
- Check browser console for API configuration logs
- Should show localhost URLs for all services

### 2. Test Backend API
```powershell
# Test API root
curl http://localhost:14702/

# Test login endpoint (should return JSON error, not HTML)
curl -X POST http://localhost:14702/auth/session/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test"}'
```

### 3. Test Integration
- Try to register/login on the frontend
- Check browser DevTools for network requests
- All API calls should go to localhost:14702

## Development Workflow

### Making Frontend Changes
1. Edit files in `D:\latest_frontend\for-web\packages\client\`
2. Changes auto-reload via Vite
3. Check browser console for any errors

### Making Backend Changes
1. Edit backend code in `D:\backend\stoatchat\`
2. Rebuild Docker image: `docker compose build`
3. Restart services: `docker compose up -d --force-recreate`

### Building for Production

#### Frontend
```powershell
cd D:\latest_frontend\for-web
pnpm build
# Output: packages/client/dist/
```

#### Backend
```powershell
cd D:\backend\stoatchat
docker build -t your-registry/stoat-backend:latest .
docker push your-registry/stoat-backend:latest
```

## Deploy to Self-Hosted Server

1. **Update Images**: Push new frontend/backend images to your registry
2. **Update Server**: 
   ```bash
   # On your Ubuntu server
   cd ~/revolt
   docker compose pull
   docker compose up -d --force-recreate
   ```

## Troubleshooting

### If Frontend Shows 404/500 Errors
- Check backend services: `docker compose ps`
- Restart backend: `docker compose restart`
- Check API response: `curl http://localhost:14702/`

### If Login Still Fails
- Check browser DevTools Network tab
- Verify requests go to localhost:14702
- Check backend logs: `docker compose logs api`

### If CORS Errors
- Backend should allow localhost:5173 in CORS settings
- Check browser console for specific CORS messages

## Ready for Development! 🎉

Your local development environment is now properly configured with:
- Frontend auto-reloading at localhost:5173
- Backend services running via Docker
- Proper API routing between frontend and backend
- Easy deployment path to your self-hosted server

You can now make changes to both frontend and backend, test them locally, then deploy updated versions to your production server.