#!/usr/bin/env powershell

# Build and Test Script for Stoat Frontend Docker Setup

Write-Host "🚀 Stoat Frontend Docker Build and Test Script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

if (!(Test-Command "docker")) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (!(Test-Command "docker-compose")) {
    Write-Host "❌ Docker Compose is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are available" -ForegroundColor Green

# Build the frontend Docker image
Write-Host "`n🔨 Building frontend Docker image..." -ForegroundColor Yellow
docker build -t stoat-frontend:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Ask user which deployment option they want
Write-Host "`n📋 Choose deployment option:" -ForegroundColor Cyan
Write-Host "1. Frontend only (requires backend running locally)" -ForegroundColor White
Write-Host "2. Full stack (frontend + backend)" -ForegroundColor White
Write-Host "3. Just build (no deployment)" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting frontend only..." -ForegroundColor Yellow
        docker-compose -f docker-compose.frontend-only.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend is running at http://localhost:3000" -ForegroundColor Green
            Write-Host "⚠️  Make sure your backend is running on ports 14702-14705" -ForegroundColor Yellow
            
            # Test connection
            Write-Host "`n🔍 Testing frontend availability..." -ForegroundColor Yellow
            Start-Sleep 10
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Frontend health check passed!" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Frontend health check returned status: $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  Could not reach frontend health endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    "2" {
        Write-Host "`n🚀 Starting full stack..." -ForegroundColor Yellow
        Write-Host "⚠️  Make sure you have configured the backend Dockerfile properly" -ForegroundColor Yellow
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Full stack is starting..." -ForegroundColor Green
            Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
            Write-Host "   Backend API: http://localhost:14702" -ForegroundColor White
            Write-Host "   Backend WS: ws://localhost:14703" -ForegroundColor White
        }
    }
    "3" {
        Write-Host "✅ Build completed. Image: stoat-frontend:latest" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📚 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose down" -ForegroundColor White
Write-Host "   Rebuild: docker-compose build --no-cache" -ForegroundColor White
Write-Host "   Check status: docker-compose ps" -ForegroundColor White

Write-Host "`n🎉 Script completed!" -ForegroundColor Green