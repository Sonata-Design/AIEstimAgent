# EstimAgent GCP Deployment Guide

Complete guide to deploy EstimAgent services to Google Cloud Platform (GCP).

## Architecture

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
┌────────▼────────┐  ┌──▼──────────────┐
│  Cloud Run      │  │  Cloud Run      │
│  (API Service)  │  │  (ML Service)   │
└────────┬────────┘  └─────────────────┘
         │
┌────────▼────────┐
│  Neon Database  │
│  (PostgreSQL)   │
└─────────────────┘
```

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed (optional, for local testing)
4. **GCP Project** created

## Step-by-Step Deployment

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Mac: brew install google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash

# Initialize gcloud
gcloud init

# Login to your Google account
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required GCP APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 3. Deploy ML Service (Python/FastAPI)

```bash
# Navigate to ML directory
cd ml

# Deploy to Cloud Run
gcloud run deploy estimagent-ml \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --port 8080

# Get the service URL
gcloud run services describe estimagent-ml \
  --region us-central1 \
  --format 'value(status.url)'
```

**Set Environment Variables:**

```bash
gcloud run services update estimagent-ml \
  --region us-central1 \
  --set-env-vars "ROOM_API_KEY=your_roboflow_key,WALL_API_KEY=your_roboflow_key,DOORWINDOW_API_KEY=your_roboflow_key,ROOM_WORKSPACE=your_workspace,ROOM_PROJECT=your_project,ROOM_VERSION=your_version,WALL_WORKSPACE=your_workspace,WALL_PROJECT=your_project,WALL_VERSION=your_version,DOORWINDOW_WORKSPACE=your_workspace,DOORWINDOW_PROJECT=your_project,DOORWINDOW_VERSION=your_version,UPLOAD_DIR=/tmp/uploads"
```

### 4. Deploy API Service (Node.js/Express)

```bash
# Navigate back to root
cd ..

# Deploy API service
gcloud run deploy estimagent-api \
  --source . \
  --dockerfile Dockerfile.api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --port 8080

# Get the service URL
gcloud run services describe estimagent-api \
  --region us-central1 \
  --format 'value(status.url)'
```

**Set Environment Variables:**

```bash
# Replace with your actual URLs and credentials
gcloud run services update estimagent-api \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=your_neon_db_url,VITE_ML_URL=https://estimagent-ml-xxx.run.app,VITE_API_URL=https://estimagent-api-xxx.run.app,CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,http://localhost:5173"
```

### 5. Update Vercel Environment Variables

Go to your Vercel dashboard and update:

```
VITE_API_URL=https://estimagent-api-xxx.run.app
VITE_ML_URL=https://estimagent-ml-xxx.run.app
```

Then redeploy your Vercel frontend.

## Using the Deployment Script (Automated)

```bash
# Make script executable
chmod +x deploy-gcp.sh

# Edit the script to set your PROJECT_ID
nano deploy-gcp.sh

# Run deployment
./deploy-gcp.sh
```

## Cost Optimization

### Cloud Run Pricing (Approximate)

- **Free Tier:** 2 million requests/month
- **CPU:** $0.00002400/vCPU-second
- **Memory:** $0.00000250/GiB-second
- **Requests:** $0.40/million requests

**Estimated Monthly Cost:**
- ML Service (2GB RAM, 2 CPU): ~$20-50/month (moderate usage)
- API Service (1GB RAM, 1 CPU): ~$10-30/month (moderate usage)

### Cost-Saving Tips

1. **Set min-instances to 0** (default) - scales to zero when not in use
2. **Use request-based pricing** - only pay when serving requests
3. **Enable Cloud CDN** for static assets
4. **Set max-instances** to prevent runaway costs

```bash
# Update service with cost controls
gcloud run services update estimagent-ml \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 5 \
  --cpu-throttling
