# 🚀 Quick Start: Deploy EstimAgent to GCP

## TL;DR - 5 Steps to Deploy

```powershell
# 1. Install gcloud CLI
https://cloud.google.com/sdk/docs/install

# 2. Login and set project
gcloud auth login
gcloud config set project YOUR-PROJECT-ID

# 3. Create environment files
copy ml\.env.yaml.example ml\.env.yaml
# Edit ml\.env.yaml with your API keys

# 4. Run deployment script
.\deploy-to-gcp-quick.ps1 -ProjectId YOUR-PROJECT-ID

# 5. Update Vercel with new URLs
# (Script will show you the URLs)
```

---

## Detailed Steps

### Step 1: Create GCP Project

1. Go to https://console.cloud.google.com/
2. Click "New Project"
3. Name: `estimagent`
4. Note your Project ID (e.g., `estimagent-123456`)

### Step 2: Install Google Cloud CLI

**Windows:**
- Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
- Run installer
- Check "Run gcloud init"

**Verify:**
```powershell
gcloud --version
```

### Step 3: Authenticate

```powershell
# Login
gcloud auth login

# Set project
gcloud config set project estimagent-123456

# Set region
gcloud config set run/region us-central1
```

### Step 4: Prepare Environment Files

```powershell
# Copy template
copy ml\.env.yaml.example ml\.env.yaml

# Edit with your values
notepad ml\.env.yaml
```

Your `ml/.env.yaml` should have:
- Roboflow API keys
- Model workspace/project names
- CORS origins

### Step 5: Deploy!

```powershell
# Run the quick deployment script
.\deploy-to-gcp-quick.ps1 -ProjectId estimagent-123456
```

This will:
- ✅ Enable required GCP APIs
- ✅ Build Docker images
- ✅ Deploy ML service
- ✅ Deploy API service
- ✅ Configure CORS
- ✅ Test deployments

**Time:** ~15 minutes

### Step 6: Update Vercel

1. Go to https://vercel.com/dashboard
2. Select `estimagent` project
3. Settings → Environment Variables
4. Update:
   ```
   VITE_API_URL=https://estimagent-api-xxx.run.app
   VITE_ML_URL=https://estimagent-ml-xxx.run.app
   ```
5. Redeploy

---

## What You Get

### ML Service
- **URL**: `https://estimagent-ml-xxx.run.app`
- **Resources**: 4GB RAM, 2 CPUs
- **Features**:
  - Roboflow models (rooms, walls, doors/windows)
  - Custom YOLO model (ensemble learning)
  - No cold starts (min 1 instance)
  - Auto-scaling up to 10 instances

### API Service
- **URL**: `https://estimagent-api-xxx.run.app`
- **Resources**: 2GB RAM, 1 CPU
- **Features**:
  - Database operations
  - File uploads
  - Project management
  - Auto-scaling

---

## Cost Estimate

### Free Tier (per month):
- 2 million requests
- 360,000 GB-seconds
- 180,000 vCPU-seconds

### After Free Tier:
- **ML Service**: ~$15/month (1 min instance)
- **API Service**: ~$10/month (1 min instance)
- **Total**: ~$25/month

### With $300 Credit:
- **Free for 12 months!**

---

## Monitoring

### View Logs:
```powershell
# ML Service
gcloud run services logs read estimagent-ml --limit 50

# API Service
gcloud run services logs read estimagent-api --limit 50

# Follow in real-time
gcloud run services logs tail estimagent-ml
```

### View in Console:
https://console.cloud.google.com/run

---

## Updating Services

### Update ML Service:
```powershell
cd ml
gcloud run deploy estimagent-ml --source .
```

### Update API Service:
```powershell
cd api
gcloud run deploy estimagent-api --source .
```

---

## Troubleshooting

### "Permission denied"
```powershell
gcloud auth login
gcloud auth application-default login
```

### "Service build failed"
```powershell
# Check build logs
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### "Out of memory"
```powershell
# Increase memory
gcloud run services update estimagent-ml --memory 8Gi
```

### CORS errors
```powershell
# Update CORS origins
gcloud run services update estimagent-ml `
  --update-env-vars "CORS_ALLOW_ORIGINS=https://estimagent.vercel.app,https://your-api-url.run.app"
```

---

## Useful Commands

```powershell
# Get service URL
gcloud run services describe estimagent-ml --format 'value(status.url)'

# List all services
gcloud run services list

# Delete service
gcloud run services delete estimagent-ml

# View metrics
gcloud run services describe estimagent-ml

# Update environment variable
gcloud run services update estimagent-ml --update-env-vars KEY=VALUE

# Scale instances
gcloud run services update estimagent-ml --min-instances 0 --max-instances 5
```

---

## Migration Checklist

- [ ] GCP account created
- [ ] gcloud CLI installed
- [ ] Authenticated with gcloud
- [ ] Project created
- [ ] `.env.yaml` files created
- [ ] ML service deployed
- [ ] API service deployed
- [ ] Services tested
- [ ] Vercel updated
- [ ] Frontend tested
- [ ] Old Render services deleted

---

## Support

**Documentation:**
- Full guide: `GCP_MIGRATION_GUIDE.md`
- GCP Docs: https://cloud.google.com/run/docs

**Check Status:**
- GCP Status: https://status.cloud.google.com/
- Your Services: https://console.cloud.google.com/run

**Logs:**
```powershell
gcloud run services logs read SERVICE_NAME --limit 100
```

---

## Summary

✅ **Faster** - No cold starts with min instances
✅ **Cheaper** - $300 free credit + generous free tier
✅ **Scalable** - Auto-scales with traffic
✅ **Reliable** - 99.95% uptime SLA
✅ **Easy** - One command deployment

**Your EstimAgent is ready for production on GCP!** 🎉
