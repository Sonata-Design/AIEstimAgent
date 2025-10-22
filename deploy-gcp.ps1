# GCP Cloud Run Deployment Script for EstimAgent (PowerShell)

# Configuration
$PROJECT_ID = "your-gcp-project-id"  # Replace with your GCP project ID
$REGION = "us-central1"  # Choose your region
$ML_SERVICE_NAME = "estimagent-ml"
$API_SERVICE_NAME = "estimagent-api"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "EstimAgent GCP Cloud Run Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Set project
Write-Host "`nSetting GCP project..." -ForegroundColor Green
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "`nEnabling required GCP APIs..." -ForegroundColor Green
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Deploy ML Service
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deploying ML Service..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Set-Location ml

gcloud run deploy $ML_SERVICE_NAME `
  --source . `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars "UPLOAD_DIR=/tmp/uploads" `
  --port 8080

$ML_SERVICE_URL = gcloud run services describe $ML_SERVICE_NAME --region $REGION --format 'value(status.url)'
Write-Host "ML Service deployed at: $ML_SERVICE_URL" -ForegroundColor Green

Set-Location ..

# Deploy API Service
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deploying API Service..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

gcloud run deploy $API_SERVICE_NAME `
  --source . `
  --dockerfile Dockerfile.api `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 1Gi `
  --cpu 1 `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars "NODE_ENV=production,VITE_ML_URL=$ML_SERVICE_URL" `
  --port 8080

$API_SERVICE_URL = gcloud run services describe $API_SERVICE_NAME --region $REGION --format 'value(status.url)'
Write-Host "API Service deployed at: $API_SERVICE_URL" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Deployment Complete!" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "ML Service URL:  $ML_SERVICE_URL" -ForegroundColor Green
Write-Host "API Service URL: $API_SERVICE_URL" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Blue
Write-Host "1. Update Vercel environment variables:"
Write-Host "   - VITE_API_URL=$API_SERVICE_URL"
Write-Host "   - VITE_ML_URL=$ML_SERVICE_URL"
Write-Host "2. Set secrets in Cloud Run console for sensitive data"
Write-Host "3. Configure custom domain (optional)"
