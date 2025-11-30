# 🚀 How to Start ML Service - Step by Step

## ❌ **Problem:**
- `http://localhost:8000/test` shows "not found"
- No logs appear when uploading PDF
- ML service not running

---

## ✅ **Solution: Start ML Service Manually**

### **Step 1: Run Diagnostic Test**

Open a **NEW terminal** and run:

```bash
cd ml
python test_service.py
```

**Expected output:**
```
✅ Successfully imported app
✅ Successfully imported PDFProcessor
✅ Tesseract version: 5.x.x
✅ /test endpoint exists
✅ /upload-pdf endpoint exists
```

**If you see errors:** Fix them first before continuing.

---

### **Step 2: Start ML Service Manually**

In the **same terminal** (ml folder):

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [67890]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**If you see this:** ✅ ML service is running!

---

### **Step 3: Test the Service**

Open browser and go to:
```
http://localhost:8000/test
```

**Expected:**
```json
{
  "status": "ok",
  "message": "ML service is running"
}
```

**If you see this:** ✅ Service is accessible!

---

### **Step 4: Start Frontend & API**

Open **ANOTHER terminal** and run:

```bash
# In the main project folder (not ml folder)
npm run dev:api
```

Open **ANOTHER terminal** and run:

```bash
npm run dev:frontend
```

**Now you have 3 terminals running:**
1. ML Service (port 8000)
2. API Service (port 5001)
3. Frontend (port 5173)

---

### **Step 5: Upload PDF**

1. Go to `http://localhost:5173`
2. Upload a PDF
3. Watch the **ML service terminal** for logs

**You should see:**
```
================================================================================
[ML] 📄 PDF UPLOAD RECEIVED
================================================================================
[ML] Filename: your-file.pdf
...
[PAGE CLASSIFICATION DEBUG]
...
```

---

## 🐛 **Common Issues:**

### **Issue 1: "uvicorn: command not found"**

**Solution:**
```bash
pip install uvicorn
```

---

### **Issue 2: "ModuleNotFoundError: No module named 'fastapi'"**

**Solution:**
```bash
cd ml
pip install -r requirements.txt
```

---

### **Issue 3: Port 8000 already in use**

**Solution:**
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

---

### **Issue 4: Import errors in app.py**

**Check:**
```bash
cd ml
python -c "from app import app; print('OK')"
```

**If error:** Fix the import issue first.

---

## 🎯 **Alternative: Use npm run dev**

If manual start works, try `npm run dev` again:

```bash
# Stop all services (Ctrl+C in all terminals)

# In main project folder
npm run dev
```

**Watch for:**
```
[dev:ml] INFO:     Application startup complete.
```

**If you see this:** ML service started successfully via npm!

---

## 📋 **Checklist:**

Before uploading PDF:

- [ ] ML service running (check `http://localhost:8000/test`)
- [ ] API service running (port 5001)
- [ ] Frontend running (port 5173)
- [ ] No errors in any terminal
- [ ] Tesseract installed and working

---

## 🧪 **Quick Test Commands:**

### **Test 1: Check if ML service is running**
```bash
curl http://localhost:8000/test
```

### **Test 2: Check ML service health**
```bash
curl http://localhost:8000/docs
```
Should show FastAPI documentation page.

### **Test 3: Check if port is listening**
```bash
netstat -ano | findstr :8000
```
Should show a process listening on port 8000.

---

## 📝 **Expected Terminal Output:**

### **ML Service Terminal:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.

[When you upload PDF:]
================================================================================
[ML] 📄 PDF UPLOAD RECEIVED
================================================================================
[ML] Filename: floor-plans.pdf
...
```

### **API Service Terminal:**
```
🚀 API Server running on http://0.0.0.0:5001
```

### **Frontend Terminal:**
```
VITE v5.4.20  ready in 968 ms
➜  Local:   http://localhost:5173/
```

---

## 🚀 **Summary:**

**If `npm run dev` doesn't work:**

1. **Start ML service manually:**
   ```bash
   cd ml
   python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **In another terminal, start API:**
   ```bash
   npm run dev:api
   ```

3. **In another terminal, start frontend:**
   ```bash
   npm run dev:frontend
   ```

**This way you can see logs in each terminal separately!**

---

## 🔍 **Still Not Working?**

Run the diagnostic and share the output:

```bash
cd ml
python test_service.py
```

Share:
1. Full output of diagnostic test
2. Any error messages
3. Output of `pip list | findstr fastapi`
4. Output of `pip list | findstr uvicorn`

---

**The ML service MUST be running for PDF upload to work!** 🚀
