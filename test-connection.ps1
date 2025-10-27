#!/usr/bin/env powershell

# Connection test script for Stoat Frontend and Backend

Write-Host "🔍 Testing Stoat Frontend and Backend Connection" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Test Frontend
Write-Host "`n📱 Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 10
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running and healthy" -ForegroundColor Green
        Write-Host "   URL: http://localhost:3000" -ForegroundColor White
        Write-Host "   Status: $($frontendHealth.StatusCode) $($frontendHealth.StatusDescription)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Backend API
Write-Host "`n🔧 Testing Backend Services..." -ForegroundColor Yellow

$backendPorts = @{
    "14702" = "API"
    "14703" = "WebSocket" 
    "14704" = "Media"
    "14705" = "Proxy"
}

foreach ($port in $backendPorts.Keys) {
    $service = $backendPorts[$port]
    try {
        if ($port -eq "14703") {
            # Special handling for WebSocket port
            Write-Host "⚠️  Port $port ($service): WebSocket endpoint (can't test with HTTP)" -ForegroundColor Yellow
        } else {
            $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ Port $port ($service): $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Port $port ($service): Not accessible" -ForegroundColor Red
    }
}

# Test Frontend to Backend API connectivity
Write-Host "`n🔗 Testing Frontend to Backend Connection..." -ForegroundColor Yellow

# Check if frontend can reach backend through Docker networking
$dockerContainers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "`n📊 Docker Containers Status:" -ForegroundColor Cyan
Write-Host $dockerContainers -ForegroundColor White

# Test connection from inside the frontend container
Write-Host "`n🌐 Testing API connectivity from frontend container..." -ForegroundColor Yellow
try {
    # Test if the container can reach the host backend
    $testConnection = docker exec stoat-frontend-test sh -c "wget -q --spider --timeout=5 http://host.docker.internal:14702 && echo 'SUCCESS' || echo 'FAILED'"
    if ($testConnection -like "*SUCCESS*") {
        Write-Host "✅ Frontend container can reach backend API" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend container cannot reach backend API" -ForegroundColor Red
        Write-Host "   Make sure host.docker.internal is working in your Docker setup" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not test container connectivity: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n📋 Connection Summary:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:14702" -ForegroundColor White
Write-Host "   Backend WebSocket: ws://localhost:14703" -ForegroundColor White
Write-Host "   Backend Media: http://localhost:14704" -ForegroundColor White
Write-Host "   Backend Proxy: http://localhost:14705" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   2. Test login/signup functionality" -ForegroundColor White
Write-Host "   3. Check browser dev tools for any API errors" -ForegroundColor White
Write-Host "   4. Monitor container logs: docker logs stoat-frontend-test" -ForegroundColor White

Write-Host "`n🛑 To stop the containers:" -ForegroundColor Cyan
Write-Host "   docker stop stoat-frontend-test; docker rm stoat-frontend-test" -ForegroundColor White

Write-Host "`n✨ Test completed!" -ForegroundColor Green