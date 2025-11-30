# 🔧 Page Classification Fix

## ❌ **Problem:**
All PDF pages were showing as "Not Analyzable" even when they contained floor plans and drawings.

## 🔍 **Root Cause:**
The OCR classification logic had a gap:
- Pages with **low text** (< 100 words) entered the "drawing" classification path
- But if they didn't have specific keywords like "floor plan" written on them
- AND didn't match the aspect ratio criteria (0.7-1.5)
- They fell through with the default `analyzable = False`

**Reality:** Most architectural drawings have minimal or no text labels, so they were incorrectly marked as not analyzable.

---

## ✅ **Solution:**

Added a **fallback rule** for unlabeled drawings:

```python
# If still unknown but has low text (likely a drawing without clear labels)
else:
    if word_count < 100:
        # Likely a drawing page, make it analyzable
        page_type = 'floor_plan'
        title = "Floor Plan (Unlabeled)"
        analyzable = True
        confidence = 0.50
    # Otherwise keep as unknown and not analyzable
```

---

## 📊 **Classification Logic (Updated):**

### **Text-Heavy Pages (> 100 words):**
- Contains "note", "specification" → **Notes** (NOT analyzable)
- Contains "schedule", "finish" → **Schedule** (NOT analyzable)
- High word count (> 200) → **Cover Page** (NOT analyzable)

### **Drawing Pages (< 100 words):**
1. **Has keywords:**
   - "floor plan" → **Floor Plan** (analyzable, 90% confidence)
   - "elevation" → **Elevation** (analyzable, 90% confidence)
   - "electrical" → **Electrical Plan** (analyzable, 85% confidence)
   - etc.

2. **No keywords but good aspect ratio (0.7-1.5):**
   - → **Floor Plan** (analyzable, 60% confidence)

3. **No keywords, any aspect ratio:** ✨ **NEW**
   - → **Floor Plan (Unlabeled)** (analyzable, 50% confidence)

---

## 🎯 **Result:**

Now pages are marked as analyzable if they:
- ✅ Have specific drawing keywords (floor plan, elevation, etc.)
- ✅ Look like drawings (low text + good aspect ratio)
- ✅ **NEW:** Have low text even without keywords (likely unlabeled drawings)

Only marked as NOT analyzable if:
- ❌ Text-heavy with notes/specifications
- ❌ Schedules or tables
- ❌ Cover pages
- ❌ High text count (> 100 words) without drawing keywords

---

## 🧪 **Test Results:**

All test cases pass:

| Test Case | Word Count | Keywords | Result | Analyzable |
|-----------|------------|----------|--------|------------|
| Minimal text drawing | 5 | None | Floor Plan (Unlabeled) | ✅ Yes |
| Notes page | 150 | "note", "specification" | Notes | ❌ No |
| Labeled floor plan | 20 | "floor plan" | Floor Plan | ✅ Yes |
| Unlabeled drawing | 80 | None | Floor Plan (Unlabeled) | ✅ Yes |

---

## 🚀 **How to Test:**

1. **Restart ML service:**
   ```bash
   npm run dev
   ```

2. **Upload a PDF** with architectural drawings

3. **Expected behavior:**
   - ✅ Drawing pages show as analyzable
   - ✅ Notes/schedules show as not analyzable
   - ✅ Can select and analyze floor plans
   - ✅ "Select All Analyzable" button works

---

## 📝 **Files Modified:**

- `ml/pdf_processor.py` - Added fallback for unlabeled drawings (lines 275-283)

---

## ✅ **Ready to Test!**

The classification is now much more permissive for drawing-like pages, so your architectural PDFs should work correctly! 🎉
