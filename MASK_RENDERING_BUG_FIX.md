# Mask Rendering Bug Fix

## Problem Description

**Symptom:** After running analysis, the detection masks (rooms, walls, doors, windows) were not visible on the canvas. However, when clicking the measure tool, the masks would suddenly appear.

## Root Cause

The issue was in `interactive-floor-plan.tsx` at line 248. The `EditableOverlay` component (which renders the masks) was conditionally rendered based on:

```typescript
{!isCalibrating && (allDetectionsFromStore.length > 0 || measurementMode) && (
```

The problem:
1. `allDetectionsFromStore` comes from `useDetectionsStore` (the API results store)
2. The actual masks are rendered from `useStore` (the editing store)
3. There's a sync process that copies detections from `useDetectionsStore` → `useStore`
4. The sync happens in a `useEffect`, which runs **after** the initial render
5. So on first render after analysis: `allDetectionsFromStore.length > 0` is true, but `useStore.detections` is still empty
6. The overlay renders, but has no detections to display
7. When clicking measure tool, it triggers a re-render, and by then the sync has completed

## Solution

Changed the conditional rendering check to use the **synced** store detections instead:

### Before:
```typescript
const allDetectionsFromStore = useDetectionsStore(state => state.detections);

// Later...
{!isCalibrating && (allDetectionsFromStore.length > 0 || measurementMode) && (
  <EditableOverlay ... />
)}
```

### After:
```typescript
const allDetectionsFromStore = useDetectionsStore(state => state.detections);
const syncedStoreDetections = useStore(state => state.detections); // ✅ Added

// Later...
{!isCalibrating && (syncedStoreDetections.length > 0 || measurementMode) && (
  <EditableOverlay ... />
)}
```

## Changes Made

**File:** `client/src/components/interactive-floor-plan.tsx`

1. **Line 91-92:** Added `syncedStoreDetections` to track the synced detections from `useStore`
2. **Line 251:** Changed condition from `allDetectionsFromStore.length > 0` to `syncedStoreDetections.length > 0`
3. **Lines 163-170:** Added debug logging to track overlay rendering state

## Testing

To verify the fix works:

1. Upload a floor plan
2. Select takeoff types (rooms, walls, doors)
3. Click "Run Analysis"
4. **Expected:** Masks should appear immediately after analysis completes
5. **Before fix:** Masks only appeared after clicking measure tool or other interaction

## Technical Details

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Flow                            │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Run Analysis"
   ↓
2. ML Service returns predictions
   ↓
3. Results stored in useDetectionsStore
   ↓
4. InteractiveFloorPlan receives analysisResults prop
   ↓
5. useMemo converts to storeDetections format
   ↓
6. useEffect syncs to useStore (for editing)
   ↓
7. EditableOverlay reads from useStore
   ↓
8. Masks rendered on canvas
```

### Why Two Stores?

- **useDetectionsStore:** Holds raw API results, persists through re-analysis
- **useStore:** Holds editable detections with undo/redo, vertex manipulation

The sync process preserves manual annotations while updating AI detections.

## Related Files

- `client/src/components/interactive-floor-plan.tsx` - Main fix location
- `client/src/components/EditableOverlay.tsx` - Renders the masks
- `client/src/store/useStore.ts` - Editing store
- `client/src/store/useDetectionsStore.ts` - API results store

## Prevention

To prevent similar issues in the future:

1. Always check which store the conditional logic depends on
2. Ensure the condition matches the data source being rendered
3. Add debug logging for complex state synchronization
4. Test rendering immediately after state changes, not just after user interactions
