# 🚀 Complete GCP Migration Guide for EstimAgent

## Overview

This guide will help you migrate your API and ML services from Render to Google Cloud Platform (GCP) using Cloud Run.

### Why GCP?
- ✅ **Better Performance** - Faster than Render free tier
- ✅ **No Cold Starts** - With minimum instances
- ✅ **Auto Scaling** - Handles traffic spikes
- ✅ **Free Tier** - $300 credit + 2M requests/month free
- ✅ **Better Reliability** - 99.95% uptime SLA

---

## 📋 Prerequisites

### 1. GCP Account Setup

**Step 1.1: Create GCP Account**
1. Go to https://console.cloud.google.com/
2. Sign in with Google account
3. Accept terms and get $300 free credit (90 days)

**Step 1.2: Create Project**
1. Click "Select a project" → "New Project"
2. Project name: `estimagent`
3. Click "Create"
4. Note your **Project ID** (e.g., `estimagent-123456`)

**Step 1.3: Enable Billing**
1. Go to "Billing" in left menu
2. Link a payment method (won't be charged during free trial)

---

### 2. Install Google Cloud CLI

**For Windows:**

```powershell
# Download installer
https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

# Run installer and follow prompts
# Check "Run 'gcloud init'" at the end
```

**Verify Installation:**
```powershell
gcloud --version
```

Expected output:
```
Google Cloud SDK 450.0.0
```

---

### 3. Authenticate and Configure

```powershell
# Login to GCP
gcloud auth login

# Set your project (replace with your Project ID)
gcloud config set project estimagent-123456

# Set default region
gcloud config set run/region us-central1

# Verify configuration
gcloud config list
```

---

## 🔧 Step-by-Step Deployment

### **STEP 1: Prepare Environment Variables**

#### 1.1: Create `.env.yaml` for ML Service

Create `ml/.env.yaml`:

```yaml
# ML Service Environment Variables
ROOM_API_KEY: "dCEzIpaPW5f2pc2T9ibl"
ROOM_WORKSPACE: "shakil-malek"
ROOM_PROJECT: "room-detection-r0fta"
ROOM_VERSION: "1"

WALL_API_KEY: "86sWXHROJPq5Gq1IwqPb"
WALL_WORKSPACE: "sonata-design"
WALL_PROJECT: "wall-detection-qpxun-rwqqb"
WALL_VERSION: "1"

DOORWINDOW_API_KEY: "86sWXHROJPq5Gq1IwqPb"
DOORWINDOW_WORKSPACE: "sonata-design"
DOORWINDOW_PROJECT: "estimagent-windows-doors-rooms-walls-v1-4n04f"
DOORWINDOW_VERSION: "3"

CUSTOM_WINDOW_MODEL_PATH: "./models/window_best.pt"
UPLOAD_DIR: "/tmp/uploads"
CORS_ALLOW_ORIGINS: "https://estimagent.vercel.app,http://localhost:5173"
```

#### 1.2: Create `.env.yaml` for API Service

Create `api/.env.yaml`:

```yaml
# API Service Environment Variables
NODE_ENV: "production"
DATABASE_URL: "your-database-url-here"
# Add other API env vars
```

---

### **STEP 2: Enable Required GCP APIs**

```powershell
# Enable Cloud Run
gcloud services enable run.googleapis.com

# Enable Cloud Build (for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Enable Artifact Registry
gcloud services enable artifactregistry.googleapis.com
```

Wait 1-2 minutes for APIs to be enabled.

---

### **STEP 3: Deploy ML Service**

```powershell
# Navigate to ML directory
cd ml

# Deploy to Cloud Run
gcloud run deploy estimagent-ml `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 4Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --min-instances 1 `
  --env-vars-file .env.yaml `
  --port 8080
```

**What this does:**
- Builds Docker image from Dockerfile
- Uploads to Google Container Registry
- Deploys to Cloud Run
- Sets environment variables
- Configures resources (4GB RAM, 2 CPUs)
- Keeps 1 instance always running (no cold starts)

**Expected output:**
```
Building using Dockerfile and deploying container to Cloud Run service [estimagent-ml]...
✓ Building and deploying... Done.
  ✓ Uploading sources...
  ✓ Building Container...
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [estimagent-ml] revision [estimagent-ml-00001-abc] has been deployed.
Service URL: https://estimagent-ml-abc123-uc.a.run.app
```

**Save this URL!** You'll need it for the frontend.

---

### **STEP 4: Deploy API Service**

```powershell
# Navigate back to root
cd ..

# Deploy API service
gcloud run deploy estimagent-api `
  --source ./api `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 1 `
  --timeout 300 `
  --max-instances 10 `
  --min-instances 1 `
  --env-vars-file ./api/.env.yaml `
  --port 8080
```

**Expected output:**
```
Service URL: https://estimagent-api-xyz789-uc.a.run.app
```

**Save this URL too!**

---

### **STEP 5: Update CORS in ML Service**

After getting the API URL, update ML service CORS:

```powershell
# Get current ML service URL
$ML_URL = gcloud run services describe estimagent-ml --region us-central1 --format 'value(status.url)'

# Get API service URL
$API_URL = gcloud run services describe estimagent-api --region us-central1 --format 'value(status.url)'

# Update ML service with correct CORS
gcloud run services update estimagent-ml `
  --region us-central1 `
  --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,$API_URL"
```

---

### **STEP 6: Update Vercel Environment Variables**

1. Go to https://vercel.com/dashboard
2. Select your `estimagent` project
3. Go to **Settings** → **Environment Variables**
4. Update these variables:

```bash
VITE_API_URL=https://estimagent-api-xyz789-uc.a.run.app
VITE_ML_URL=https://estimagent-ml-abc123-uc.a.run.app
```

5. Click **Save**
6. Go to **Deployments** → Click **...** → **Redeploy**

---

### **STEP 7: Test Your Deployment**

#### Test ML Service:
```powershell
curl https://estimagent-ml-abc123-uc.a.run.app/healthz
```

Expected: `ok`

#### Test API Service:
```powershell
curl https://estimagent-api-xyz789-uc.a.run.app/api/health
```

#### Test from Frontend:
1. Go to https://estimagent.vercel.app
2. Upload a floor plan
3. Run AI analysis
4. Should work without CORS errors!

---

## 📊 Cost Estimation

### Free Tier Limits (per month):
- **Cloud Run**: 2 million requests
- **Cloud Build**: 120 build-minutes
- **Container Registry**: 0.5 GB storage

### Expected Costs (after free tier):

| Service | Usage | Cost/Month |
|---------|-------|------------|
| **ML Service** | 10k requests, 1 min instance | ~$15 |
| **API Service** | 50k requests, 1 min instance | ~$10 |
| **Storage** | 500MB images | ~$0.50 |
| **Network** | 10GB egress | ~$1 |
| **Total** | | **~$26.50/month** |

**With $300 credit**: Free for ~11 months!

---

## 🔧 Advanced Configuration

### Set Secrets (for sensitive data)

Instead of environment variables, use Secret Manager:

```powershell
# Create secret
gcloud secrets create roboflow-api-key `
  --data-file=- `
  --replication-policy=automatic

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding roboflow-api-key `
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com `
  --role=roles/secretmanager.secretAccessor

# Update service to use secret
gcloud run services update estimagent-ml `
  --region us-central1 `
  --update-secrets=ROOM_API_KEY=roboflow-api-key:latest
```

### Enable Cloud CDN (for faster image loading)

```powershell
# Create Cloud Storage bucket
gsutil mb -l us-central1 gs://estimagent-uploads

# Enable public access
gsutil iam ch allUsers:objectViewer gs://estimagent-uploads

# Update API to use Cloud Storage
gcloud run services update estimagent-api `
  --update-env-vars "STORAGE_BUCKET=estimagent-uploads"
```

### Set up Custom Domain

```powershell
# Map custom domain
gcloud run domain-mappings create `
  --service estimagent-ml `
  --domain ml.estimagent.com `
  --region us-central1
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied" during deployment

**Solution:**
```powershell
# Grant yourself necessary roles
gcloud projects add-iam-policy-binding estimagent-123456 `
  --member=user:your-email@gmail.com `
  --role=roles/run.admin
```

### Issue: "Service build failed"

**Solution:**
```powershell
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID
```

### Issue: "Out of memory" errors

**Solution:**
```powershell
# Increase memory
gcloud run services update estimagent-ml `
  --memory 8Gi `
  --region us-central1
```

### Issue: Cold starts still happening

**Solution:**
```powershell
# Ensure min-instances is set
gcloud run services update estimagent-ml `
  --min-instances 1 `
  --region us-central1
```

---

## 📝 Monitoring & Logs

### View Logs:
```powershell
# ML Service logs
gcloud run services logs read estimagent-ml --region us-central1 --limit 50

# API Service logs
gcloud run services logs read estimagent-api --region us-central1 --limit 50

# Follow logs in real-time
gcloud run services logs tail estimagent-ml --region us-central1
```

### View Metrics:
1. Go to https://console.cloud.google.com/run
2. Click on service name
3. Go to **Metrics** tab
4. View:
   - Request count
   - Request latency
   - Container CPU/Memory usage
   - Error rate

---

## 🔄 Updating Services

### Update ML Service:
```powershell
cd ml

# Make your code changes, then:
gcloud run deploy estimagent-ml `
  --source . `
  --region us-central1
```

### Update API Service:
```powershell
cd api

gcloud run deploy estimagent-api `
  --source . `
  --region us-central1
```

### Rollback to Previous Version:
```powershell
# List revisions
gcloud run revisions list --service estimagent-ml --region us-central1

# Rollback
gcloud run services update-traffic estimagent-ml `
  --to-revisions REVISION_NAME=100 `
  --region us-central1
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] ML service responds to `/healthz`
- [ ] API service responds to health endpoint
- [ ] Custom model loads successfully (check logs)
- [ ] CORS allows Vercel origin
- [ ] Frontend can upload images
- [ ] AI analysis works end-to-end
- [ ] No cold start delays (with min-instances=1)
- [ ] Logs show ensemble learning working

---

## 🎯 Quick Commands Reference

```powershell
# Deploy ML
gcloud run deploy estimagent-ml --source ./ml --region us-central1

# Deploy API
gcloud run deploy estimagent-api --source ./api --region us-central1

# View logs
gcloud run services logs read estimagent-ml --region us-central1

# Update env vars
gcloud run services update estimagent-ml --update-env-vars KEY=VALUE

# Get service URL
gcloud run services describe estimagent-ml --region us-central1 --format 'value(status.url)'

# Delete service
gcloud run services delete estimagent-ml --region us-central1
```

---

## 📞 Support

If you encounter issues:

1. **Check logs**: `gcloud run services logs read SERVICE_NAME`
2. **View build logs**: `gcloud builds list`
3. **Check quotas**: https://console.cloud.google.com/iam-admin/quotas
4. **GCP Status**: https://status.cloud.google.com/

---

## Summary

✅ **Better Performance** - No more Render cold starts
✅ **Cost Effective** - $300 free credit + generous free tier
✅ **Scalable** - Auto-scales with traffic
✅ **Reliable** - 99.95% uptime SLA
✅ **Easy Updates** - Single command deployments

**Your EstimAgent is now running on Google Cloud Platform!** 🚀
