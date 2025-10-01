// client/src/lib/types.ts
export type XY = [number, number];

export interface BaseDetection {
  id: string;
  class: "room" | "door" | "window" | "wall" | "opening" | string;
  score?: number | null;
  // Polygon points in image pixels
  points: XY[];                  // used to draw masks
  // Center bbox [cx,cy,w,h] in pixels (if provided)
  bbox?: [number, number, number, number] | null;
  width_px?: number;
  height_px?: number;
  area_px2?: number;
  perimeter_px?: number;
  // UI-only fields
  name?: string;                 // editable (e.g., "Bedroom")
}

export interface OpeningDetection extends BaseDetection {
  class: "door" | "window" | "opening" | string;
  length_px?: number;            // longer side
  width_px?: number;             // shorter side
}

export interface RoomDetection extends BaseDetection {
  class: "room" | string;
}

export interface WallDetection extends BaseDetection {
  class: "wall" | string;
  length_px?: number;            // wall piece length approximation
}

export interface AnalyzeResponse {
  filename: string;
  openings: OpeningDetection[];
  rooms: RoomDetection[];
  walls: WallDetection[];
  errors: Record<string, string | null | undefined>;
  walls_summary?: {
    innerPerimeter_px: number;
    outerPerimeter_px: number;
  };
}
