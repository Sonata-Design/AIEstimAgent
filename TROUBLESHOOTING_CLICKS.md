# Troubleshooting: Masks Not Clickable & Delete/Rename Not Working

## Issues Fixed

### 1. ✅ Removed Measurement Mode Block
**Problem:** Polygon clicks were blocked when measurement mode was active
**Fix:** Removed the early return in `handlePolygonClick`

```typescript
// BEFORE (blocked clicks):
if (measurementMode) {
  return  // ❌ This prevented all clicks
}

// AFTER (allows clicks):
// Allow polygon clicks even in measurement mode
// Users can select and edit masks while measure tool is active
```

### 2. ✅ Added Debug Logging
Added console logs to track:
- Delete operations
- Rename operations
- Detection counts

## How to Debug

### Step 1: Open Browser Console
1. Press `F12` to open DevTools
2. Go to "Console" tab
3. Clear console (trash icon)

### Step 2: Test Clicking Masks
1. Click on a green room mask
2. Look for console logs:
   ```
   [EditableOverlay] detections: 34 [...]
   [EditableOverlay] measurementMode: null
   [EditableOverlay] Will render 34 visible detections
   ```

3. If you see these logs, masks are rendering
4. If toolbar doesn't appear, check:
   - Is the mask actually selected?
   - Is `selectedPolygonId` being set?

### Step 3: Test Delete
1. Hover over a room card in right panel
2. Click the red 🗑️ button
3. Look for console logs:
   ```
   [RealtimeAnalysisPanel] Deleting: room-id-123
   [RealtimeAnalysisPanel] Current detections: 34
   [RealtimeAnalysisPanel] After delete: 33
   ```

4. Check if:
   - Mask disappears from canvas
   - Card disappears from panel

### Step 4: Test Rename
1. Click on room name in right panel
2. Type new name
3. Press Enter
4. Look for console logs:
   ```
   [RealtimeAnalysisPanel] Renaming: room-id-123 to Master Bedroom
   [RealtimeAnalysisPanel] Rename complete
   ```

## Common Issues & Solutions

### Issue 1: Masks Not Clickable

**Symptoms:**
- Clicking on masks does nothing
- No toolbar appears
- No console logs

**Possible Causes:**

#### A. Measurement Mode is Active
```typescript
// Check if measure tool is selected
console.log('Measurement mode:', measurementMode);
// Should be null when not measuring
```

**Solution:** Click "Select" tool (hand icon) instead of "Measure" tool

#### B. Pointer Events Blocked
```typescript
// Check in interactive-floor-plan.tsx
<div className="absolute top-0 left-0 pointer-events-auto">
  <EditableOverlay ... />
</div>
```

**Solution:** Ensure `pointer-events-auto` is set

#### C. Layer Not Listening
```typescript
// Check in EditableOverlay.tsx
<Layer listening imageSmoothingEnabled={false} hitGraphEnabled={false}>
```

**Solution:** Ensure `listening` is true

#### D. Stage Handlers Blocking
```typescript
// Check if stage is capturing clicks
onMouseDown={handleStageMouseDown}
```

**Solution:** Ensure `e.cancelBubble = true` in polygon click handler

### Issue 2: Delete Not Working

**Symptoms:**
- Click delete button
- Nothing happens
- No console logs

**Possible Causes:**

#### A. Event Not Propagating
```html
<Button onClick={(e) => {
  e.stopPropagation();  // ✅ This is correct
  handleDelete(r.id);
}}>
```

**Check:** Console logs should appear

#### B. Wrong Store Being Updated
```typescript
// Need to update BOTH stores:
removeFromStore(id);                              // useStore
setAllDetections(allDetections.filter(...));      // useDetectionsStore
```

**Check:** Both stores should be updated

#### C. ID Mismatch
```typescript
// IDs might be numbers vs strings
console.log('Deleting ID:', id, typeof id);
console.log('Detection IDs:', allDetections.map(d => ({ id: d.id, type: typeof d.id })));
```

**Solution:** Ensure ID types match

### Issue 3: Rename Not Working

