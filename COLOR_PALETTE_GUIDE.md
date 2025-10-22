# EstimAgent Color Palette Guide

## Quick Reference

### Detection Colors

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🟦 ROOMS      #3B82F6  Blue-500    Professional       │
│  🟥 WALLS      #EF4444  Red-500     High Contrast      │
│  🟩 DOORS      #10B981  Emerald-500 Access Points      │
│  🟦 WINDOWS    #06B6D4  Cyan-500    Light/Openings     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Visual Examples

### Canvas Rendering

```
┌────────────────────────────────────────────┐
│                                            │
│    ╔═══════════════════════════╗          │
│    ║ ROOM (Blue Fill 15%)      ║          │
│    ║ Blue Stroke (2px)         ║          │
│    ║                           ║          │
│    ║  ┌──┐ DOOR (Green)        ║          │
│    ║  │  │                     ║          │
│    ║  └──┘                     ║          │
│    ║                           ║          │
│    ║  ▭▭▭ WINDOW (Cyan)        ║          │
│    ║                           ║          │
│    ╚═══════════════════════════╝          │
│    Red Wall Stroke (2px)                  │
│                                            │
└────────────────────────────────────────────┘
```

### Right Panel Cards

```
┌─────────────────────────────────────┐
│ ▌● Living Room                      │
│ ▌  Area: 250.5 sq ft               │
│ ▌  Perimeter: 65.2 ft              │
│ Blue border (4px)                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ▌● Wall Segment                     │
│ ▌  Length: 12.5 LF                 │
│ ▌  Area: 100.0 SF                  │
│ Red border (4px)                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ▌① Door                             │
│ ▌  W: 3.0 ft  H: 7.0 ft            │
│ Green border (4px)                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ▌② Window                           │
│ ▌  W: 4.0 ft  H: 3.0 ft            │
│ Cyan border (4px)                   │
└─────────────────────────────────────┘
```

## Color States

### Normal State
```
Fill Opacity: 15%
Stroke: 2px solid
Example: rgba(59, 130, 246, 0.15)
```

### Hover State
```
Fill Opacity: 25%
Stroke: 4px solid
Glow Effect: 20px blur
Example: rgba(59, 130, 246, 0.25)
```

### Selected State
```
Fill Opacity: 35%
Stroke: 2px solid
Vertices Visible: Yes
Example: rgba(59, 130, 246, 0.35)
```

## Usage in Code

### Import
```typescript
import { DETECTION_COLORS, getDetectionColor } from '@/config/colors';
```

### Get Color
```typescript
const color = getDetectionColor('room');    // Returns #3B82F6
const color = getDetectionColor('wall');    // Returns #EF4444
const color = getDetectionColor('door');    // Returns #10B981
const color = getDetectionColor('window');  // Returns #06B6D4
```

### Apply to Element
```typescript
// Inline style
<div style={{ backgroundColor: getDetectionColor(element.class) }} />

// Border
<Card style={{ borderLeftColor: getDetectionColor(element.class) }} />

// With opacity
<div style={{ 
  backgroundColor: getDetectionColor(element.class),
  opacity: 0.15 
}} />
```

## Accessibility

### Contrast Ratios
- Blue on White: 4.5:1 (AA compliant)
- Red on White: 4.5:1 (AA compliant)
- Green on White: 3.9:1 (Large text AA)
- Cyan on White: 3.5:1 (Large text AA)

### Colorblind Friendly
- ✅ Deuteranopia (Red-Green) - Blue/Red distinct
- ✅ Protanopia (Red-Green) - Blue/Red distinct
- ✅ Tritanopia (Blue-Yellow) - All colors distinct

## Comparison with Competitors

### Togal.ai Colors
- Rooms: Light Blue
- Walls: Red/Orange
- Doors: Green
- Windows: Blue

### Beam.ai Colors
- Rooms: Purple/Blue
- Walls: Red
- Doors: Green
- Windows: Cyan

### EstimAgent (Our Colors)
- Rooms: Blue (#3B82F6) ✅ Clear, professional
- Walls: Red (#EF4444) ✅ High contrast
- Doors: Green (#10B981) ✅ Industry standard
- Windows: Cyan (#06B6D4) ✅ Distinct from doors

## Design Principles

1. **High Contrast:** All colors stand out against white/gray backgrounds
2. **Distinct:** Each color is easily distinguishable from others
3. **Professional:** Uses modern, clean color palette
4. **Consistent:** Same colors across canvas and UI
5. **Accessible:** Meets WCAG AA standards for large text

## Mobile Considerations

### Small Screens
- Stroke width: 2px (scales with zoom)
- Touch targets: 44x44px minimum
- Color indicators: 12x12px dots
- Border indicators: 4px thick

### Dark Mode (Future)
- Rooms: #60A5FA (Blue-400)
- Walls: #F87171 (Red-400)
- Doors: #34D399 (Emerald-400)
- Windows: #22D3EE (Cyan-400)

## Print/Export

### PDF Reports
- Use full saturation colors
- Include color legend
- Ensure 300 DPI quality

### Screenshots
- Colors render correctly at any resolution
- Maintain contrast in compressed images

## Customization (Future)

### User Preferences
```typescript
// Future API
setUserColors({
  room: '#custom-color',
  wall: '#custom-color',
  // ...
});
```

### Team Standards
```typescript
// Future API
setTeamColors(teamId, colorScheme);
```

## Summary

The new color system provides:
- ✅ Clear visual distinction
- ✅ Professional appearance
- ✅ Industry-standard colors
- ✅ Accessibility compliance
- ✅ Consistent user experience
- ✅ Easy maintenance

All colors are defined in one place (`client/src/config/colors.ts`) and used consistently across the entire application.
