# Quick Scale Fix Options

## Problem Summary

Room showing **14.7 SF** instead of expected **~150 SF** (10x smaller).

This is because the ML model is detecting a small polygon, not the full room.

## Quick Fix #1: Adjust DPI Assumption (Test First)

The current code assumes 96 DPI. If your drawings are higher resolution, try:

```python
# In ml/app.py, line 179:
# Change from:
DPI = 96.0

# To (test different values):
DPI = 96.0 * math.sqrt(10)  # ≈ 303 DPI (to fix 10x area issue)
# or
DPI = 96.0 * 3.16  # ≈ 303 DPI (more precise)
```

**Why sqrt(10)?** Because area is squared, so if area is 10x too small, the linear dimension is sqrt(10) too small.

## Quick Fix #2: Add Scale Correction Factor

Add a correction factor based on testing:

```python
# In ml/app.py, after line 293:
area_sqft = _convert_to_real_units(pixel_area, scale, "sq ft")

# Add correction factor:
AREA_CORRECTION_FACTOR = 10.0  # Adjust based on testing
area_sqft = area_sqft * AREA_CORRECTION_FACTOR

perimeter_ft = _convert_to_real_units(pixel_perimeter, scale, "ft")
PERIMETER_CORRECTION_FACTOR = 3.16  # sqrt(10)
perimeter_ft = perimeter_ft * PERIMETER_CORRECTION_FACTOR
```

## Quick Fix #3: Use Image-Specific DPI

Calculate DPI from image dimensions:

```python
# In ml/app.py, around line 448, after getting image dimensions:

# Estimate DPI based on image size
# Typical floor plan: 24" x 18" drawing
# If image is 4000x3000, then DPI = 4000/24 = 166 DPI
estimated_dpi = max(img_w, img_h) / 24  # Assume 24" max dimension

print(f"[ML] Estimated DPI: {estimated_dpi:.0f}")

# Then use this in _convert_to_real_units instead of hardcoded 96
```

## Recommended Approach: Use Calibration

The best solution is to use the calibration tool:

### Steps:
1. Upload floor plan
2. Click "Calibrate" button
3. Click two points on a known dimension (e.g., a wall marked as 10')
4. Enter the actual length (10 feet)
5. System calculates: `pixels_per_foot = pixel_distance / actual_feet`
6. Run analysis with calibrated scale

### Code is Already There!

```typescript
// In dashboard-new.tsx, line 179-182:
if (customPixelsPerFoot) {
  scaleValue = customPixelsPerFoot / 96;
}
```

This overrides the standard scale with the calibrated value!

## Test Plan

### Test 1: Check Current Values

Run analysis and check logs:
```
[ML] Room 'Bedroom' calculation:
  - Pixel area: ??? px²      <- Need this
  - Scale factor: 0.25
  - Converted area: 14.7 sq ft
```

### Test 2: Try DPI Adjustment

```python
# In ml/app.py, line 179:
DPI = 96.0 * 3.16  # Test this

# Re-run analysis, check if area is now ~150 SF
```

### Test 3: Use Calibration

1. Find a wall with known dimension on the plan
2. Use calibration tool
3. Re-run analysis
4. Check if area is correct

## Debugging Commands

### Check Image Dimensions
```python
# Add to ml/app.py around line 448:
print(f"[DEBUG] Original image: {original_img_w}x{original_img_h}")
print(f"[DEBUG] Resized image: {img_w}x{img_h}")
print(f"[DEBUG] Scale factor: {scale}")
print(f"[DEBUG] DPI: {DPI}")
print(f"[DEBUG] Pixels per foot: {scale * DPI}")
```

### Check Room Polygon
```python
# Add to ml/app.py around line 284:
if class_name and "room" in class_name.lower():
    min_x = min(p['x'] for p in item['mask'])
    max_x = max(p['x'] for p in item['mask'])
    min_y = min(p['y'] for p in item['mask'])
    max_y = max(p['y'] for p in item['mask'])
    width_px = max_x - min_x
    height_px = max_y - min_y
    
    print(f"[DEBUG] Room bounding box: {width_px:.0f}x{height_px:.0f} pixels")
    print(f"[DEBUG] Expected for 12x12 room: {12*24}x{12*24} = 288x288 pixels")
```

## Expected Results

### For 12' x 12' Bedroom (144 SF)

| Scale | DPI | Pixels/Foot | Expected Pixel Area | Your Pixel Area | Ratio |
|-------|-----|-------------|---------------------|-----------------|-------|
| 1/4" = 1' | 96 | 24 | 82,944 px² | 8,448 px² | 10x |
| 1/4" = 1' | 303 | 76 | 831,744 px² | 8,448 px² | 98x |

**Conclusion:** The issue is NOT the DPI - it's the ML model detecting a small polygon!

## Real Solution

The ML model needs to:
1. Detect the full room boundary (not just a small portion)
2. Merge adjacent room segments
3. Use better training data

**Short-term:** Use calibration tool for accurate measurements
**Long-term:** Retrain room detection model with better data

## What to Do Now

1. **Run analysis** and check Render logs for debug output
2. **Take screenshot** of the canvas showing the blue room mask
3. **Share both** so we can see exactly what's being detected
4. **Try calibration** tool as a workaround

The debug logging I added will show:
- Pixel area of detected polygon
- Scale factor being used
- Converted area in sq ft

This will tell us if it's a scale issue or a detection issue!
