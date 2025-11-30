# Manual GCP Deployment (for network issues)
# This uses Docker directly instead of gcloud source upload

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual GCP Deployment (Docker Method)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "`n[1/7] Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Configure Docker for GCR
Write-Host "`n[2/7] Configuring Docker for Google Container Registry..." -ForegroundColor Yellow
gcloud auth configure-docker --quiet

# Build ML Docker image locally
Write-Host "`n[3/7] Building ML Docker image locally..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes..." -ForegroundColor Gray

Set-Location ml
docker build -t gcr.io/$ProjectId/estimagent-ml:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed for ML service" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "ML image built successfully" -ForegroundColor Green
Set-Location ..

# Build API Docker image locally
Write-Host "`n[4/7] Building API Docker image locally..." -ForegroundColor Yellow
Write-Host "This will take 3-5 minutes..." -ForegroundColor Gray

Set-Location api
docker build -t gcr.io/$ProjectId/estimagent-api:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed for API service" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "API image built successfully" -ForegroundColor Green
Set-Location ..

# Push ML image to GCR
Write-Host "`n[5/7] Pushing ML image to Google Container Registry..." -ForegroundColor Yellow
docker push gcr.io/$ProjectId/estimagent-ml:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to push ML image" -ForegroundColor Red
    Write-Host "This might be a network issue. Try:" -ForegroundColor Yellow
    Write-Host "  - Using a different network (mobile hotspot)" -ForegroundColor Gray
    Write-Host "  - Disabling antivirus temporarily" -ForegroundColor Gray
    Write-Host "  - Using a VPN" -ForegroundColor Gray
    exit 1
}

Write-Host "ML image pushed successfully" -ForegroundColor Green

# Push API image to GCR
Write-Host "`n[6/7] Pushing API image to Google Container Registry..." -ForegroundColor Yellow
docker push gcr.io/$ProjectId/estimagent-api:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to push API image" -ForegroundColor Red
    exit 1
}

Write-Host "API image pushed successfully" -ForegroundColor Green

# Deploy ML service from image
Write-Host "`n[7/7] Deploying services to Cloud Run..." -ForegroundColor Yellow

# Read env vars from .env.yaml and convert to --set-env-vars format
$envVars = @()
Get-Content ml/.env.yaml | ForEach-Object {
    if ($_ -match '^(\w+):\s*"?([^"]+)"?$') {
        $envVars += "$($matches[1])=$($matches[2])"
    }
}
$envVarsString = $envVars -join ","

gcloud run deploy estimagent-ml --image gcr.io/$ProjectId/estimagent-ml:latest --platform managed --region $Region --allow-unauthenticated --memory 4Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --set-env-vars $envVarsString --port 8080 --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: ML service deployment failed" -ForegroundColor Red
    exit 1
}

$ML_URL = gcloud run services describe estimagent-ml --region $Region --format "value(status.url)"
Write-Host "ML Service deployed: $ML_URL" -ForegroundColor Green

# Deploy API service from image
gcloud run deploy estimagent-api --image gcr.io/$ProjectId/estimagent-api:latest --platform managed --region $Region --allow-unauthenticated --memory 2Gi --cpu 1 --timeout 300 --max-instances 10 --min-instances 1 --set-env-vars "NODE_ENV=production" --port 8080 --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: API service deployment failed" -ForegroundColor Red
    exit 1
}

$API_URL = gcloud run services describe estimagent-api --region $Region --format "value(status.url)"
Write-Host "API Service deployed: $API_URL" -ForegroundColor Green

# Update CORS
gcloud run services update estimagent-ml --region $Region --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,$API_URL" --quiet

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nService URLs:" -ForegroundColor White
Write-Host "  ML Service:  $ML_URL" -ForegroundColor Cyan
Write-Host "  API Service: $API_URL" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Update Vercel:" -ForegroundColor White
Write-Host "   VITE_API_URL=$API_URL" -ForegroundColor Gray
Write-Host "   VITE_ML_URL=$ML_URL" -ForegroundColor Gray
Write-Host "`n========================================`n" -ForegroundColor Cyan
