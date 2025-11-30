import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FileUploadDialog from "@/components/file-upload-dialog";
import EditableOverlay from "@/components/EditableOverlay";
import { AnalysisLoading } from "@/components/analysis-loading";
import { useStore, type Detection as StoreDetection } from "@/store/useStore";
import { smartSimplify } from "@/utils/polygonUtils";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  CheckCircle,
  Loader2
} from "lucide-react";
import type { Drawing } from "@shared/schema";

interface DrawingViewerProps {
  drawing: Drawing | null;
  onFileUpload?: (file: File) => Promise<void> | void;
  isUploading?: boolean;
  pdfPageData?: any;
  onPDFPageSelected?: (pageData: any) => void;
  analysisResults?: any;
  isAnalyzing?: boolean;
  measurementMode?: 'distance' | 'area' | null;
  onMeasurementClick?: (point: [number, number]) => void;
  onMeasurementComplete?: () => void;
  onMeasurementRightClick?: () => void;
  isPanMode?: boolean;
  hiddenElements?: Set<string>;
}

export default function DrawingViewer({ 
  drawing, 
  onFileUpload, 
  isUploading, 
  pdfPageData, 
  onPDFPageSelected, 
  analysisResults, 
  isAnalyzing,
  measurementMode = null,
  onMeasurementClick,
  onMeasurementComplete,
  onMeasurementRightClick,
  isPanMode = false,
  hiddenElements = new Set()
}: DrawingViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Use dimensions from analysis results if available, otherwise use natural image dimensions
  const imageDimensions = {
    width: analysisResults?.image?.width || 800,
    height: analysisResults?.image?.height || 600,
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get store methods for syncing detections
  const { setDetections: setStoreDetections } = useStore();

  // Convert analysis results to store format for display
  const storeDetections: StoreDetection[] = useMemo(() => {
    if (!analysisResults?.predictions) {
      console.log('[DrawingViewer] No predictions in analysisResults');
      return [];
    }
    
    const allDetections = [
      ...(analysisResults.predictions.openings || []),
      ...(analysisResults.predictions.rooms || []),
      ...(analysisResults.predictions.walls || []),
    ];
    
    console.log('[DrawingViewer] Converting detections:', allDetections.length);
    console.log('[DrawingViewer] Analysis results:', analysisResults);
    
    return allDetections.map(det => {
      if (!det.mask || !Array.isArray(det.mask)) {
        console.warn('[DrawingViewer] Detection missing mask:', det);
        return null;
      }
      
      const rawPoints = det.mask.map((p: any) => [p.x, p.y] as [number, number]);
      const simplifiedPoints = smartSimplify(rawPoints, {
        douglasPeuckerTolerance: 3,
        clusterThreshold: 8,
        angleThreshold: 10,
        minPoints: 3
      });
      
      return {
        id: det.id,
        label: det.class || det.category,
        cls: det.class || det.category,
        name: det.name || det.class || 'Unknown',
        points: simplifiedPoints,
        score: det.confidence
      } as StoreDetection;
    }).filter((det): det is StoreDetection => det !== null);
  }, [analysisResults]);

  // Sync detections to store when analysis results change
  useEffect(() => {
    console.log('[DrawingViewer] Sync effect triggered');
    console.log('[DrawingViewer] storeDetections.length:', storeDetections.length);
    console.log('[DrawingViewer] analysisResults:', !!analysisResults);
    
    if (storeDetections.length > 0) {
      console.log('[DrawingViewer] ✅ Calling setStoreDetections with', storeDetections.length, 'detections');
      setStoreDetections(storeDetections);
    } else if (!analysisResults) {
      // Clear store when no analysis results
      console.log('[DrawingViewer] Clearing store - no analysis results');
      setStoreDetections([]);
    }
  }, [storeDetections, setStoreDetections, analysisResults]);

  // Force re-render when analysis results change
  const [renderTrigger, setRenderTrigger] = useState(0);
  useEffect(() => {
    if (analysisResults) {
      console.log('[DrawingViewer] Analysis results changed, triggering re-render');
      // Reset zoom and offset when switching pages
      setZoom(100);
      setOffset({ x: 0, y: 0 });
      setRenderTrigger(prev => prev + 1);
    }
  }, [analysisResults]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleFitToScreen = () => {
    setZoom(100);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      offsetRef.current = offset;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanMode && isDragging) {
      const delta = { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y };
      offsetRef.current = { x: offsetRef.current.x + delta.x, y: offsetRef.current.y + delta.y };
      setOffset(offsetRef.current);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    if (isPanMode) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setZoom(prev => Math.max(25, Math.min(400, prev - e.deltaY * 0.05)));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, offset]);

  // Show upload dialog only if there's no drawing AND no PDF page data
  if (!drawing && !pdfPageData) {
    return <FileUploadDialog onFileUpload={onFileUpload || (async () => {})} isUploading={isUploading} onPDFPageSelected={onPDFPageSelected} />;
  }

  // Handle PDF page data
  if (pdfPageData && !drawing) {
    return (
      <div className="flex-1 bg-muted/30 relative overflow-hidden">
        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-card rounded-lg shadow-lg border border-border p-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2 min-w-[60px] text-center">
            {Math.round(zoom)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleFitToScreen}>
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Drawing Container */}
        <div 
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center p-8 relative ${
            isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onMouseDown={isPanMode ? handleMouseDown : undefined}
          onMouseMove={isPanMode ? handleMouseMove : undefined}
          onMouseUp={isPanMode ? handleMouseUp : undefined}
          onMouseLeave={isPanMode ? handleMouseUp : undefined}
        >
          {/* Background image layer - same as InteractiveFloorPlan */}
          <div
            className="bg-white absolute pointer-events-none"
            style={{ 
              top: 0,
              left: 0,
              width: `${imageDimensions.width}px`, 
              height: `${imageDimensions.height}px`, 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100})`, 
              transformOrigin: "top left",
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              imageRendering: 'crisp-edges',
              zIndex: 0,
            }}
          >
            <img 
              ref={imageRef}
              src={pdfPageData.thumbnail || pdfPageData.image_path}
              alt={`Page ${pdfPageData.page_number}`}
              className="w-full h-full object-contain"
              style={{ 
                display: 'block',
                imageRendering: 'crisp-edges',
              }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('[DrawingViewer] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
              }}
              onError={(e) => {
                console.error('Failed to load PDF page:', pdfPageData.image_path);
              }}
            />
          </div>

          {/* EditableOverlay for masks - same transform as image */}
          {analysisResults && imageDimensions.width > 0 && (
            <div 
              className="absolute top-0 left-0"
              style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100})`,
                transformOrigin: "top left",
                imageRendering: "crisp-edges",
                WebkitFontSmoothing: "antialiased",
                pointerEvents: 'none',
                zIndex: 1,
              }}
              key={renderTrigger}
            >
              <EditableOverlay 
                width={imageDimensions.width} 
                height={imageDimensions.height} 
                scale={zoom / 100}
                measurementMode={measurementMode}
                onMeasurementClick={onMeasurementClick}
                onMeasurementComplete={onMeasurementComplete}
                onMeasurementRightClick={onMeasurementRightClick}
                hiddenElements={hiddenElements}
              />
            </div>
          )}

          {/* Analysis Loader Overlay - Only on Canvas */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background flex items-center justify-center z-50 rounded-lg">
              <AnalysisLoading stage="analyzing" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // At this point, drawing is guaranteed to exist (checked above)
  const drawingData = drawing!;
  const isProcessing = drawingData.status === "processing";
  const isComplete = drawingData.status === "complete" && drawingData.is_ai_processed;
  const isPdf = drawingData.file_url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-card rounded-lg shadow-lg border border-border p-1">
        <Button variant="ghost" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2 min-w-[60px] text-center">
          {zoom}%
        </span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleFitToScreen}>
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Status Indicator */}
      <div className="absolute top-4 right-4 z-10 bg-card rounded-lg shadow-lg p-3 border border-border">
        <div className="flex items-center space-x-2">
          {isProcessing ? (
            <>
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-sm font-medium text-foreground">AI Processing...</span>
            </>
          ) : isComplete ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-sm font-medium text-foreground">AI Analysis Complete</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-slate-400 rounded-full" />
              <span className="text-sm font-medium text-foreground">Ready for Analysis</span>
            </>
          )}
        </div>
        {isComplete && (
          <p className="text-xs text-muted-foreground mt-1">
            Detected: 8 doors, 12 windows, 6 rooms
          </p>
        )}
      </div>

      {/* Drawing Container */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center p-8 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Blueprint Image */}
        <div 
          className="relative bg-white shadow-lg rounded-lg overflow-hidden"
          style={{
            transform: `scale(${zoom / 100}) translate(${offset.x}px, ${offset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out', 
          }}
        >
          {/* Actual Blueprint Display */}
          {drawingData.file_url ? (
            <img 
              src={drawingData.file_url}
              title={drawingData.name}
              className="w-[800px] h-[600px] border-0"
              onError={() => {
                console.error('Failed to load PDF:', drawingData.file_url);
              }}
            />
          ) : (
            <img
              src={drawingData.file_url}
              alt={drawingData.name}
              className="max-w-[800px] max-h-[600px] object-contain"
              draggable={false}
              onError={(e) => {
                console.error('Failed to load drawing:', drawingData.file_url);
                // Fallback to a placeholder if image fails to load
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f8f9fa'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23666' font-family='Arial' font-size='16'%3EImage not found%3C/text%3E%3C/svg%3E";
              }}
            />
          )}
          
          {/* AI Detection Overlays */}
          {isComplete && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Door Detection Markers */}
              <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Door (36")
                </div>
              </div>
              <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Door (32")
                </div>
              </div>
              
              {/* Window Detection Markers */}
              <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Window (3'x4')
                </div>
              </div>
              <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse">
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Window (2'x3')
                </div>
              </div>
              
              {/* Area Highlights */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-24 border-2 border-amber-400 bg-amber-100 bg-opacity-30 rounded cursor-pointer hover:bg-opacity-50">
                <div className="absolute -top-6 left-0 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                  Living Room: 245 sq ft
                </div>
              </div>

              {/* Electrical Elements */}
              <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-yellow-500 border border-white rounded-full shadow">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-1 py-0.5 rounded">
                  Outlet
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-card rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-border">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Processing Drawing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI is analyzing your blueprint for doors, windows, and measurements...
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blueprint-600 h-2 rounded-full transition-all duration-300 w-2/3"></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">This usually takes 30-60 seconds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}