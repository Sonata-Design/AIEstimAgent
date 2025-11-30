// Centralized color configuration for detection classes
// Custom colors optimized for visibility and user preference

export const DETECTION_COLORS = {
  // Rooms/Spaces - Green tones (user preference, bright and visible)
  room: "#10B981",      // Emerald-500 - Bright green, highly visible
  rooms: "#10B981",
  
  // Walls - Different colors for exterior and interior walls
  wall: "#3B82F6",      // Blue-500 - Default wall color (fallback)
  walls: "#3B82F6",
  exterior_wall: "#6B21A8", // Blue-600 - Darker blue for exterior walls
  interior_wall: "#3B82F6", // Blue-400 - Lighter blue for interior walls
  
  // Doors - Yellow tones (warm, attention-grabbing)
  door: "#EAB308",      // Yellow-500 - Bright yellow, visible on white
  doors: "#EAB308",
  
  // Windows - Orange tones (warm, distinct from yellow)
  window: "#F97316",    // Orange-500 - Distinct from doors
  windows: "#F97316",
  
  // Flooring - Purple tones
  flooring: "#8B5CF6",  // Violet-500
  
  // Openings (generic) - Teal
  openings: "#14B8A6",  // Teal-500
  
  // Other/Default - Pink
  other: "#EC4899",     // Pink-500
} as const;

// Opacity values for different states
export const OPACITY = {
  fill: {
    normal: 0.15,      // 15% opacity for normal state
    hover: 0.25,       // 25% opacity on hover
    selected: 0.35,    // 35% opacity when selected
  },
  stroke: {
    normal: 1.0,       // Full opacity for strokes
  }
} as const;

// Get color with opacity
export function getColorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Get color for a class name
export function getDetectionColor(className: string | undefined): string {
  if (!className) return DETECTION_COLORS.other;
  
  // Convert to lowercase and replace spaces with underscores for matching
  const normalized = className.toLowerCase().replace(/\s+/g, '_');
  
  // Check for wall types first
  if (normalized.includes('exterior_wall') || normalized === 'exterior wall') {
    return DETECTION_COLORS.exterior_wall;
  }
  if (normalized.includes('interior_wall') || normalized === 'interior wall') {
    return DETECTION_COLORS.interior_wall;
  }
  
  // Check other class names
  const key = normalized as keyof typeof DETECTION_COLORS;
  return DETECTION_COLORS[key] || DETECTION_COLORS.other;
}

// Color legend for UI display
export const COLOR_LEGEND = [
  { label: 'Rooms', color: DETECTION_COLORS.room, description: 'Green' },
  { label: 'Exterior Walls', color: DETECTION_COLORS.exterior_wall, description: 'Dark Blue' },
  { label: 'Interior Walls', color: DETECTION_COLORS.interior_wall, description: 'Light Blue' },
  { label: 'Doors', color: DETECTION_COLORS.door, description: 'Yellow' },
  { label: 'Windows', color: DETECTION_COLORS.window, description: 'Orange' },
] as const;