**Symptoms:**
- Click on name
- Editor doesn't appear
- Can't type

**Possible Causes:**

#### A. EditingId Not Set
```typescript
onClick={() => {
  console.log('Setting editing ID:', r.id);
  setEditingId(r.id);
}}
```

**Check:** Console log should appear

#### B. Input Not Focused
```html
<Input autoFocus />  // ✅ Should auto-focus
```

**Check:** Input should be focused automatically

#### C. State Not Updating
```typescript
const [editingId, setEditingId] = useState<string | null>(null);
console.log('Current editing ID:', editingId);
```

**Check:** State should update

## Testing Checklist

### Before Testing
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Open console (F12)
- [ ] Clear console
- [ ] Upload floor plan
- [ ] Run analysis

### Test 1: Click Masks
- [ ] Click on green room mask
- [ ] Toolbar appears
- [ ] Console shows logs
- [ ] Can drag vertices

### Test 2: Delete from Panel
- [ ] Hover over room card
- [ ] Delete button (🗑️) appears
- [ ] Click delete
- [ ] Console shows "Deleting: ..."
- [ ] Mask disappears from canvas
- [ ] Card disappears from panel

### Test 3: Delete from Canvas
- [ ] Click on mask
- [ ] Toolbar appears
- [ ] Click delete on toolbar
- [ ] Mask disappears
- [ ] Card disappears from panel

### Test 4: Rename
- [ ] Click on room name
- [ ] Editor appears
- [ ] Input is focused
- [ ] Type new name
- [ ] Press Enter
- [ ] Console shows "Renaming: ..."
- [ ] Name updates in panel

## Quick Fixes

### Fix 1: Force Refresh
```bash
# Clear all caches
Ctrl + Shift + Delete
# Select "Cached images and files"
# Click "Clear data"
# Hard refresh: Ctrl + Shift + R
```

### Fix 2: Check Tool Selection
```
Make sure "Select" tool (hand icon) is active
Not "Measure" tool (ruler icon)
```

### Fix 3: Check Console for Errors
```
Look for red error messages
Common errors:
- "Cannot read property 'id' of undefined"
- "removeFromStore is not a function"
- "setAllDetections is not a function"
```

### Fix 4: Verify Stores Are Connected
```typescript
// Add to component:
console.log('removeFromStore:', typeof removeFromStore);
console.log('updateDetection:', typeof updateDetection);
console.log('setAllDetections:', typeof setAllDetections);

// Should all log "function"
```

## Expected Console Output

### On Page Load
```
[EditableOverlay] detections: 0 []
[EditableOverlay] measurementMode: null
[EditableOverlay] Will render 0 visible detections
```

### After Analysis
```
[EditableOverlay] detections: 34 [...]
[EditableOverlay] measurementMode: null
[EditableOverlay] Will render 34 visible detections
```

### On Click Mask
```
(No specific log, but toolbar should appear)
```

### On Delete
```
[RealtimeAnalysisPanel] Deleting: abc-123-def
[RealtimeAnalysisPanel] Current detections: 34
[RealtimeAnalysisPanel] After delete: 33
```

### On Rename
```
[RealtimeAnalysisPanel] Renaming: abc-123-def to Master Bedroom
[RealtimeAnalysisPanel] Rename complete
```

## If Still Not Working

### 1. Check File Changes Were Saved
- Verify `EditableOverlay.tsx` was saved
- Verify `realtime-analysis-panel.tsx` was saved
- Check git diff to see changes

### 2. Check Dev Server Reloaded
- Look for "HMR update" in terminal
- If not, restart dev server:
  ```bash
  npm run dev
  ```

### 3. Check Browser Cache
- Hard refresh: Ctrl + Shift + R
- Or clear cache completely

### 4. Check for TypeScript Errors
- Look in terminal for compilation errors
- Fix any errors before testing

### 5. Share Console Logs
If still not working, share:
- Console logs when clicking mask
- Console logs when clicking delete
- Console logs when clicking rename
- Any error messages (red text)

This will help diagnose the exact issue!
