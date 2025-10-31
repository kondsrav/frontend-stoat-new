# Simple Production Build and Test Script using Docker Compose
# This script uses docker-compose for easier management

Write-Host "Building Stoat Frontend for Production (Docker Compose)" -ForegroundColor Green

# Verify docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose is not available. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml down

# Build and start the production environment
Write-Host "Building and starting production environment..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose build/start failed!" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml ps

# Test the health endpoint
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "Health check passed: $healthResponse" -ForegroundColor Green
} catch {
    Write-Host "Health check failed" -ForegroundColor Red
    Write-Host "Container logs:" -ForegroundColor Yellow
    docker-compose -f docker-compose.production.yml logs frontend
    exit 1
}

# Test the debug endpoint
try {
    $debugResponse = Invoke-RestMethod -Uri "http://localhost:3000/debug/urls" -Method Get
    Write-Host "URL Configuration:" -ForegroundColor Cyan
    Write-Host $debugResponse -ForegroundColor White
} catch {
    Write-Host "Debug endpoint not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Production environment is running!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URLs:" -ForegroundColor Cyan
Write-Host "   Local: http://localhost:3000" -ForegroundColor White
Write-Host "   Health: http://localhost:3000/health" -ForegroundColor White
Write-Host "   Debug: http://localhost:3000/debug/urls" -ForegroundColor White
Write-Host ""
Write-Host "Testing Checklist:" -ForegroundColor Yellow
Write-Host "   - Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   - Try to log in to your stoat-dev.zasperhub.com account" -ForegroundColor White
Write-Host "   - Create/join a channel and try adding it to favorites" -ForegroundColor White
Write-Host "   - Verify the favorites section appears in the sidebar" -ForegroundColor White
Write-Host "   - Join/create a server and try adding it to favorites" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.production.yml logs -f frontend" -ForegroundColor White
Write-Host ""
Write-Host "To stop:" -ForegroundColor Red
Write-Host "   docker-compose -f docker-compose.production.yml down" -ForegroundColor White