```

## Managing Secrets (Recommended)

Instead of setting environment variables directly, use Secret Manager:

```bash
# Create secrets
echo -n "your_roboflow_key" | gcloud secrets create roboflow-api-key --data-file=-
echo -n "your_neon_db_url" | gcloud secrets create database-url --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding roboflow-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update service to use secrets
gcloud run services update estimagent-ml \
  --region us-central1 \
  --set-secrets "ROOM_API_KEY=roboflow-api-key:latest"
```

## Custom Domain Setup

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service estimagent-api \
  --domain api.estimagent.com \
  --region us-central1

gcloud run domain-mappings create \
  --service estimagent-ml \
  --domain ml.estimagent.com \
  --region us-central1
```

Then update DNS records as instructed by GCP.

## Monitoring and Logs

### View Logs

```bash
# ML Service logs
gcloud run logs read estimagent-ml --region us-central1 --limit 50

# API Service logs
gcloud run logs read estimagent-api --region us-central1 --limit 50

# Follow logs in real-time
gcloud run logs tail estimagent-ml --region us-central1
```

### Monitoring Dashboard

1. Go to [GCP Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **Services**
3. Click on your service
4. View **Metrics** tab for:
   - Request count
   - Request latency
   - Container CPU/Memory utilization
   - Error rate

## CI/CD with GitHub Actions

Create `.github/workflows/deploy-gcp.yml`:

```yaml
name: Deploy to GCP Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy-ml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy ML Service
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: estimagent-ml
          region: us-central1
          source: ./ml

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy API Service
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: estimagent-api
          region: us-central1
          source: .
          flags: '--dockerfile=Dockerfile.api'
```

## Troubleshooting

### Issue: Cold Start Delays

**Solution:** Set min-instances to 1 for critical services

```bash
gcloud run services update estimagent-api \
  --region us-central1 \
  --min-instances 1
```

### Issue: Memory Errors

**Solution:** Increase memory allocation

```bash
gcloud run services update estimagent-ml \
  --region us-central1 \
  --memory 4Gi
```

### Issue: CORS Errors

**Solution:** Update CORS_ALLOW_ORIGINS in API service

```bash
gcloud run services update estimagent-api \
  --region us-central1 \
  --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,https://your-custom-domain.com"
```

### Issue: Timeout Errors

**Solution:** Increase timeout (max 3600 seconds)

```bash
gcloud run services update estimagent-ml \
  --region us-central1 \
  --timeout 600
```

## Comparison: Render vs GCP Cloud Run

| Feature | Render (Current) | GCP Cloud Run |
|---------|------------------|---------------|
| **Cold Start** | 30-60 seconds (free tier) | 1-3 seconds |
| **Pricing** | $7/month (starter) | Pay-per-use (~$20-50/month) |
| **Scaling** | Limited on free tier | Auto-scales to 1000+ instances |
| **Memory** | 512MB (free) | Up to 32GB |
| **CPU** | Shared (free) | Up to 8 vCPU |
| **Timeout** | 30s (free) | Up to 60 minutes |
| **Custom Domain** | Limited on free | Full support with SSL |
| **Monitoring** | Basic | Advanced (Cloud Monitoring) |

## Next Steps

1. ✅ Deploy ML service to Cloud Run
2. ✅ Deploy API service to Cloud Run
3. ✅ Update Vercel environment variables
4. ✅ Test end-to-end functionality
5. ⬜ Set up custom domain (optional)
6. ⬜ Configure CI/CD pipeline (optional)
7. ⬜ Set up monitoring alerts (optional)
8. ⬜ Enable Cloud CDN for better performance (optional)

## Support

- **GCP Documentation:** https://cloud.google.com/run/docs
- **Cloud Run Pricing:** https://cloud.google.com/run/pricing
- **Community Support:** https://stackoverflow.com/questions/tagged/google-cloud-run

## Rollback

If something goes wrong, rollback to previous revision:

```bash
# List revisions
gcloud run revisions list --service estimagent-ml --region us-central1

# Rollback to specific revision
gcloud run services update-traffic estimagent-ml \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```
