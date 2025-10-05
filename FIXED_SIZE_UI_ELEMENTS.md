# Fixed-Size UI Elements on Canvas Zoom

## Problem

When zooming the canvas, the **vertices (control points) and draggable toolbar** were scaling with the image, making them either too large or too small. This is not industry standard behavior.

### **Expected Behavior (Industry Standard):**
- ✅ Image scales with zoom
- ✅ Polygons scale with zoom
- ✅ **Vertices stay fixed size** (always 5-6px radius)
- ✅ **Toolbar stays fixed size** (always readable)
- ✅ **Stroke width stays constant** (always 1-3px)

**Examples:** Figma, Photoshop, Illustrator, Togal, Beam AI all use this pattern.

---

## Solution: Inverse Scaling

Applied **inverse scaling** to UI elements so they maintain constant screen size regardless of zoom level.

### **Formula:**
```
inverseScale = 1 / canvasScale
elementSize = baseSize * inverseScale
```

**Example:**
- Canvas at 200% zoom (scale = 2.0)
- Vertex base radius = 5px
- Scaled radius = 5 * (1/2) = 2.5px in canvas space
- Appears as 5px on screen (2.5 * 2 = 5px)

---

## Implementation

### **1. Vertices (Control Points)**

**File:** `client/src/components/EditableOverlay.tsx`

```typescript
// Constants for base sizes
const BASE_VERTEX_RADIUS = 5
const BASE_VERTEX_RADIUS_SELECTED = 6

// In render:
const inverseScale = 1 / scale
const scaledRadius = (vertexSelected ? BASE_VERTEX_RADIUS_SELECTED : BASE_VERTEX_RADIUS) * inverseScale
const scaledStrokeWidth = (vertexSelected ? 2 : 1) * inverseScale

<Circle
  radius={scaledRadius}
  strokeWidth={scaledStrokeWidth}
  // ... other props
/>
```

**Result:**
- Normal vertex: Always 5px radius on screen
- Selected vertex: Always 6px radius on screen
- Stroke: Always 1-2px on screen

---

### **2. Polygon Stroke Width**

Applied inverse scaling to polygon borders:

```typescript
const inverseScale = 1 / scale
const baseStrokeWidth = isHovered ? 3 : STROKE_THIN
const scaledStrokeWidth = baseStrokeWidth * inverseScale
const glowStrokeWidth = 8 * inverseScale
const shadowBlur = isHovered ? 10 * inverseScale : 0

<Line
  strokeWidth={scaledStrokeWidth}
  shadowBlur={shadowBlur}
  // ... other props
/>
```

**Result:**
- Normal stroke: Always 1px on screen
- Hovered stroke: Always 3px on screen
- Glow effect: Always 8px on screen
- Shadow blur: Always 10px on screen

---

### **3. Draggable Toolbar**

**File:** `client/src/components/DraggableToolbar.tsx`

Added CSS transform with inverse scale:

```typescript
<div
  style={{
    // ... other styles
    transform: `scale(${1 / scale})`,
    transformOrigin: "top left",
  }}
>
  {/* Toolbar buttons */}
</div>
```

**Result:**
- Toolbar always appears at normal size
- Buttons remain clickable and readable
- Text doesn't get blurry or pixelated

---

### **4. Props Flow**

Updated the component chain to pass scale:

```
InteractiveFloorPlan (has viewState.scale)
    ↓ passes scale prop
EditableOverlay (receives scale)
    ↓ passes scale prop
DraggableToolbar (receives scale)
```

**Files Modified:**
1. `EditableOverlay.tsx` - Added scale prop, applied inverse scaling
2. `DraggableToolbar.tsx` - Added scale prop, applied CSS transform
3. `interactive-floor-plan.tsx` - Passed scale to EditableOverlay

---

## Technical Details

### **Why Inverse Scaling Works:**

When the canvas is scaled, everything inside scales proportionally:
```
Canvas scale = 2.0 (200% zoom)
Element size in canvas = 2.5px
Actual screen size = 2.5px × 2.0 = 5px ✓
```

Without inverse scaling:
```
Canvas scale = 2.0 (200% zoom)
Element size in canvas = 5px
Actual screen size = 5px × 2.0 = 10px ✗ (too big!)
```

