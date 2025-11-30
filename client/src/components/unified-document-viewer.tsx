// client/src/components/unified-document-viewer.tsx — Unified viewer for images and PDFs

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft } from "lucide-react";
import EditableOverlay from "./EditableOverlay";
import { AnalysisLoading } from "@/components/analysis-loading";
import { useStore, type Detection as StoreDetection } from "@/store/useStore";
import { useDetectionsStore } from "@/store/useDetectionsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Drawing } from "@shared/schema";
import { smartSimplify } from "../utils/polygonUtils";

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

interface UnifiedDocumentViewerProps {
  drawing: Drawing | null;
  pdfPageData?: any; // PDF page data (for rendering PDF pages)
  highlightedElement?: string | null;
  activeViewMode?: 'view' | 'annotate';
  activeTool?: 'ruler' | 'area' | 'count' | null;
  selectedScale?: string;
  onElementClick?: (id: string) => void;
  onMeasurement?: (m: { type: string; value: string; coordinates: any }) => void;
  analysisResults?: AnalysisResults | null;
  isAnalyzing?: boolean;
  isCalibrating?: boolean;
  calibrationPoints?: { x: number; y: number }[];
  onCalibrationClick?: (x: number, y: number) => void;
  isPanMode?: boolean;
  hiddenElements?: Set<string>;
  measurementMode?: 'distance' | 'area' | null;
  onMeasurementClick?: (point: [number, number]) => void;
  onMeasurementComplete?: () => void;
  onMeasurementRightClick?: () => void;
  onBack?: () => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

export default function UnifiedDocumentViewer({
  drawing,
  pdfPageData,
  highlightedElement,
  activeViewMode = 'view',
  activeTool = null,
  selectedScale = "1/4\" = 1'",
  onElementClick,
  onMeasurement,
  analysisResults,
  isAnalyzing = false,
  isCalibrating = false,
  calibrationPoints = [],
  onCalibrationClick,
  isPanMode = false,
  hiddenElements = new Set(),
  measurementMode = null,
  onMeasurementClick,
  onMeasurementComplete,
  onMeasurementRightClick,
  onBack
}: UnifiedDocumentViewerProps) {
  const [viewState, setViewState] = useState({ scale: 1, offsetX: 50, offsetY: 50 });
  const [, setRenderTrigger] = useState(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Force re-render when analysisResults changes
  useEffect(() => {
    setRenderTrigger(prev => prev + 1);
  }, [analysisResults]);
  
  // Get grid settings
  const { showGrid, gridSize } = useSettingsStore();
  
  // Get all detections including manual rooms
  const allDetectionsFromStore = useDetectionsStore(state => state.detections);

  // Flatten all detections to render easily, filtering out hidden elements
  const detections: DetectionItem[] = useMemo(() => {
    if (!analysisResults?.predictions) return [];
    const allDetections = [
      ...(analysisResults.predictions.openings || []),
      ...(analysisResults.predictions.rooms || []),
      ...(analysisResults.predictions.walls || []),
    ];
    console.log(`[FloorPlan] Total detections: ${allDetections.length}, Hidden: ${hiddenElements.size}`);
    console.log(`[FloorPlan] All detection IDs:`, allDetections.map(d => `${d.id} (${d.class}) [type: ${typeof d.id}]`));
    console.log(`[FloorPlan] Hidden IDs:`, Array.from(hiddenElements));
    const visibleDetections = allDetections.filter(det => {
      // Ensure consistent string comparison
      const detId = String(det.id);
      const isHidden = hiddenElements.has(detId);
      if (isHidden) {
        console.log(`[FloorPlan] Hiding element ${detId} (${det.class})`);
      }
      return !isHidden;
    });
    console.log(`[FloorPlan] Visible detections: ${visibleDetections.length}`);
    console.log(`[FloorPlan] Visible IDs:`, visibleDetections.map(d => `${d.id} (${d.class})`));
    return visibleDetections;
  }, [analysisResults, hiddenElements]);

  // Force component to re-render when detections change
  useEffect(() => {
    console.log('[FloorPlan] Detections changed, triggering re-render:', detections.length);
  }, [detections.length]);

  // Convert API detections to store format for EditableOverlay
  const storeDetections: StoreDetection[] = useMemo(() => {
    console.log('[FloorPlan] storeDetections useMemo - detections.length:', detections.length);
    const result = detections.map(det => {
      // Convert mask points to Point[] format
      const rawPoints = det.mask.map(p => [p.x, p.y] as [number, number]);
      
      // Apply smart simplification to remove clustered and redundant points
      const simplifiedPoints = smartSimplify(rawPoints, {
        douglasPeuckerTolerance: 3,      // Remove points within 3px of the line
        clusterThreshold: 8,              // Merge points closer than 8px
        angleThreshold: 10,               // Remove points on lines (within 10 degrees)
        minPoints: 3                      // Keep at least 3 points for valid polygon
      });
      
      return {
        id: det.id,
        label: det.class || det.category,
        cls: det.class || det.category,
        name: det.name || det.class,
        points: simplifiedPoints,
        score: det.confidence
      };
    });
    console.log('[FloorPlan] storeDetections result:', result.length);
    return result;
  }, [detections]);

  // Sync detections to store when they change, preserving manual rooms
  const { setDetections: setStoreDetections, detections: currentStoreDetections } = useStore();
  useEffect(() => {
    // Only sync if we have analysis results (don't sync when viewing PDF pages)
    if (!analysisResults) {
      console.log('[FloorPlan] Skipping sync - no analysisResults (viewing PDF)');
      return;
    }
    
    console.log('[FloorPlan] Syncing detections to store:', storeDetections.length);
    
    // Preserve manual rooms (those with isManual flag) from current store
    const manualRooms = currentStoreDetections.filter((d: any) => d.isManual);
    
    // Combine AI detections with manual rooms
    const combinedDetections = [...storeDetections, ...manualRooms];
    
    // Always update, even if empty (but preserve manual rooms)
    setStoreDetections(combinedDetections);
    console.log('[FloorPlan] ✅ Store updated with', combinedDetections.length, 'detections');
  }, [storeDetections.length, analysisResults]); // Only depend on length to avoid infinite loops
  
  // Debug: Log when overlay should render
  useEffect(() => {
    console.log('[FloorPlan] Overlay render check:', {
      isCalibrating,
      detectionsLength: detections.length,
      measurementMode,
      shouldRender: !isCalibrating && (detections.length > 0 || measurementMode)
    });
  }, [isCalibrating, detections.length, measurementMode]);

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
    if (isCalibrating && onCalibrationClick) {
      const { x, y } = screenToImageCoords(e.clientX, e.clientY);
      onCalibrationClick(x, y);
    } else if (isPanMode || ((activeViewMode === 'view' || !activeTool) && !storeDetections.length)) {
      // Allow panning in pan mode or when no detections (EditableOverlay handles its own events)
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

  // Support both regular drawings and PDF pages
  const imageUrl = pdfPageData?.image_path || drawing?.file_url;
  const imageName = pdfPageData?.title || drawing?.name || 'Document';
  
  if (!imageUrl) return <div />;

  const imgW = analysisResults?.image?.width || 2000;
  const imgH = analysisResults?.image?.height || 1500;

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-card rounded-lg shadow-lg border border-border p-1 md:p-2 lg:p-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
        <Slider value={[viewState.scale]} onValueChange={handleSliderChange} min={MIN_SCALE} max={MAX_SCALE} step={0.01} className="w-24 md:w-32 lg:w-40" />
        <Button variant="ghost" size="sm" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
        <span className="text-sm text-muted-foreground px-2 min-w-[50px] text-center border-l border-border">{Math.round(viewState.scale * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleFitToScreen} className="border-l border-border"><Maximize2 className="w-4 h-4" /></Button>
      </div>

      <div
        ref={containerRef}
        className={`absolute inset-0 ${isCalibrating ? 'cursor-crosshair' : isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={isPanMode ? handleMouseDown : undefined}
        onMouseMove={isPanMode ? handleMouseMove : undefined}
        onMouseUp={isPanMode ? handleMouseUp : undefined}
        onMouseLeave={isPanMode ? handleMouseUp : undefined}
        style={{ overflow: 'hidden', pointerEvents: isPanMode ? 'auto' : 'none' }}
      >
        {/* Background image layer */}
        <div
          className="bg-white absolute pointer-events-none"
          style={{ 
            top: 0,
            left: 0,
            width: `${imgW}px`, 
            height: `${imgH}px`, 
            transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`, 
            transformOrigin: "top left",
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            imageRendering: 'crisp-edges',
            zIndex: 0,
          }}
        >
          <img 
            src={imageUrl} 
            alt={imageName} 
            className="w-full h-full object-contain"
            style={{ 
              display: 'block',
              imageRendering: 'crisp-edges',
            }}
          />
        </div>

        {/* Grid Overlay */}
        {showGrid && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${imgW}px`,
              height: `${imgH}px`,
              transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
              transformOrigin: "top left",
              opacity: 0.3,
            }}
            viewBox={`0 0 ${imgW} ${imgH}`}
            preserveAspectRatio="none"
          >
            {/* Vertical grid lines */}
            {Array.from({ length: Math.ceil(imgW / gridSize) + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * gridSize}
                y1={0}
                x2={i * gridSize}
                y2={imgH}
                stroke="#3b82f6"
                strokeWidth={1 / viewState.scale}
              />
            ))}
            {/* Horizontal grid lines */}
            {Array.from({ length: Math.ceil(imgH / gridSize) + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * gridSize}
                x2={imgW}
                y2={i * gridSize}
                stroke="#3b82f6"
                strokeWidth={1 / viewState.scale}
              />
            ))}
          </svg>
        )}

        {/* EditableOverlay for interactive mask editing and measurements - positioned absolutely to match image */}
        {!isCalibrating && (detections.length > 0 || measurementMode) && (
          <div 
            className="absolute top-0 left-0"
            style={{ 
              transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
              transformOrigin: "top left",
              imageRendering: "crisp-edges",
              WebkitFontSmoothing: "antialiased",
              pointerEvents: 'none', // Let clicks pass through the wrapper
              zIndex: 1,
            }}
          >
            <EditableOverlay 
              width={imgW} 
              height={imgH} 
              scale={viewState.scale}
              measurementMode={measurementMode}
              onMeasurementClick={onMeasurementClick}
              onMeasurementComplete={onMeasurementComplete}
              onMeasurementRightClick={onMeasurementRightClick}
              hiddenElements={hiddenElements}
            />
          </div>
        )}

        {/* SVG overlay for calibration only */}
        {isCalibrating && (
          <svg 
            className="absolute top-0 left-0 pointer-events-none" 
            style={{ 
              width: `${imgW}px`, 
              height: `${imgH}px`,
              transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
              transformOrigin: "top left"
            }}
            viewBox={`0 0 ${imgW} ${imgH}`} 
            preserveAspectRatio="none"
          >
            {/* Calibration points and line */}
            {calibrationPoints.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r={8}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
              />
            ))}
            {calibrationPoints.length === 2 && (
              <line
                x1={calibrationPoints[0].x}
                y1={calibrationPoints[0].y}
                x2={calibrationPoints[1].x}
                y2={calibrationPoints[1].y}
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5,5"
              />
            )}
          </svg>
        )}
      </div>

      {/* Analysis Loader Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-50 rounded-lg">
          <AnalysisLoading stage="analyzing" />
        </div>
      )}
    </div>
  );
}