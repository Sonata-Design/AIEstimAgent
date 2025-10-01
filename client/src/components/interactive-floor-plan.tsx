// client/src/components/interactive-floor-plan.tsx — FULL UPDATED

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import type { Drawing } from "@shared/schema";

type MaskPoint = { x: number; y: number };

interface DetectionItem {
  id: string;
  category: "openings" | "rooms" | "walls" | string;
  class: string;
  confidence: number;
  metrics: {
    width_px?: number;
    height_px?: number;
    area_px2?: number;
    perimeter_px?: number;
  } & Record<string, number>;
  name?: string;
  display?: Record<string, number>;
  mask: MaskPoint[]; // normalized points
}

interface AnalysisResults {
  image?: { width: number; height: number };
  predictions?: {
    openings?: DetectionItem[];
    rooms?: DetectionItem[];
    walls?: DetectionItem[];
  } & Record<string, DetectionItem[] | undefined>;
  errors?: Record<string, string | null>;
}

interface InteractiveFloorPlanProps {
  drawing: Drawing | null;
  highlightedElement?: string | null;
  activeViewMode?: 'view' | 'annotate';
  activeTool?: 'ruler' | 'area' | 'count' | null;
  selectedScale?: string;
  onElementClick?: (id: string) => void;
  onMeasurement?: (m: { type: string; value: string; coordinates: any }) => void;
  analysisResults?: AnalysisResults | null; // ⬅ NEW
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

export default function InteractiveFloorPlan({
  drawing,
  highlightedElement,
  activeViewMode = 'view',
  activeTool = null,
  selectedScale = "1/4\" = 1'",
  onElementClick,
  onMeasurement,
  analysisResults
}: InteractiveFloorPlanProps) {
  const [viewState, setViewState] = useState({ scale: 1, offsetX: 50, offsetY: 50 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all detections to render easily
  const detections: DetectionItem[] = useMemo(() => {
    if (!analysisResults?.predictions) return [];
    return [
      ...(analysisResults.predictions.openings || []),
      ...(analysisResults.predictions.rooms || []),
      ...(analysisResults.predictions.walls || []),
    ];
  }, [analysisResults]);

  const screenToImageCoords = useCallback((sx: number, sy: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (sx - rect.left - viewState.offsetX) / viewState.scale;
    const y = (sy - rect.top - viewState.offsetY) / viewState.scale;
    return { x, y };
  }, [viewState]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (activeViewMode !== 'view' && activeTool) return;
      const { clientX, clientY, deltaY } = e;
      const dir = deltaY > 0 ? -1 : 1;
      const { x: imgX, y: imgY } = screenToImageCoords(clientX, clientY);
      setViewState(prev => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + dir * 0.1 * prev.scale));
        const newOffsetX = prev.offsetX + (imgX * prev.scale - imgX * newScale);
        const newOffsetY = prev.offsetY + (imgY * prev.scale - imgY * newScale);
        return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [activeViewMode, activeTool, screenToImageCoords]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeViewMode === 'view' || !activeTool) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - viewState.offsetX, y: e.clientY - viewState.offsetY };
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      setViewState(prev => ({ ...prev, offsetX: e.clientX - panStartRef.current.x, offsetY: e.clientY - panStartRef.current.y }));
    }
  };
  const handleMouseUp = () => (isPanningRef.current = false);

  const handleZoomIn = () => setViewState(p => ({ ...p, scale: Math.min(p.scale * 1.25, MAX_SCALE) }));
  const handleZoomOut = () => setViewState(p => ({ ...p, scale: Math.max(p.scale / 1.25, MIN_SCALE) }));
  const handleFitToScreen = () => setViewState({ scale: 1, offsetX: 50, offsetY: 50 });
  const handleSliderChange = (v: number[]) => setViewState(p => ({ ...p, scale: v[0] }));

  // helper to build an SVG path from normalized mask
  const maskPath = (mask: MaskPoint[], imgW: number, imgH: number) => {
    if (!mask?.length) return "";
    const pts = mask.map(p => `${p.x * imgW},${p.y * imgH}`).join(" L ");
    return `M ${pts} Z`;
  };

  if (!drawing) return <div />;

  const imgW = analysisResults?.image?.width || 2000;
  const imgH = analysisResults?.image?.height || 1500;

  return (
    <div className="flex-1 bg-slate-100 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1">
        <Button variant="ghost" size="sm" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
        <Slider value={[viewState.scale]} onValueChange={handleSliderChange} min={MIN_SCALE} max={MAX_SCALE} step={0.01} className="w-24" />
        <Button variant="ghost" size="sm" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
        <span className="text-sm text-slate-600 px-2 min-w-[50px] text-center border-l">{Math.round(viewState.scale * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleFitToScreen} className="border-l"><Maximize className="w-4 h-4" /></Button>
      </div>

      <div
        ref={containerRef}
        className={`absolute inset-0 ${activeViewMode === 'view' || !activeTool ? 'cursor-grab' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        <div
          className="bg-white border-2 border-slate-300 relative"
          style={{ width: `${imgW}px`, height: `${imgH}px`, transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`, transformOrigin: "top left" }}
        >
          {drawing.fileUrl ? (
            <img src={drawing.fileUrl} alt={drawing.name} className="w-full h-full object-contain pointer-events-none" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-100"><span className="text-gray-500">No floor plan image available</span></div>
          )}

          {/* SVG overlay for masks */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${imgW} ${imgH}`} preserveAspectRatio="none">
            {detections.map(det => {
              const color =
                det.category === "rooms" ? "rgba(34,197,94,0.28)" :
                det.category === "openings" ? "rgba(59,130,246,0.32)" :
                det.category === "walls" ? "rgba(234,179,8,0.28)" : "rgba(107,114,128,0.28)";
              return (
                <path key={det.id} d={maskPath(det.mask, imgW, imgH)} style={{ fill: color, stroke: "rgba(0,0,0,0.35)", strokeWidth: 1 }} />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
