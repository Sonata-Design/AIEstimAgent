# 🛠️ How to Add Tesseract to PATH (Windows)

## ✅ **Method 1: During Installation (Recommended)**

When you run the Tesseract installer:

1. **Download**: https://github.com/UB-Mannheim/tesseract/wiki
2. Run `tesseract-ocr-w64-setup-5.3.3.20231005.exe`
3. ✅ **CHECK THIS BOX**: "Add to PATH"
4. Complete installation
5. **Restart terminal**

---

## 🔧 **Method 2: Add Manually (If Already Installed)**

### **Step-by-Step with Screenshots:**

#### **1. Open System Properties**
- Press `Win + X`
- Click **"System"**

#### **2. Open Advanced Settings**
- Click **"Advanced system settings"** (right side)
- Or search "Environment Variables" in Start menu

#### **3. Open Environment Variables**
- Click **"Environment Variables"** button at bottom

#### **4. Edit PATH Variable**

**You'll see two sections:**
- **User variables** (top) - Only for your account
- **System variables** (bottom) - For all users

**Choose System variables (recommended):**
1. Scroll down to find **"Path"**
2. Click on **"Path"**
3. Click **"Edit..."** button

#### **5. Add Tesseract Path**
1. Click **"New"** button
2. Type: `C:\Program Files\Tesseract-OCR`
3. Click **"OK"**
4. Click **"OK"** again
5. Click **"OK"** one more time

#### **6. Restart Terminal**
- Close all PowerShell/CMD windows
- Close VS Code/IDE
- Open new terminal

---

## 🧪 **Method 3: Quick PowerShell Command**

Run PowerShell **as Administrator**:

```powershell
# Add to System PATH (all users)
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\Tesseract-OCR",
    "Machine"
)
```

Then **restart your terminal**.

---

## 🐍 **Method 4: Set in Python Code (No PATH needed)**

If you can't modify PATH, edit `ml/pdf_processor.py`:

**Find this line (around line 21):**
```python
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Uncomment it (remove the #):**
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**If installed in different location, change the path:**
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Custom\Path\tesseract.exe'
```

---

## ✅ **Verify It Works**

Open **new** PowerShell and run:

```powershell
tesseract --version
```

### **Success:**
```
tesseract 5.3.3
 leptonica-1.83.1
  libgif 5.2.1 : libjpeg 8d (libjpeg-turbo 2.1.5.1) : libpng 1.6.40
```

### **Still Not Working:**
```
'tesseract' is not recognized as an internal or external command
```

**If you see this:**
1. Make sure you restarted terminal
2. Check installation path exists: `C:\Program Files\Tesseract-OCR`
3. Try Method 4 (set in Python code)

---

## 🔍 **Find Your Tesseract Installation**

Not sure where it's installed?

### **Option 1: Check Default Location**
```powershell
Test-Path "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

If it returns `True`, it's there!

### **Option 2: Search for It**
```powershell
Get-ChildItem -Path "C:\Program Files" -Filter "tesseract.exe" -Recurse -ErrorAction SilentlyContinue
```

### **Option 3: Use File Explorer**
1. Open File Explorer
2. Go to `C:\Program Files`
3. Look for `Tesseract-OCR` folder
4. Check if `tesseract.exe` is inside

---

## 🎯 **Quick Checklist**

- [ ] Tesseract installed
- [ ] Added to PATH (or set in code)
- [ ] Restarted terminal
- [ ] Tested with `tesseract --version`
- [ ] Installed Python package: `pip install pytesseract`

---

## 🐛 **Troubleshooting**

### **Problem: "tesseract not recognized"**

**Solution 1:** Restart terminal (PATH changes need restart)

**Solution 2:** Use full path in code:
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Solution 3:** Reinstall and check "Add to PATH"

### **Problem: "Permission denied"**

**Solution:** Run PowerShell as Administrator when adding to PATH

### **Problem: "Path not found"**

**Solution:** Verify installation location:
```powershell
dir "C:\Program Files\Tesseract-OCR"
```

---

## 📝 **Summary**

**Easiest Way:**
1. Download Tesseract installer
2. Check "Add to PATH" during install
3. Restart terminal
4. Done! ✅

**Alternative:**
1. Edit `ml/pdf_processor.py`
2. Uncomment line 21
3. Set full path to tesseract.exe
4. Done! ✅

**Both methods work perfectly!** 🎉