### **Transform Origin:**

```css
transformOrigin: "top left"
```

This ensures the toolbar scales from its top-left corner, maintaining proper positioning.

---

## Visual Comparison

### **Before (Incorrect):**
| Zoom Level | Vertex Size | Toolbar Size | Stroke Width |
|------------|-------------|--------------|--------------|
| 50% | 2.5px | Tiny | 0.5px |
| 100% | 5px | Normal | 1px |
| 200% | 10px | Huge | 2px |
| 400% | 20px | Massive | 4px |

### **After (Industry Standard):**
| Zoom Level | Vertex Size | Toolbar Size | Stroke Width |
|------------|-------------|--------------|--------------|
| 50% | 5px ✓ | Normal ✓ | 1px ✓ |
| 100% | 5px ✓ | Normal ✓ | 1px ✓ |
| 200% | 5px ✓ | Normal ✓ | 1px ✓ |
| 400% | 5px ✓ | Normal ✓ | 1px ✓ |

---

## Benefits

1. ✅ **Consistent UI** - Elements always appear the same size
2. ✅ **Better UX** - Easy to click vertices at any zoom level
3. ✅ **Professional** - Matches Figma, Photoshop, Togal behavior
4. ✅ **Readable** - Toolbar text never gets too small or too large
5. ✅ **Precise editing** - Vertices don't obscure details when zoomed in
6. ✅ **Clean appearance** - Strokes don't become thick lines when zoomed

---

## Testing Scenarios

### **Test at Different Zoom Levels:**

1. **25% Zoom (Zoomed Out)**
   - ✓ Vertices should be 5px (not 1.25px)
   - ✓ Toolbar should be readable
   - ✓ Strokes should be 1px (not 0.25px)

2. **100% Zoom (Normal)**
   - ✓ Everything at base size
   - ✓ No changes from before

3. **200% Zoom (Zoomed In)**
   - ✓ Vertices should be 5px (not 10px)
   - ✓ Toolbar should be normal size
   - ✓ Strokes should be 1px (not 2px)

4. **400% Zoom (Max Zoom)**
   - ✓ Vertices should be 5px (not 20px)
   - ✓ Toolbar should be normal size
   - ✓ Strokes should be 1px (not 4px)

---

## Industry Standard Compliance

### **Figma:**
- Vertices: Fixed 4px radius
- Stroke: Fixed 1px width
- Toolbar: Fixed size

### **Photoshop:**
- Anchor points: Fixed 5px
- Paths: Fixed 1px
- Transform controls: Fixed size

### **Togal/Beam AI:**
- Detection markers: Fixed size
- Measurement tools: Fixed size
- UI overlays: Fixed size

### **EstimAgent (Now):**
- ✅ Vertices: Fixed 5-6px
- ✅ Strokes: Fixed 1-3px
- ✅ Toolbar: Fixed size
- ✅ **Matches industry standard!**

---

## Code Changes Summary

### **EditableOverlay.tsx:**
- Added `scale` prop to component
- Added constants: `BASE_VERTEX_RADIUS`, `BASE_VERTEX_RADIUS_SELECTED`
- Applied inverse scaling to:
  - Vertex radius
  - Vertex stroke width
  - Polygon stroke width
  - Glow effect width
  - Shadow blur
- Passed scale to DraggableToolbar

### **DraggableToolbar.tsx:**
- Added `scale` prop to component
- Applied CSS transform: `scale(${1 / scale})`
- Set transform origin to "top left"

### **interactive-floor-plan.tsx:**
- Passed `scale={viewState.scale}` to EditableOverlay

---

## Performance Impact

- ✅ **Negligible** - Simple arithmetic operations
- ✅ **No additional re-renders** - Scale already triggers re-render
- ✅ **GPU-accelerated** - CSS transforms use GPU
- ✅ **Smooth** - No jank or lag

---

## Result

The UI now behaves **exactly like professional design tools**:
- 🎯 Vertices stay perfectly clickable at any zoom
- 📏 Measurements remain readable
- ✨ Professional appearance maintained
- 🚀 Industry-standard interaction model
