# Quick GCP Deployment Script for EstimAgent
# Run this after setting up GCP CLI and authenticating

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EstimAgent GCP Quick Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Set project
Write-Host "`n[1/6] Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set project. Make sure you're authenticated." -ForegroundColor Red
    Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# Enable APIs
Write-Host "`n[2/6] Enabling required APIs..." -ForegroundColor Yellow
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com --quiet

# Deploy ML Service
Write-Host "`n[3/6] Deploying ML Service..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes (building Docker image)..." -ForegroundColor Gray

Push-Location ml

# Check if .env.yaml exists
if (!(Test-Path ".env.yaml")) {
    Write-Host "Warning: .env.yaml not found in ml/ directory" -ForegroundColor Red
    Write-Host "Creating template .env.yaml..." -ForegroundColor Yellow
    
    $envContent = @"
ROOM_API_KEY: "your-room-api-key"
ROOM_WORKSPACE: "your-workspace"
ROOM_PROJECT: "your-project"
ROOM_VERSION: "1"

WALL_API_KEY: "your-wall-api-key"
WALL_WORKSPACE: "your-workspace"
WALL_PROJECT: "your-project"
WALL_VERSION: "1"

DOORWINDOW_API_KEY: "your-doorwindow-api-key"
DOORWINDOW_WORKSPACE: "your-workspace"
DOORWINDOW_PROJECT: "your-project"
DOORWINDOW_VERSION: "1"

CUSTOM_WINDOW_MODEL_PATH: "./models/window_best.pt"
UPLOAD_DIR: "/tmp/uploads"
CORS_ALLOW_ORIGINS: "https://estimagent.vercel.app"
"@
    $envContent | Out-File -FilePath ".env.yaml" -Encoding UTF8
    
    Write-Host "Please edit ml/.env.yaml with your actual values and run again." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

gcloud run deploy estimagent-ml `
  --source . `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --memory 4Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --min-instances 1 `
  --env-vars-file .env.yaml `
  --port 8080 `
  --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: ML service deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

$ML_URL = gcloud run services describe estimagent-ml --region $Region --format 'value(status.url)'
Write-Host "✓ ML Service deployed: $ML_URL" -ForegroundColor Green

Pop-Location

# Deploy API Service
Write-Host "`n[4/6] Deploying API Service..." -ForegroundColor Yellow
Write-Host "This will take 3-5 minutes..." -ForegroundColor Gray

Push-Location api

# Check if .env.yaml exists
if (!(Test-Path ".env.yaml")) {
    Write-Host "Warning: .env.yaml not found in api/ directory" -ForegroundColor Red
    Write-Host "Creating template .env.yaml..." -ForegroundColor Yellow
    
    $envContent = @"
NODE_ENV: "production"
DATABASE_URL: "your-database-url"
VITE_ML_URL: "$ML_URL"
"@
    $envContent | Out-File -FilePath ".env.yaml" -Encoding UTF8
    
    Write-Host "Please edit api/.env.yaml with your actual values and run again." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

gcloud run deploy estimagent-api `
  --source . `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 1 `
  --timeout 300 `
  --max-instances 10 `
  --min-instances 1 `
  --env-vars-file .env.yaml `
  --port 8080 `
  --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: API service deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

$API_URL = gcloud run services describe estimagent-api --region $Region --format 'value(status.url)'
Write-Host "✓ API Service deployed: $API_URL" -ForegroundColor Green

Pop-Location

# Update ML CORS
Write-Host "`n[5/6] Updating ML service CORS..." -ForegroundColor Yellow
gcloud run services update estimagent-ml `
  --region $Region `
  --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,$API_URL" `
  --quiet

Write-Host "✓ CORS updated" -ForegroundColor Green

# Test services
Write-Host "`n[6/6] Testing services..." -ForegroundColor Yellow

try {
    $mlHealth = Invoke-WebRequest -Uri "$ML_URL/healthz" -UseBasicParsing -TimeoutSec 10
    if ($mlHealth.StatusCode -eq 200) {
        Write-Host "✓ ML Service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ ML Service health check failed" -ForegroundColor Yellow
}

try {
    $apiHealth = Invoke-WebRequest -Uri "$API_URL/" -UseBasicParsing -TimeoutSec 10
    if ($apiHealth.StatusCode -eq 200) {
        Write-Host "✓ API Service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ API Service health check failed" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nService URLs:" -ForegroundColor White
Write-Host "  ML Service:  $ML_URL" -ForegroundColor Green
Write-Host "  API Service: $API_URL" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Update Vercel environment variables:" -ForegroundColor White
Write-Host "     VITE_API_URL=$API_URL" -ForegroundColor Gray
Write-Host "     VITE_ML_URL=$ML_URL" -ForegroundColor Gray
Write-Host "`n  2. Redeploy your Vercel frontend" -ForegroundColor White
Write-Host "`n  3. Test your application at https://estimagent.vercel.app" -ForegroundColor White

Write-Host "`nView logs:" -ForegroundColor Yellow
Write-Host "  gcloud run services logs read estimagent-ml --region $Region" -ForegroundColor Gray
Write-Host "  gcloud run services logs read estimagent-api --region $Region" -ForegroundColor Gray

Write-Host "`nManage services:" -ForegroundColor Yellow
Write-Host "  https://console.cloud.google.com/run?project=$ProjectId" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan
