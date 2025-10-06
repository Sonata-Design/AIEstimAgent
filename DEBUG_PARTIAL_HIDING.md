# Debug Guide: Partial Element Hiding Issue

## Problem
When clicking the eye button for "Doors & Windows", only 1-2 objects hide instead of all of them.

## Enhanced Logging Added

### 1. Element List Panel
```typescript
console.log(`[ElementList] Group has ${group.elements.length} elements:`, group.elements.map(e => e.id));
console.log(`[ElementList] Setting ${element.id} (${element.name}) to ${newVisible}`);
```

### 2. Interactive Floor Plan
```typescript
console.log(`[FloorPlan] All detection IDs:`, allDetections.map(d => `${d.id} (${d.class})`));
console.log(`[FloorPlan] Hidden IDs:`, Array.from(hiddenElements));
console.log(`[FloorPlan] Visible IDs:`, visibleDetections.map(d => `${d.id} (${d.class})`));
```

## How to Debug

### Step 1: Open Browser Console (F12)

### Step 2: Run Analysis
- Upload a drawing
- Run AI analysis
- Wait for results

### Step 3: Click Eye Button on "Doors & Windows"

### Step 4: Check Console Output

You should see something like:

```
[ElementList] Toggling Doors & Windows from true to false
[ElementList] Group has 5 elements: ["abc-123", "def-456", "ghi-789", "jkl-012", "mno-345"]
[ElementList] Setting abc-123 (Door) to false
[ElementList] Setting def-456 (Window) to false
[ElementList] Setting ghi-789 (Door) to false
[ElementList] Setting jkl-012 (Window) to false
[ElementList] Setting mno-345 (Door) to false

[Dashboard] Element abc-123 visibility changed to false
[Dashboard] Added abc-123 to hidden set
[Dashboard] Element def-456 visibility changed to false
[Dashboard] Added def-456 to hidden set
[Dashboard] Element ghi-789 visibility changed to false
[Dashboard] Added ghi-789 to hidden set
[Dashboard] Element jkl-012 visibility changed to false
[Dashboard] Added jkl-012 to hidden set
[Dashboard] Element mno-345 visibility changed to false
[Dashboard] Added mno-345 to hidden set
[Dashboard] Hidden elements count: 5

[FloorPlan] Total detections: 15, Hidden: 5
[FloorPlan] All detection IDs: ["abc-123 (Door)", "def-456 (Window)", "ghi-789 (Door)", ...]
[FloorPlan] Hidden IDs: ["abc-123", "def-456", "ghi-789", "jkl-012", "mno-345"]
[FloorPlan] Hiding element abc-123 (Door)
[FloorPlan] Hiding element def-456 (Window)
[FloorPlan] Hiding element ghi-789 (Door)
[FloorPlan] Hiding element jkl-012 (Window)
[FloorPlan] Hiding element mno-345 (Door)
[FloorPlan] Visible detections: 10
[FloorPlan] Visible IDs: ["room-1 (Room)", "wall-1 (Wall)", ...]
```

## Possible Issues to Look For

### Issue 1: ID Mismatch
**Symptoms:**
```
[ElementList] Group has 5 elements: ["abc-123", "def-456", ...]
[FloorPlan] All detection IDs: ["xyz-999 (Door)", "uvw-888 (Window)", ...]
```

**Problem:** The IDs in the element list don't match the IDs in the detections array.

**Cause:** 
- IDs might be regenerated somewhere
- Different sources for element list vs canvas

**Solution:** Ensure both use the same source (analysisResults.predictions)

### Issue 2: Partial ID Match
**Symptoms:**
```
[ElementList] Setting abc-123 (Door) to false
[ElementList] Setting def-456 (Window) to false
[Dashboard] Hidden elements count: 2
[FloorPlan] Hidden IDs: ["abc-123", "def-456"]
[FloorPlan] All detection IDs: ["abc-123 (Door)", "xyz-999 (Window)", ...]
[FloorPlan] Hiding element abc-123 (Door)
[FloorPlan] Visible detections: 14  // Only 1 hidden instead of 2
```

**Problem:** Some IDs match, some don't.

**Cause:**
- Mixed sources for detections
- Some detections added after initial analysis

**Solution:** Verify all detections come from the same analysis result

### Issue 3: Set Not Updating
**Symptoms:**
```
[Dashboard] Added abc-123 to hidden set
[Dashboard] Added def-456 to hidden set
[Dashboard] Hidden elements count: 1  // Should be 2!
```

**Problem:** Set isn't accumulating elements properly.

**Cause:** State update batching or Set reference issue

**Solution:** Ensure we're creating a new Set each time

### Issue 4: Filter Not Working
**Symptoms:**
```
[FloorPlan] Hidden IDs: ["abc-123", "def-456"]
[FloorPlan] All detection IDs: ["abc-123 (Door)", "def-456 (Window)", ...]
[FloorPlan] Visible detections: 15  // Should be 13!
```

**Problem:** Filter isn't removing hidden elements.

**Cause:** 
- `hiddenElements.has()` not working
- Wrong comparison

**Solution:** Verify Set.has() is checking exact string match

## Expected vs Actual

### Expected Behavior:
1. Click eye on "Doors & Windows" (5 elements)
2. All 5 element IDs added to hiddenElements Set
3. Filter removes all 5 from visible detections
4. Canvas re-renders without those 5 elements
5. All 5 doors/windows disappear

### If Only 1-2 Hide:
- Check if all 5 IDs are being added to hiddenElements
- Check if all 5 IDs exist in the detections array
- Check if the IDs match exactly (case-sensitive, no extra spaces)

## Quick Fix Attempts

### Attempt 1: Force Re-render
Add a key to InteractiveFloorPlan:
```typescript
<InteractiveFloorPlan
  key={hiddenElements.size}  // Force re-render when hidden count changes
  ...
/>
```

### Attempt 2: Debug ID Format
Check if IDs have extra characters:
```typescript
console.log('ID from list:', JSON.stringify(element.id));
console.log('ID from detection:', JSON.stringify(det.id));
```

### Attempt 3: Use Includes Instead of Has
If Set.has() isn't working:
```typescript
const isHidden = Array.from(hiddenElements).includes(det.id);
```

## Next Steps

1. **Run the app with console open**
2. **Click eye button on Doors & Windows**
3. **Copy the console output**
4. **Look for the patterns above**
5. **Share the output if issue persists**

The detailed logs will show exactly where the mismatch is occurring!
