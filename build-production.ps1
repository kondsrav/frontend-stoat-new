# Production Build Script for Stoat Frontend
# This script builds and tests the frontend with proper production configuration

Write-Host "🚀 Building Stoat Frontend for Production" -ForegroundColor Green
Write-Host "📍 Target: stoat-dev.zasperhub.com" -ForegroundColor Cyan

# Set production environment
$env:NODE_ENV = "production"

# Verify Docker is available
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not available. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Clean up any existing containers
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
docker stop stoat-frontend-prod 2>$null | Out-Null
docker rm stoat-frontend-prod 2>$null | Out-Null

# Build the production image
Write-Host "🔨 Building production Docker image..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$buildResult = docker build -f Dockerfile.production -t stoat-frontend:production .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Run the production container
Write-Host "🌐 Starting production container..." -ForegroundColor Yellow
docker run -d --name stoat-frontend-prod -p 3001:80 `
    -e VITE_API_URL=https://stoat-dev.zasperhub.com/api `
    -e VITE_WS_URL=wss://stoat-dev.zasperhub.com/ws `
    -e VITE_MEDIA_URL=https://stoat-dev.zasperhub.com/autumn `
    -e VITE_PROXY_URL=https://stoat-dev.zasperhub.com/january `
    stoat-frontend:production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}

# Wait for container to be ready
Write-Host "⏳ Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the health endpoint
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ Health check passed: $healthResponse" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    docker logs stoat-frontend-prod
    exit 1
}

# Test the debug endpoint
try {
    $debugResponse = Invoke-RestMethod -Uri "http://localhost:3001/debug/urls" -Method Get
    Write-Host "📍 URL Configuration:" -ForegroundColor Cyan
    Write-Host $debugResponse -ForegroundColor White
} catch {
    Write-Host "⚠️  Debug endpoint not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Production build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker ps --filter name=stoat-frontend-prod --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
Write-Host "🌐 Frontend URLs:" -ForegroundColor Cyan
Write-Host "   Local: http://localhost:3001" -ForegroundColor White
Write-Host "   Health: http://localhost:3001/health" -ForegroundColor White
Write-Host "   Debug: http://localhost:3001/debug/urls" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the application at http://localhost:3001" -ForegroundColor White
Write-Host "   2. Verify favorites functionality is working" -ForegroundColor White
Write-Host "   3. Check that it connects to stoat-dev.zasperhub.com backend" -ForegroundColor White
Write-Host "   4. If everything works, deploy this image to your EC2" -ForegroundColor White
Write-Host ""
Write-Host "🐳 To deploy to EC2:" -ForegroundColor Cyan
Write-Host "   docker save stoat-frontend:production | gzip > stoat-frontend-production.tar.gz" -ForegroundColor White
Write-Host "   # Transfer to EC2 and run:" -ForegroundColor Gray
Write-Host "   docker load < stoat-frontend-production.tar.gz" -ForegroundColor White
Write-Host "   docker run -d -p 80:80 stoat-frontend:production" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop:" -ForegroundColor Red
Write-Host "   docker stop stoat-frontend-prod && docker rm stoat-frontend-prod" -ForegroundColor White
