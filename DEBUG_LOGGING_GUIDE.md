# 🔍 Debug Logging Guide

## ✅ **Added Comprehensive Logging**

I've added detailed console logging to help identify why pages are being classified as "not analyzable".

---

## 📊 **What You'll See:**

### **For Each Page:**

```
================================================================================
[PAGE CLASSIFICATION DEBUG]
================================================================================
📄 Image: /path/to/page_1.jpg
📝 Word count: 329
📖 Text preview: FIRST FLOOR PLAN BEDROOM 12'x14' BATHROOM 8'x10' KITCHEN...

🖼️ DRAWING DETECTION:
   Brightness: 245.3 (need > 150: True)
   Dark ratio: 0.087 (need > 0.02: True)
   Contrast: 45.2 (need > 20: True)
   Not blank: True (dark ratio > 0.01)
   Not solid: True (dark ratio < 0.95)
   ➡️ Is Drawing: ✅ YES

🔍 NOTES KEYWORD DETECTION:
   Matched keywords: None
   Starts with 'notes': False
   Starts with 'general notes': False
   Starts with 'specifications': False
   ➡️ Has notes keywords: False

✅ FINAL CLASSIFICATION:
   Type: floor_plan
   Title: Floor Plan (Drawing)
   Analyzable: ✅ YES
   Confidence: 70%
================================================================================
```

---

## 🎯 **How to Use:**

### **1. Start Dev Server:**
```bash
npm run dev
```

### **2. Upload Your PDF**

### **3. Watch the Console**

Look for the detailed logs for each page. They will show:

---

## 🔍 **What to Check:**

### **1. Text Extraction:**
```
📝 Word count: 329
📖 Text preview: FIRST FLOOR PLAN BEDROOM...
```

**Questions:**
- Is the text being extracted correctly?
- Does it match what you see in the PDF?
- Is OCR reading garbled text?

---

### **2. Drawing Detection:**
```
🖼️ DRAWING DETECTION:
   Brightness: 245.3 (need > 150: True)
   Dark ratio: 0.087 (need > 0.02: True)
   Contrast: 45.2 (need > 20: True)
   ➡️ Is Drawing: ✅ YES
```

**Questions:**
- Is "Is Drawing" showing ✅ YES or ❌ NO?
- Which criteria is failing?
  - Brightness too low? (< 150)
  - Dark ratio too low? (< 0.02)
  - Contrast too low? (< 20)

---

### **3. Notes Keyword Detection:**
```
🔍 NOTES KEYWORD DETECTION:
   Matched keywords: ['notes:']
   ➡️ Has notes keywords: True
   ⚠️ NOTES KEYWORDS DETECTED!
```

**Questions:**
- Which keywords are matching?
- Are they false positives?
- Should we remove those keywords?

---

### **4. Final Classification:**
```
✅ FINAL CLASSIFICATION:
   Type: floor_plan
   Title: Floor Plan (Drawing)
   Analyzable: ✅ YES
   Confidence: 70%
```

**This shows the final decision!**

---

## 🐛 **Common Issues:**

### **Issue 1: All Pages Show "Notes"**

**Check:**
```
🔍 NOTES KEYWORD DETECTION:
   Matched keywords: ['notes', 'general']
```

**Solution:**
- Keywords without colons are matching too broadly
- Remove keywords without colons from the list
- Keep only: `'notes:'`, `'general notes:'`, etc.

---

### **Issue 2: Drawing Detection Always False**

**Check:**
```
🖼️ DRAWING DETECTION:
   Brightness: 120.5 (need > 150: False)  ← TOO LOW
   ➡️ Is Drawing: ❌ NO
```

**Solution:**
- Lower the brightness threshold
- Your PDFs might be darker scans
- Change `mostly_white = avg_brightness > 150` to `> 120`

---

### **Issue 3: OCR Extracting Wrong Text**

**Check:**
```
📖 Text preview: ||||| \\\\\ ===== (garbled)
```

**Solution:**
- Tesseract is reading lines/symbols as text
- This is normal for some PDFs
- Rely more on word count and drawing detection

---

## 📝 **Example Output:**

### **Page 1 (Notes Page):**
```
📝 Word count: 837
📖 Text preview: GENERAL NOTES: 1. All dimensions are in feet...
🖼️ Is Drawing: ❌ NO (brightness: 240, dark ratio: 0.015)
🔍 Matched keywords: ['general notes:']
✅ Type: notes, Analyzable: ❌ NO
```

### **Page 2 (Floor Plan):**
```
📝 Word count: 329
📖 Text preview: BEDROOM 12'x14' BATHROOM 8'x10' KITCHEN...
🖼️ Is Drawing: ✅ YES (brightness: 245, dark ratio: 0.087)
🔍 Matched keywords: None
✅ Type: floor_plan, Analyzable: ✅ YES
```

---

## 🚀 **Next Steps:**

1. **Upload your PDF**
2. **Copy the console output** for 2-3 pages
3. **Share with me:**
   - The text preview
   - Drawing detection results
   - Notes keyword matches
   - Final classification

4. **I'll help you:**
   - Adjust thresholds if needed
   - Remove false-positive keywords
   - Fix any issues

---

## 📋 **Quick Checklist:**

When you see the logs, check:

- [ ] Is text being extracted? (word count > 0)
- [ ] Does text preview look correct?
- [ ] Is drawing detection working? (✅ YES for drawings)
- [ ] Are notes keywords matching incorrectly?
- [ ] What's the final classification?

---

**Now test it and share the console output!** 🔍

The detailed logs will tell us exactly what's happening with your PDF!
