import type { Point } from "@/store/useMeasurementStore";

/**
 * Calculate distance between two points in pixels
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate area of a polygon using shoelace formula (in square pixels)
 */
export function calculateArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate perimeter of a polygon (in pixels)
 */
export function calculatePerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += calculateDistance(points[i], points[j]);
  }
  
  return perimeter;
}

/**
 * Convert pixels to real-world units based on scale
 * @param pixels - Value in pixels
 * @param pixelsPerFoot - Scale factor (pixels per foot)
 * @param isArea - Whether this is an area measurement (square units)
 */
export function pixelsToRealWorld(
  pixels: number,
  pixelsPerFoot: number,
  isArea: boolean = false
): number {
  if (pixelsPerFoot <= 0) return pixels;
  
  if (isArea) {
    // For area: divide by square of scale
    return pixels / (pixelsPerFoot * pixelsPerFoot);
  } else {
    // For distance: divide by scale
    return pixels / pixelsPerFoot;
  }
}

/**
 * Format measurement value with appropriate units
 */
export function formatMeasurement(
  value: number,
  type: 'distance' | 'area',
  decimals: number = 2,
  units: 'imperial' | 'metric' = 'imperial'
): string {
  if (units === 'metric') {
    // Convert from feet to meters
    if (type === 'area') {
      const sqMeters = value * 0.092903; // sq ft to sq m
      return `${sqMeters.toFixed(decimals)} m²`;
    } else {
      const meters = value * 0.3048; // ft to m
      return `${meters.toFixed(decimals)} m`;
    }
  } else {
    // Imperial units
    const formatted = value.toFixed(decimals);
    
    if (type === 'area') {
      return `${formatted} sq ft`;
    } else {
      // Convert to feet and inches for distances
      const feet = Math.floor(value);
      const inches = Math.round((value - feet) * 12);
      
      if (inches === 0) {
        return `${feet}'`;
      } else if (inches === 12) {
        return `${feet + 1}'`;
      } else {
        return `${feet}' ${inches}"`;
      }
    }
  }
}

/**
 * Get the center point of a set of points
 */
export function getCenterPoint(points: Point[]): Point {
  if (points.length === 0) return [0, 0];
  
  const sum = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0] as Point
  );
  
  return [sum[0] / points.length, sum[1] / points.length];
}

/**
 * Get the midpoint between two points
 */
export function getMidpoint(p1: Point, p2: Point): Point {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}
