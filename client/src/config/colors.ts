// Centralized color configuration for detection classes
// Custom colors optimized for visibility and user preference

export const DETECTION_COLORS = {
  // Rooms/Spaces - Green tones (user preference, bright and visible)
  room: "#10B981",      // Emerald-500 - Bright green, highly visible
  rooms: "#10B981",
  
  // Walls - Blue tones (professional, clear contrast)
  wall: "#3B82F6",      // Blue-500 - Professional, high contrast
  walls: "#3B82F6",
  
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
  const key = className.toLowerCase() as keyof typeof DETECTION_COLORS;
  return DETECTION_COLORS[key] || DETECTION_COLORS.other;
}

// Color legend for UI display
export const COLOR_LEGEND = [
  { label: 'Rooms', color: DETECTION_COLORS.room, description: 'Green' },
  { label: 'Walls', color: DETECTION_COLORS.wall, description: 'Blue' },
  { label: 'Doors', color: DETECTION_COLORS.door, description: 'Yellow' },
  { label: 'Windows', color: DETECTION_COLORS.window, description: 'Orange' },
] as const;
