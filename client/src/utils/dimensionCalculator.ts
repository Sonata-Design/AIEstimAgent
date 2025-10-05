// Utility to calculate real-time dimensions from polygon points

export type Point = [number, number];

/**
 * Calculate polygon area using shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  
  return Math.abs(area / 2);
}

/**
 * Calculate polygon perimeter
 */
export function calculatePolygonPerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[j][0] - points[i][0];
    const dy = points[j][1] - points[i][1];
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return perimeter;
}

/**
 * Calculate bounding box dimensions (width and height)
 */
export function calculateBoundingBox(points: Point[]): { width: number; height: number; minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) {
    return { width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = points[0][0];
  let maxX = points[0][0];
  let minY = points[0][1];
  let maxY = points[0][1];
  
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  
  return {
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
    maxX,
    maxY
  };
}

/**
 * Convert pixels to real-world units based on scale
 * @param pixels - Measurement in pixels
 * @param pixelsPerFoot - Scale factor (e.g., 48 for 1/4" = 1')
 * @param unit - Target unit (ft, in, m, cm)
 */
export function pixelsToRealWorld(
  pixels: number,
  pixelsPerFoot: number,
  unit: 'ft' | 'in' | 'm' | 'cm' = 'ft'
): number {
  if (!pixelsPerFoot || pixelsPerFoot === 0) return 0;
  
  const feet = pixels / pixelsPerFoot;
  
  switch (unit) {
    case 'ft':
      return feet;
    case 'in':
      return feet * 12;
    case 'm':
      return feet * 0.3048;
    case 'cm':
      return feet * 30.48;
    default:
      return feet;
  }
}

/**
 * Recalculate all dimensions for a detection based on its points
 */
export function recalculateDimensions(
  points: Point[],
  pixelsPerFoot: number,
  category: string
): {
  area_sqft?: number;
  perimeter_ft?: number;
  width_ft?: number;
  height_ft?: number;
} {
  const bbox = calculateBoundingBox(points);
  const area_px = calculatePolygonArea(points);
  const perimeter_px = calculatePolygonPerimeter(points);
  
  const dimensions: any = {};
  
  // For rooms: area and perimeter
  if (category === 'rooms' || category === 'room') {
    dimensions.area_sqft = pixelsToRealWorld(Math.sqrt(area_px), pixelsPerFoot) ** 2;
    dimensions.perimeter_ft = pixelsToRealWorld(perimeter_px, pixelsPerFoot);
  }
  
  // For openings: width and height
  if (category === 'openings' || category === 'door' || category === 'window') {
    dimensions.width_ft = pixelsToRealWorld(bbox.width, pixelsPerFoot);
    dimensions.height_ft = pixelsToRealWorld(bbox.height, pixelsPerFoot);
  }
  
  // For walls: length (perimeter) and area
  if (category === 'walls' || category === 'wall') {
    dimensions.perimeter_ft = pixelsToRealWorld(perimeter_px, pixelsPerFoot);
    dimensions.area_sqft = pixelsToRealWorld(Math.sqrt(area_px), pixelsPerFoot) ** 2;
  }
  
  return dimensions;
}
