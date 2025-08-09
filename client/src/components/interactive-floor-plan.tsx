import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  CheckCircle,
  Loader2
} from "lucide-react";
import type { Drawing } from "@shared/schema";

interface FloorPlanElement {
  id: string;
  type: string;
  coordinates: { x: number; y: number; width: number; height: number };
  highlighted: boolean;
}

interface InteractiveFloorPlanProps {
  drawing: Drawing | null;
  highlightedElement?: string | null;
  onElementClick?: (elementId: string) => void;
}

export default function InteractiveFloorPlan({ 
  drawing, 
  highlightedElement, 
  onElementClick 
}: InteractiveFloorPlanProps) {
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mock floor plan elements - in real implementation, these would come from AI analysis
  const [floorPlanElements, setFloorPlanElements] = useState<FloorPlanElement[]>([
    { id: 'door-1', type: 'doors', coordinates: { x: 150, y: 200, width: 40, height: 8 }, highlighted: false },
    { id: 'door-2', type: 'doors', coordinates: { x: 300, y: 150, width: 8, height: 40 }, highlighted: false },
    { id: 'door-3', type: 'doors', coordinates: { x: 450, y: 300, width: 40, height: 8 }, highlighted: false },
    { id: 'window-1', type: 'windows', coordinates: { x: 100, y: 50, width: 80, height: 8 }, highlighted: false },
    { id: 'window-2', type: 'windows', coordinates: { x: 400, y: 50, width: 60, height: 8 }, highlighted: false },
    { id: 'window-3', type: 'windows', coordinates: { x: 500, y: 200, width: 8, height: 80 }, highlighted: false },
    { id: 'electrical-1', type: 'electrical', coordinates: { x: 200, y: 250, width: 12, height: 12 }, highlighted: false },
    { id: 'electrical-2', type: 'electrical', coordinates: { x: 350, y: 280, width: 12, height: 12 }, highlighted: false },
    { id: 'electrical-3', type: 'electrical', coordinates: { x: 180, y: 180, width: 12, height: 12 }, highlighted: false },
  ]);

  // Update highlighted elements when prop changes
  useEffect(() => {
    setFloorPlanElements(prev => 
      prev.map(element => ({
        ...element,
        highlighted: highlightedElement === element.type
      }))
    );
  }, [highlightedElement]);

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
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getElementColor = (type: string, highlighted: boolean) => {
    const colors = {
      doors: highlighted ? '#ef4444' : '#dc2626',
      windows: highlighted ? '#3b82f6' : '#2563eb',
      electrical: highlighted ? '#eab308' : '#ca8a04',
      flooring: highlighted ? '#22c55e' : '#16a34a',
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const getElementOpacity = (highlighted: boolean, hasHighlight: boolean) => {
    if (!hasHighlight) return 0.8;
    return highlighted ? 1.0 : 0.3;
  };

  if (!drawing) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Maximize className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">Upload a drawing to view interactive floor plan</p>
        </div>
      </div>
    );
  }

  const isProcessing = drawing.status === "processing";
  const isComplete = drawing.status === "complete" && drawing.aiProcessed;

  return (
    <div className="flex-1 bg-slate-100 relative overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1">
        <Button variant="ghost" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-slate-600 px-2 min-w-[60px] text-center">
          {zoom}%
        </span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleFitToScreen}>
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2">
        {isProcessing && (
          <>
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-slate-700">Processing...</span>
          </>
        )}
        {isComplete && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-slate-700">Analysis Complete</span>
          </>
        )}
      </div>

      {/* Element Legend */}
      {isComplete && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <h3 className="text-sm font-medium text-slate-900 mb-2">Detected Elements</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-red-600 border-red-200">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
              Doors
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
              Windows
            </Badge>
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></div>
              Electrical
            </Badge>
          </div>
        </div>
      )}

      {/* Drawing Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Mock Floor Plan Background */}
        <div
          className="bg-white border-2 border-slate-300 relative transition-transform duration-200"
          style={{
            width: '600px',
            height: '400px',
            transform: `translate(${50 + offset.x}px, ${50 + offset.y}px) scale(${zoom / 100})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Mock Room Outlines */}
          <div className="absolute inset-4 border-2 border-slate-400">
            <div className="absolute top-0 left-1/3 w-px h-full bg-slate-300"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300"></div>
          </div>

          {/* Room Labels */}
          <div className="absolute top-8 left-8 text-xs text-slate-500 font-medium">Living Room</div>
          <div className="absolute top-8 right-8 text-xs text-slate-500 font-medium">Kitchen</div>
          <div className="absolute bottom-8 left-8 text-xs text-slate-500 font-medium">Bedroom</div>
          <div className="absolute bottom-8 right-8 text-xs text-slate-500 font-medium">Bathroom</div>

          {/* Interactive Elements */}
          {isComplete && floorPlanElements.map((element) => (
            <div
              key={element.id}
              className={`absolute transition-all duration-300 cursor-pointer ${
                element.highlighted ? 'animate-pulse shadow-lg' : ''
              }`}
              style={{
                left: `${element.coordinates.x}px`,
                top: `${element.coordinates.y}px`,
                width: `${element.coordinates.width}px`,
                height: `${element.coordinates.height}px`,
                backgroundColor: getElementColor(element.type, element.highlighted),
                opacity: getElementOpacity(element.highlighted, !!highlightedElement),
                transform: element.highlighted ? 'scale(1.2)' : 'scale(1)',
                zIndex: element.highlighted ? 10 : 5,
              }}
              onClick={() => onElementClick?.(element.id)}
              title={`${element.type} - ${element.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}