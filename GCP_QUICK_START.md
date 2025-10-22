# GCP Deployment - Quick Start Guide

## 🚀 Fast Track (5 Minutes)

### Prerequisites
- GCP account with billing enabled
- gcloud CLI installed

### Step 1: Install gcloud CLI (if not installed)

**Windows:**
```powershell
# Download and run installer
# https://cloud.google.com/sdk/docs/install
```

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Initialize and Login

```bash
# Login
gcloud auth login

# Create or select project
gcloud projects create estimagent-prod  # or use existing
gcloud config set project estimagent-prod

# Enable billing (required)
# Go to: https://console.cloud.google.com/billing
```

### Step 3: Deploy (Automated)

**Windows (PowerShell):**
```powershell
# Edit deploy-gcp.ps1 and set your PROJECT_ID
notepad deploy-gcp.ps1

# Run deployment
.\deploy-gcp.ps1
```

**Mac/Linux (Bash):**
```bash
# Edit deploy-gcp.sh and set your PROJECT_ID
nano deploy-gcp.sh

# Make executable
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh
```

### Step 4: Set Environment Variables

After deployment, you'll get two URLs. Set them as secrets:

```bash
# Get your service URLs
ML_URL=$(gcloud run services describe estimagent-ml --region us-central1 --format 'value(status.url)')
API_URL=$(gcloud run services describe estimagent-api --region us-central1 --format 'value(status.url)')

# Set Roboflow API keys and model configs
gcloud run services update estimagent-ml \
  --region us-central1 \
  --set-env-vars "\
ROOM_API_KEY=your_roboflow_key,\
WALL_API_KEY=your_roboflow_key,\
DOORWINDOW_API_KEY=your_roboflow_key,\
ROOM_WORKSPACE=your_workspace,\
ROOM_PROJECT=room-detection-r0fta,\
ROOM_VERSION=1,\
WALL_WORKSPACE=your_workspace,\
WALL_PROJECT=mytoolllaw-6vckj,\
WALL_VERSION=1,\
DOORWINDOW_WORKSPACE=your_workspace,\
DOORWINDOW_PROJECT=mytool-i6igr,\
DOORWINDOW_VERSION=1,\
CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,http://localhost:5173"

# Set API service environment
gcloud run services update estimagent-api \
  --region us-central1 \
  --set-env-vars "\
NODE_ENV=production,\
DATABASE_URL=your_neon_database_url,\
VITE_ML_URL=$ML_URL,\
VITE_API_URL=$API_URL,\
CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,http://localhost:5173"
```

### Step 5: Update Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add/Update:
```
VITE_API_URL = https://estimagent-api-xxx.run.app
VITE_ML_URL = https://estimagent-ml-xxx.run.app
```

Then redeploy: `vercel --prod`

## ✅ Done!

Your services are now running on GCP Cloud Run!

## 📊 Monitor Your Services

```bash
# View logs
gcloud run logs tail estimagent-ml --region us-central1
gcloud run logs tail estimagent-api --region us-central1

# Check service status
gcloud run services describe estimagent-ml --region us-central1
gcloud run services describe estimagent-api --region us-central1

# View metrics
# Go to: https://console.cloud.google.com/run
```

## 💰 Cost Estimate

**With moderate usage (1000 requests/day):**
- ML Service: ~$20-30/month
- API Service: ~$10-20/month
- **Total: ~$30-50/month**

**Free tier includes:**
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

## 🔧 Common Commands

### Update Service
```bash
# Update ML service
gcloud run services update estimagent-ml \
  --region us-central1 \
  --memory 4Gi

# Update API service
gcloud run services update estimagent-api \
  --region us-central1 \
  --max-instances 20
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service estimagent-ml --region us-central1

# Rollback
gcloud run services update-traffic estimagent-ml \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

### Delete Services
```bash
gcloud run services delete estimagent-ml --region us-central1
gcloud run services delete estimagent-api --region us-central1
```

## 🆘 Troubleshooting

### Service won't start
```bash
# Check logs
gcloud run logs read estimagent-ml --region us-central1 --limit 100

# Check service details
gcloud run services describe estimagent-ml --region us-central1
```

### Out of memory
```bash
# Increase memory
gcloud run services update estimagent-ml \
  --region us-central1 \
  --memory 4Gi
```

### Slow cold starts
```bash
# Keep 1 instance always running (costs more)
gcloud run services update estimagent-ml \
  --region us-central1 \
  --min-instances 1
```

## 📚 Full Documentation

See `GCP_DEPLOYMENT_GUIDE.md` for comprehensive documentation including:
- Custom domains
- CI/CD setup
- Secret management
- Advanced monitoring
- Cost optimization

## 🔗 Useful Links

- [GCP Console](https://console.cloud.google.com)
- [Cloud Run Dashboard](https://console.cloud.google.com/run)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
