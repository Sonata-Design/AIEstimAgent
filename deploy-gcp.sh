#!/bin/bash
# GCP Cloud Run Deployment Script for EstimAgent

# Configuration
PROJECT_ID="your-gcp-project-id"  # Replace with your GCP project ID
REGION="us-central1"  # Choose your region
ML_SERVICE_NAME="estimagent-ml"
API_SERVICE_NAME="estimagent-api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EstimAgent GCP Cloud Run Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo -e "\n${GREEN}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${GREEN}Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Deploy ML Service
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying ML Service...${NC}"
echo -e "${GREEN}========================================${NC}"

cd ml
gcloud run deploy $ML_SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "UPLOAD_DIR=/tmp/uploads" \
  --port 8080

ML_SERVICE_URL=$(gcloud run services describe $ML_SERVICE_NAME --region $REGION --format 'value(status.url)')
echo -e "${GREEN}ML Service deployed at: $ML_SERVICE_URL${NC}"

cd ..

# Deploy API Service
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying API Service...${NC}"
echo -e "${GREEN}========================================${NC}"

gcloud run deploy $API_SERVICE_NAME \
  --source . \
  --dockerfile Dockerfile.api \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,VITE_ML_URL=$ML_SERVICE_URL" \
  --port 8080

API_SERVICE_URL=$(gcloud run services describe $API_SERVICE_NAME --region $REGION --format 'value(status.url)')
echo -e "${GREEN}API Service deployed at: $API_SERVICE_URL${NC}"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}ML Service URL:${NC}  $ML_SERVICE_URL"
echo -e "${GREEN}API Service URL:${NC} $API_SERVICE_URL"
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Update Vercel environment variables:"
echo "   - VITE_API_URL=$API_SERVICE_URL"
echo "   - VITE_ML_URL=$ML_SERVICE_URL"
echo "2. Set secrets in Cloud Run console for sensitive data"
echo "3. Configure custom domain (optional)"
