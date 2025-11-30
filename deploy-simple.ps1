# Simple GCP Deployment Script for EstimAgent
# No complex syntax, just straightforward deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EstimAgent GCP Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Set project
Write-Host "`n[1/5] Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set project" -ForegroundColor Red
    exit 1
}

Write-Host "Project set successfully" -ForegroundColor Green

# Enable APIs
Write-Host "`n[2/5] Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com --quiet

Write-Host "APIs enabled successfully" -ForegroundColor Green

# Deploy ML Service
Write-Host "`n[3/5] Deploying ML Service..." -ForegroundColor Yellow
Write-Host "This will take 8-10 minutes. Please wait..." -ForegroundColor Gray

Set-Location ml

# Check if .env.yaml exists
if (!(Test-Path ".env.yaml")) {
    Write-Host "Error: .env.yaml not found in ml/ directory" -ForegroundColor Red
    Write-Host "Please create ml/.env.yaml with your configuration" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

gcloud run deploy estimagent-ml --source . --platform managed --region $Region --allow-unauthenticated --memory 4Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --env-vars-file .env.yaml --port 8080 --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: ML service deployment failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

$ML_URL = gcloud run services describe estimagent-ml --region $Region --format "value(status.url)"
Write-Host "ML Service deployed successfully!" -ForegroundColor Green
Write-Host "URL: $ML_URL" -ForegroundColor Cyan

Set-Location ..

# Deploy API Service
Write-Host "`n[4/5] Deploying API Service..." -ForegroundColor Yellow
Write-Host "This will take 3-5 minutes. Please wait..." -ForegroundColor Gray

Set-Location api

# Check if Dockerfile exists
if (!(Test-Path "Dockerfile")) {
    Write-Host "Error: Dockerfile not found in api/ directory" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Create minimal .env.yaml if it doesn't exist
if (!(Test-Path ".env.yaml")) {
    Write-Host "Creating minimal .env.yaml for API..." -ForegroundColor Yellow
    "NODE_ENV: production" | Out-File -FilePath ".env.yaml" -Encoding UTF8
}

gcloud run deploy estimagent-api --source . --platform managed --region $Region --allow-unauthenticated --memory 2Gi --cpu 1 --timeout 300 --max-instances 10 --min-instances 1 --env-vars-file .env.yaml --port 8080 --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: API service deployment failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

$API_URL = gcloud run services describe estimagent-api --region $Region --format "value(status.url)"
Write-Host "API Service deployed successfully!" -ForegroundColor Green
Write-Host "URL: $API_URL" -ForegroundColor Cyan

Set-Location ..

# Update ML CORS
Write-Host "`n[5/5] Updating ML service CORS..." -ForegroundColor Yellow
gcloud run services update estimagent-ml --region $Region --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,$API_URL" --quiet

Write-Host "CORS updated successfully" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nService URLs:" -ForegroundColor White
Write-Host "  ML Service:  $ML_URL" -ForegroundColor Cyan
Write-Host "  API Service: $API_URL" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Update Vercel environment variables:" -ForegroundColor White
Write-Host "   VITE_API_URL=$API_URL" -ForegroundColor Gray
Write-Host "   VITE_ML_URL=$ML_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Redeploy your Vercel frontend" -ForegroundColor White
Write-Host ""
Write-Host "3. Test at https://estimagent.vercel.app" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan
