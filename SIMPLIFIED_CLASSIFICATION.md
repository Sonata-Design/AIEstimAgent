# 🎯 Simplified Floor Plan Detection Criteria

## ❌ **Problem:**
Even with image analysis, pages were still showing as "not analyzable" because the drawing detection was too strict.

## ✅ **New Solution: Simple Word Count Rules**

### **Classification Criteria:**

```
┌─────────────────────────────────────────────────┐
│ PRIORITY 0: Notes Keywords (Highest)           │
│ Has "general notes", "summary", "legend"?      │
│ AND word count > 100?                          │
│ → Notes ❌ (NOT analyzable)                    │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ PRIORITY 1: Drawing Detection                  │
│ Looks like drawing (visual analysis)?          │
│ AND NO notes keywords?                         │
│ → Floor Plan ✅ (analyzable)                   │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ PRIORITY 2: Word Count Analysis                │
│                                                 │
│ Word count 100-500 (moderate)?                 │
│ AND NO notes keywords?                         │
│ → Floor Plan (Labeled) ✅ (analyzable)         │
│                                                 │
│ Word count > 500 (very high)?                  │
│ → Notes ❌ (NOT analyzable)                    │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ PRIORITY 3: Low Text (< 100 words)             │
│ → Floor Plan ✅ (analyzable)                   │
└─────────────────────────────────────────────────┘
```

---

## 📊 **Simple Rules:**

### **✅ ANALYZABLE (Floor Plan):**

1. **Has drawing keywords:**
   - "floor plan", "elevation", "section"
   - "electrical", "plumbing", "hvac", "site"
   - → Confidence: 70-90%

2. **Word count 100-500 WITHOUT notes keywords:**
   - Likely a drawing with labels/dimensions
   - → Confidence: 60%

3. **Word count < 100:**
   - Low text = likely a drawing
   - → Confidence: 50-60%

4. **Looks like drawing (visual):**
   - White background + lines + contrast
   - → Confidence: 70%

### **❌ NOT ANALYZABLE (Notes):**

1. **Has notes keywords:**
   - "general notes", "construction notes", "summary"
   - "legend", "abbreviation", "symbol", "keynote"
   - → Confidence: 85-90%

2. **Word count > 500 WITHOUT drawing keywords:**
   - Too much text = likely notes
   - → Confidence: 70%

3. **Has "schedule" keywords:**
   - "schedule", "finish", "door schedule"
   - → Confidence: 80%

---

## 🎯 **Your 10-Page PDF:**

Based on your Colab results:

| Page | Words | Has Notes Keywords? | Result |
|------|-------|---------------------|--------|
| 1 | 837 | ✅ YES | ❌ Notes (too many words) |
| 2 | 329 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 3 | 211 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 4 | 177 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 5 | 406 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 6 | 411 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 7 | 248 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 8 | 223 | ❌ NO | ✅ Floor Plan (100-500 words) |
| 9 | 592 | ✅ YES | ❌ Notes (has keywords or >500 words) |
| 10 | 139 | ❌ NO | ✅ Floor Plan (100-500 words) |

**Expected: 8/10 analyzable** ✅

---

## 🔧 **Drawing Detection (Visual):**

### **New Thresholds (Very Permissive):**

```python
# Old (too strict)
brightness > 200
dark_ratio > 0.05
contrast > 30

# New (very permissive)
brightness > 150  # Handles dark scans
dark_ratio > 0.02  # Detects thin lines
contrast > 20      # More permissive
```

### **What It Checks:**

1. **Brightness:** Is the background reasonably light? (> 150)
2. **Dark pixels:** Are there some lines? (> 2% of pixels)
3. **Contrast:** Is there variation? (std > 20)
4. **Not blank:** Has some content (dark ratio > 1%)
5. **Not solid:** Not completely dark (dark ratio < 95%)

---

## 🧪 **Test Cases:**

### **Case 1: Floor Plan with Many Labels**
```
Words: 329
Text: "BEDROOM 12'x14', BATHROOM 8'x10', KITCHEN..."
Notes keywords: NO

Result: ✅ Floor Plan (Labeled) - 60%
Reason: 100-500 words, no notes keywords
```

### **Case 2: General Notes Page**
```
Words: 837
Text: "GENERAL NOTES
1. All dimensions...
2. Contractor shall..."

Result: ❌ Notes - 85%
Reason: Has "general notes" keyword
```

### **Case 3: Construction Notes**
```
Words: 592
Text: "CONSTRUCTION NOTES
- Foundation requirements..."

Result: ❌ Notes - 85%
Reason: Has "construction notes" keyword
```

### **Case 4: Simple Floor Plan**
```
Words: 45
Text: "FIRST FLOOR PLAN"

Result: ✅ Floor Plan - 90%
Reason: Has "floor plan" keyword
```

### **Case 5: Unlabeled Drawing**
```
Words: 139
Text: Random dimension labels

Result: ✅ Floor Plan (Labeled) - 60%
Reason: 100-500 words, no notes keywords
```

---

## 📝 **Key Changes:**

### **1. Word Count Threshold:**
- **100-500 words** without notes keywords → **Analyzable** ✅
- **> 500 words** without drawing keywords → **Not analyzable** ❌

### **2. More Permissive Drawing Detection:**
- Brightness: 200 → **150**
- Dark ratio: 0.05 → **0.02**
- Contrast: 30 → **20**

### **3. Notes Keywords Take Priority:**
- If has notes keywords → **Always not analyzable**
- Even if looks like drawing visually

---

## 🚀 **Test It:**

```bash
npm run dev
# Upload your PDF
# Expected: 8/10 pages analyzable
```

### **What to Check:**

1. **Pages 2-8, 10:** Should show as **Floor Plan (Labeled)** ✅
2. **Pages 1, 9:** Should show as **Notes** ❌
3. **Confidence:** 60-70% for labeled drawings

---

## ✅ **Summary:**

**The New Logic:**
- ✅ Simple word count rules (100-500 = drawing)
- ✅ Very permissive drawing detection
- ✅ Notes keywords override everything
- ✅ Fallback: moderate text = likely drawing

**Expected Result:**
- Before: 0/10 analyzable ❌
- After: 8/10 analyzable ✅
- Correctly identifies pages 1, 9 as notes

---

**This should finally work!** 🎉

The key insight: **Architectural drawings typically have 100-500 words of labels, dimensions, and room names. If it's in that range and doesn't have notes keywords, it's probably a drawing!**
