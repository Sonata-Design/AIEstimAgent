# 📝 Enhanced Notes Detection

## ✅ **Added Comprehensive Notes Keywords**

### **New Keywords Detected:**

```python
notes_keywords = [
    # Basic
    'note', 'notes',
    'specification', 'specifications',
    
    # Specific types
    'general notes',
    'construction notes',
    'design notes',
    'project notes',
    'drawing notes',
    
    # Other common terms
    'summary',
    'legend',
    'abbreviation',
    'symbol',
    'keynote',
    'general',
    'description'
]
```

---

## 🎯 **How It Works:**

### **Priority 0 (Highest): Notes Keywords + High Word Count**

```python
if has_notes_keywords and word_count > 100:
    → Notes & Specifications (NOT analyzable)
    → Confidence: 90%
```

**Examples:**
- "GENERAL NOTES" with 200+ words → ❌ Notes
- "CONSTRUCTION NOTES" with 150+ words → ❌ Notes
- "SUMMARY" with 300+ words → ❌ Notes

---

### **Priority 1: Drawing Detection**

```python
elif is_drawing and not has_notes_keywords:
    → Floor Plan / Elevation (analyzable)
    → Confidence: 70-90%
```

**Examples:**
- Drawing with labels but no "notes" keywords → ✅ Floor Plan
- Drawing with dimensions → ✅ Floor Plan

---

### **Priority 2: Text-Heavy Pages**

```python
elif word_count > 100:
    if has_notes_keywords:
        → Notes (NOT analyzable)
```

---

## 📊 **Classification Logic:**

```
Page Upload
    ↓
Extract text with OCR
    ↓
┌─────────────────────────────────────────┐
│ PRIORITY 0: Notes Keywords Check        │
│ Has "general notes", "summary", etc.?   │
│ AND word count > 100?                   │
│  └─ YES → Notes ❌ (90% confidence)     │
│  └─ NO → Continue...                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ PRIORITY 1: Drawing Detection           │
│ Looks like drawing (white + lines)?     │
│ AND NO notes keywords?                  │
│  └─ YES → Floor Plan ✅ (70% confidence)│
│  └─ NO → Continue...                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ PRIORITY 2: Text Analysis               │
│ Word count > 100?                       │
│  └─ Has notes keywords → Notes ❌       │
│  └─ Has drawing keywords → Floor Plan ✅│
│  └─ Default → Notes ❌                  │
└─────────────────────────────────────────┘
```

---

## 🧪 **Test Cases:**

### **Case 1: General Notes Page**
```
Text: "GENERAL NOTES
1. All dimensions are in feet and inches...
2. Contractor shall verify all dimensions...
[200+ words]"

Result: ❌ Notes & Specifications (90%)
Reason: Has "general notes" keyword + high word count
```

### **Case 2: Construction Notes**
```
Text: "CONSTRUCTION NOTES
- Foundation shall be...
- Framing requirements...
[150+ words]"

Result: ❌ Notes & Specifications (90%)
Reason: Has "construction notes" keyword
```

### **Case 3: Floor Plan with Labels**
```
Text: "FIRST FLOOR PLAN
BEDROOM 12'x14'
BATHROOM 8'x10'
[100+ words of room labels]"

Result: ✅ Floor Plan (90%)
Reason: Has "floor plan" keyword, NO notes keywords
```

### **Case 4: Drawing with Summary**
```
Text: "SUMMARY
This drawing shows...
[150+ words]"

Result: ❌ Notes & Specifications (90%)
Reason: Has "summary" keyword (notes override)
```

### **Case 5: Legend/Symbol Page**
```
Text: "LEGEND
Wall symbols...
Door symbols...
[100+ words]"

Result: ❌ Notes & Specifications (90%)
Reason: Has "legend" keyword
```

---

## 📝 **Keywords List:**

### **Will Mark as Notes:**
- ✅ "general notes"
- ✅ "construction notes"
- ✅ "design notes"
- ✅ "project notes"
- ✅ "drawing notes"
- ✅ "summary"
- ✅ "legend"
- ✅ "abbreviation"
- ✅ "symbol"
- ✅ "keynote"
- ✅ "specification"
- ✅ "specifications"

### **Will Mark as Analyzable:**
- ✅ "floor plan"
- ✅ "elevation"
- ✅ "section"
- ✅ "electrical"
- ✅ "plumbing"
- ✅ "hvac"
- ✅ "site plan"
- ✅ "detail"

---

## 🎯 **Expected Behavior:**

### **Your 10-Page PDF:**

| Page | Content | Keywords | Result |
|------|---------|----------|--------|
| 1 | General Notes | "general notes" | ❌ Notes (90%) |
| 2 | Floor Plan | "floor plan" | ✅ Floor Plan (90%) |
| 3 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 4 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 5 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 6 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 7 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 8 | Floor Plan | (drawing, no keywords) | ✅ Floor Plan (70%) |
| 9 | Construction Notes | "construction notes" | ❌ Notes (90%) |
| 10 | Summary | "summary" | ❌ Notes (90%) |

**Result: 7/10 analyzable ✅**

---

## 🚀 **Test It:**

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Upload your PDF**

3. **Expected results:**
   - Pages with "general notes", "summary", etc. → ❌ Not analyzable
   - Drawing pages without notes keywords → ✅ Analyzable
   - Higher confidence for notes detection (90%)

---

## ✅ **Summary:**

**Added:**
- ✅ Comprehensive notes keywords
- ✅ Highest priority for notes detection
- ✅ Overrides drawing detection if notes keywords present
- ✅ 90% confidence for notes pages

**Result:**
- More accurate classification
- Correctly identifies notes/legend/summary pages
- Still detects drawings with labels as analyzable

---

**Ready to test!** 🎉
