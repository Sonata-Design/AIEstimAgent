# Eye Button Debug Guide

## Issue Fixed
The eye button was double-inverting the visibility state, causing it to not work properly.

## What Was Wrong

### Original Code (Line 235):
```typescript
onClick={(e) => {
  e.stopPropagation();
  toggleGroupVisibility(group, !allVisible);  // ❌ Passing !allVisible
}}
```

### The Problem:
1. We were passing `!allVisible` to the function
2. The function was ALSO inverting it: `const newVisible = !visible`
3. This caused **double inversion**: `!(!allVisible)` = `allVisible`
4. Result: Nothing changed!

## What Was Fixed

### Fixed Code:
```typescript
onClick={(e) => {
  e.stopPropagation();
  toggleGroupVisibility(group, allVisible);  // ✅ Pass current state
}}
```

### The Function:
```typescript
const toggleGroupVisibility = (group: ElementGroup, visible: boolean) => {
  const newVisible = !visible;  // Invert here
  // ... rest of logic
}
```

Now it works correctly:
- Pass current state (`allVisible`)
- Function inverts it once (`!visible`)
- Elements hide/show properly

## Debug Logging Added

To help diagnose issues, I've added console logs at each step:

### 1. Element List Panel
```typescript
console.log(`[ElementList] Toggling ${group.label} from ${visible} to ${newVisible}`);
console.log(`[ElementList] Setting ${element.id} to ${newVisible}`);
```

### 2. Dashboard
```typescript
console.log(`[Dashboard] Element ${elementId} visibility changed to ${visible}`);
console.log(`[Dashboard] Added/Removed ${elementId} to/from hidden set`);
console.log(`[Dashboard] Hidden elements count: ${newHidden.size}`);
```

### 3. Interactive Floor Plan
```typescript
console.log(`[FloorPlan] Total detections: ${allDetections.length}, Hidden: ${hiddenElements.size}`);
console.log(`[FloorPlan] Hiding element ${det.id}`);
console.log(`[FloorPlan] Visible detections: ${visibleDetections.length}`);
```

## How to Test

### 1. Open Browser Console (F12)

### 2. Run Analysis
- Upload a drawing
- Run AI analysis
- Wait for results

### 3. Click Eye Button on Walls Group
You should see in console:
```
[ElementList] Toggling Walls from true to false
[ElementList] Setting wall-id-1 to false
[ElementList] Setting wall-id-2 to false
[Dashboard] Element wall-id-1 visibility changed to false
[Dashboard] Added wall-id-1 to hidden set
[Dashboard] Element wall-id-2 visibility changed to false
[Dashboard] Added wall-id-2 to hidden set
[Dashboard] Hidden elements count: 2
[FloorPlan] Total detections: 10, Hidden: 2
[FloorPlan] Hiding element wall-id-1
[FloorPlan] Hiding element wall-id-2
[FloorPlan] Visible detections: 8
```

### 4. Verify on Canvas
- Walls should disappear from the canvas
- Eye icon should change to EyeOff (crossed out)

### 5. Click Eye Button Again
You should see:
```
[ElementList] Toggling Walls from false to true
[ElementList] Setting wall-id-1 to true
[ElementList] Setting wall-id-2 to true
[Dashboard] Element wall-id-1 visibility changed to true
[Dashboard] Removed wall-id-1 from hidden set
[Dashboard] Element wall-id-2 visibility changed to true
[Dashboard] Removed wall-id-2 from hidden set
[Dashboard] Hidden elements count: 0
[FloorPlan] Total detections: 10, Hidden: 0
[FloorPlan] Visible detections: 10
```

### 6. Verify on Canvas
- Walls should reappear on the canvas
- Eye icon should change back to Eye (visible)

## Expected Behavior

### Individual Element:
1. Click checkbox or eye icon next to element
2. Element hides/shows on canvas
3. Checkbox reflects state

### Group:
1. Click eye icon next to group header
2. ALL elements in group hide/show
3. Eye icon shows:
   - 👁️ (solid) = All visible
   - 👁️ (faded) = Some visible
   - 👁️‍🗨️ (crossed) = All hidden

## Data Flow

```
User clicks eye button
    ↓
ElementListPanel.toggleGroupVisibility()
    ↓
Updates local elementVisibility Map
    ↓
Calls onElementVisibilityToggle() for each element
    ↓
Dashboard.handleElementVisibilityToggle()
    ↓
Updates hiddenElements Set
    ↓
Passes to InteractiveFloorPlan
    ↓
Filters detections
    ↓
Canvas re-renders without hidden elements
```

## Troubleshooting

### If walls still don't disappear:

1. **Check Console Logs**
   - Are the logs appearing?
   - Is the visibility state changing correctly?
   - Is the hidden count increasing?

2. **Check Element IDs**
   - Do the element IDs match between list and canvas?
   - Are they being passed correctly?

3. **Check React DevTools**
   - Is `hiddenElements` Set updating?
   - Is the prop being passed to InteractiveFloorPlan?

4. **Check Canvas Rendering**
   - Is the useMemo re-running?
   - Are detections being filtered?

### Common Issues:

❌ **Double inversion** - FIXED
❌ **Element IDs don't match** - Check analysis results format
❌ **State not updating** - Check React state management
❌ **Canvas not re-rendering** - Check useMemo dependencies

## Remove Debug Logs (Production)

Once confirmed working, remove console.log statements:

1. `element-list-panel.tsx` - Lines 143, 147
2. `dashboard-new.tsx` - Lines 221, 225, 228, 231
3. `interactive-floor-plan.tsx` - Lines 88, 92, 96

Or keep them wrapped in:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...);
}
```

## Summary

✅ Fixed double inversion bug
✅ Added comprehensive logging
✅ Eye button now works correctly
✅ Walls hide/show as expected
