# Scale Calculation Debug Guide

## Problem

Room area showing **14.7 SF** which is way too small for a bedroom (typical bedroom is 100-200 SF).

## Possible Causes

### 1. Image Resolution Issue
The image might be uploaded at a much higher resolution than expected (e.g., 300 DPI instead of 96 DPI).

**Check:**
- What's the actual image dimensions? (e.g., 4000x3000 vs 2000x1500)
- What's the source DPI of the scanned drawing?

### 2. Scale Factor Issue
The scale conversion might be incorrect.

**Current Logic:**
```python
# For 1/4" = 1' scale:
scale = 0.25  # (1/4 inch per foot)
DPI = 96      # Assumed screen resolution
pixels_per_foot = scale * DPI = 0.25 * 96 = 24 pixels
feet_per_pixel = 1 / 24 = 0.0417 feet

# For area:
area_sqft = pixel_area * (feet_per_pixel ** 2)
area_sqft = pixel_area * (0.0417 ** 2)
area_sqft = pixel_area * 0.00174
```

**Example:**
- If pixel_area = 8,448 px² (small room)
- area_sqft = 8,448 * 0.00174 = **14.7 SF** ✅ Matches your result!

### 3. ML Model Detection Issue
The model might be detecting a very small polygon instead of the full room.

## Diagnostic Steps

### Step 1: Check ML Service Logs

After running analysis, check the Render logs for the ML service:

```bash
# Look for these debug lines:
[ML] Room 'Bedroom' calculation:
  - Pixel area: 8448.00 px²
  - Pixel perimeter: 368.00 px
  - Scale factor: 0.25
  - Pixels per foot: 24.0
  - Converted area: 14.70 sq ft
  - Converted perimeter: 15.33 ft
```

### Step 2: Calculate Expected Values

**For a 12' x 12' bedroom (144 SF):**
```
Expected pixel area at 1/4" = 1' scale (96 DPI):
- 12 feet = 12 * 24 pixels = 288 pixels
- Area = 288 * 288 = 82,944 px²
- Converted = 82,944 * 0.00174 = 144 SF ✅
```

**Your actual result:**
```
Pixel area: ~8,448 px² (10x smaller than expected!)
Converted: 14.7 SF
```

**This means the detected polygon is about 10x smaller than it should be!**

### Step 3: Visual Inspection

Check the canvas to see if:
1. The room mask covers the entire room ❌ (probably not)
2. The room mask is just a small portion ✅ (likely this)
3. Multiple small polygons instead of one large room

## Solutions

### Solution 1: Fix ML Model Detection

The room detection model might be:
- Detecting only part of the room
- Breaking the room into multiple small segments
- Not merging adjacent room areas

**Action:** Retrain or adjust the room detection model to detect full room boundaries.

### Solution 2: Adjust DPI Assumption

If drawings are scanned at 300 DPI instead of 96 DPI:

```python
# In ml/app.py, line 179:
DPI = 300.0  # Instead of 96.0

# This would give:
pixels_per_foot = 0.25 * 300 = 75 pixels
feet_per_pixel = 1 / 75 = 0.0133 feet
area_sqft = 8,448 * (0.0133 ** 2) = 1.5 SF (even worse!)
```

**This doesn't fix the issue - the problem is the detected polygon size.**

### Solution 3: Use Calibration Tool

Instead of relying on standard scales, use the calibration tool:

1. User draws a line on a known dimension (e.g., 10 feet)
2. System calculates actual pixels per foot
3. Use this for all conversions

**This is already implemented in your code!**

### Solution 4: Merge Small Room Polygons

If the ML model detects multiple small polygons for one room:

```python
# Pseudo-code
def merge_adjacent_rooms(rooms):
    # Find rooms that are close together
    # Merge their polygons
    # Recalculate area
    return merged_rooms
```

## Immediate Debug Actions

### 1. Add Image Dimension Logging

```python
# In ml/app.py, around line 448:
print(f"[ML] Image dimensions: {original_img_w}x{original_img_h}")
print(f"[ML] Resized to: {img_w}x{img_h}")
print(f"[ML] Scale factor: {scale}")
```

### 2. Add Polygon Coordinate Logging

```python
# In ml/app.py, around line 284:
if class_name and "room" in class_name.lower():
    print(f"[ML] Room polygon points: {len(item['mask'])} vertices")
    print(f"[ML] Bounding box: min({min(p['x'] for p in item['mask']):.0f}, {min(p['y'] for p in item['mask']):.0f}) max({max(p['x'] for p in item['mask']):.0f}, {max(p['y'] for p in item['mask']):.0f})")
```

### 3. Check Frontend Scale Selection

```typescript
// In dashboard-new.tsx, add console.log:
console.log('[Analysis] Selected scale:', selectedScale);
console.log('[Analysis] Scale value:', scaleValue);
console.log('[Analysis] Custom pixels per foot:', customPixelsPerFoot);
```

## Expected vs Actual

### Typical Bedroom (12' x 12')

| Metric | Expected | Your Result | Ratio |
|--------|----------|-------------|-------|
| Area | 144 SF | 14.7 SF | 10x smaller |
| Perimeter | 48 LF | ~15 LF | 3x smaller |
| Pixel Area | 82,944 px² | 8,448 px² | 10x smaller |

**Conclusion:** The ML model is detecting a polygon that's about 10x smaller than the actual room.

## Quick Fixes

### Option A: Scale Multiplier (Temporary)

```python
# In ml/app.py, line 293:
area_sqft = _convert_to_real_units(pixel_area, scale, "sq ft") * 10  # Temporary fix
```

**⚠️ This is a hack and won't work for all rooms!**

### Option B: Adjust Scale Factor (If DPI is wrong)

```python
# In ml/app.py, line 179:
DPI = 96.0 * 3.16  # Adjust based on actual image DPI
```

**⚠️ Only do this if you know the actual DPI!**

### Option C: Use Calibration (Recommended)

1. Click "Calibrate" button
2. Draw a line on a known dimension (e.g., wall that's 10 feet)
3. Enter the actual length
4. System calculates correct pixels per foot
5. Re-run analysis

**✅ This is the proper solution!**

## Testing

After implementing fixes, test with known dimensions:

```
Test Case 1: 10' x 10' room
Expected: 100 SF
Tolerance: ±5 SF

Test Case 2: 15' x 12' room
Expected: 180 SF
Tolerance: ±9 SF

Test Case 3: 8' x 10' room
Expected: 80 SF
Tolerance: ±4 SF
```

## Next Steps

1. **Run analysis again** and check Render logs for debug output
2. **Share the logs** with pixel area, scale factor, and converted area
3. **Check the canvas** - does the blue room mask cover the entire room?
4. **Try calibration tool** - draw a line on a known dimension
5. **If still wrong** - the ML model needs retraining to detect full rooms

## Contact Info

If you need help debugging:
1. Share the Render ML service logs
2. Share a screenshot of the canvas with room mask
3. Share the original floor plan image dimensions
4. Share the scale you selected (1/4" = 1', etc.)

With this info, we can pinpoint the exact issue!
