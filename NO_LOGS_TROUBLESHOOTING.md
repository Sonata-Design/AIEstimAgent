# 🔍 No Logs Appearing - Troubleshooting Guide

## ❌ **Problem:**
After uploading PDF, no logs appear in the console.

---

## ✅ **Solutions:**

### **Step 1: Verify ML Service is Running**

Open your browser and go to:
```
http://localhost:8000/test
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "ML service is running"
}
```

**If you see this:** ✅ ML service is running

**If you get an error:** ❌ ML service is not running or wrong port

---

### **Step 2: Check Which Terminal Has ML Logs**

When you run `npm run dev`, it starts **3 services**:

1. **[dev:api]** - API service (port 5001)
2. **[dev:frontend]** - Frontend (port 5173)
3. **[dev:ml]** - ML service (port 8000) ← **LOGS APPEAR HERE**

**Look for the `[dev:ml]` prefix in your terminal!**

---

### **Step 3: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

**You should see:**
```
[dev:ml] INFO:     Uvicorn running on http://127.0.0.1:8000
[dev:ml] INFO:     Application startup complete.
```

---

### **Step 4: Upload PDF and Watch for Logs**

**You should see:**
```
================================================================================
[ML] 📄 PDF UPLOAD RECEIVED
================================================================================
[ML] Filename: your-file.pdf
[ML] Upload ID: abc-123-def
[ML] Starting PDF processing...
================================================================================

================================================================================
[PAGE CLASSIFICATION DEBUG]
================================================================================
📄 Image: page_1.jpg
📝 Word count: 329
📖 Text preview: BEDROOM 12'x14'...
...
```

---

### **Step 5: Check Frontend is Calling ML Service**

Open browser console (F12) and check Network tab:

1. Upload PDF
2. Look for request to: `http://localhost:8000/upload-pdf`
3. Check if it's successful (Status 200)

**If request fails:**
- Check CORS errors
- Check if ML service is running
- Check if port 8000 is correct

---

## 🐛 **Common Issues:**

### **Issue 1: Logs Going to Different Terminal**

**Problem:** You have multiple terminals open

**Solution:** 
- Close all terminals
- Open ONE terminal
- Run `npm run dev`
- All logs will appear in that terminal

---

### **Issue 2: ML Service Not Starting**

**Check terminal for:**
```
[dev:ml] ERROR: ...
```

**Common causes:**
- Port 8000 already in use
- Python/uvicorn not installed
- Import errors in pdf_processor.py

**Solution:**
```bash
cd ml
python -m uvicorn app:app --reload --port 8000
```

---

### **Issue 3: Frontend Not Calling ML Service**

**Check browser console for:**
```
Failed to fetch
CORS error
Network error
```

**Solution:**
- Verify ML service URL in frontend
- Check CORS configuration
- Verify ML service is running

---

### **Issue 4: Logs Disabled**

**Check if logging is configured:**

In `ml/app.py`, verify:
```python
print(f"[ML] 📄 PDF UPLOAD RECEIVED")  # Should be present
```

---

## 🧪 **Quick Test:**

### **Test 1: ML Service Running**
```bash
curl http://localhost:8000/test
```

**Expected:** `{"status":"ok","message":"ML service is running"}`

---

### **Test 2: PDF Upload Endpoint**
```bash
curl -X POST http://localhost:8000/upload-pdf \
  -F "file=@your-file.pdf"
```

**Expected:** JSON response with pages data

---

### **Test 3: Check Logs Manually**

In terminal, you should see:
```
[dev:ml] INFO:     127.0.0.1:xxxxx - "POST /upload-pdf HTTP/1.1" 200 OK
```

---

## 📋 **Checklist:**

Before uploading PDF, verify:

- [ ] `npm run dev` is running
- [ ] You see `[dev:ml] INFO: Application startup complete`
- [ ] Browser can access `http://localhost:8000/test`
- [ ] You're watching the correct terminal (with `[dev:ml]` prefix)
- [ ] No errors in terminal

---

## 🎯 **Expected Log Flow:**

```
1. Upload PDF in browser
   ↓
2. [ML] 📄 PDF UPLOAD RECEIVED
   ↓
3. [PAGE CLASSIFICATION DEBUG] for each page
   ↓
4. [ML] ✅ PDF PROCESSING COMPLETE
   ↓
5. Browser shows page gallery
```

---

## 🚀 **Try This:**

1. **Stop server:** Ctrl+C
2. **Clear terminal:** `cls` (Windows) or `clear` (Mac/Linux)
3. **Restart:** `npm run dev`
4. **Wait for:** `[dev:ml] INFO: Application startup complete`
5. **Upload PDF**
6. **Watch terminal** for logs with `[dev:ml]` prefix

---

## 📝 **Still No Logs?**

Share this info:

1. **Terminal output** after running `npm run dev`
2. **Browser console** errors (F12)
3. **Network tab** - Does `/upload-pdf` request succeed?
4. **Can you access** `http://localhost:8000/test`?

---

**The logs WILL appear in the terminal with `[dev:ml]` prefix!** 🔍
