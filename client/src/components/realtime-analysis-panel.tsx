// client/src/components/realtime-analysis-panel.tsx — FULL UPDATED

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, Trash2, Check, X } from "lucide-react";
import type { Drawing } from "@shared/schema";
import { useStore } from "@/store/useStore";
import { useDetectionsStore } from "@/store/useDetectionsStore";
import { recalculateDimensions } from "@/utils/dimensionCalculator";
import { toPairs } from "@/utils/geometry";
import { DETECTION_COLORS, getDetectionColor } from "@/config/colors";
import { useUnits } from "@/hooks/useUnits";
import { useToast } from "@/hooks/use-toast";

type MaskPoint = { x: number; y: number };
interface DetectionItem {
  id: string;
  category: "openings" | "rooms" | "walls" | string;
  class: string;
  confidence: number;
  metrics: Record<string, number>;
  name?: string;
  display?: Record<string, number>;
  mask: MaskPoint[];
}

interface Props {
  drawing: Drawing | null;
  selectedTypes: string[];
  isAnalyzing: boolean;
  onStartAnalysis: () => void;
  onElementHover?: (k: string | null) => void;
  analysisResults?: {
    predictions?: {
      openings?: DetectionItem[];
      rooms?: DetectionItem[];
      walls?: DetectionItem[];
      [k: string]: DetectionItem[] | undefined;
    };
    errors?: Record<string, string | null>;
  } | null;
}

function number(n?: number, digits = 0) {
  if (n === undefined || n === null) return "—";
  const f = digits > 0 ? n : Math.round(n);
  return digits > 0 ? f.toFixed(digits) : String(f);
}

export default function RealtimeAnalysisPanel({
  drawing,
  selectedTypes,
  isAnalyzing,
  onStartAnalysis,
  onElementHover,
  analysisResults
}: Props) {
  const [roomEdits, setRoomEdits] = useState<Record<string, string>>({});
  const [showColorLegend, setShowColorLegend] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { setHoveredDetectionId, removeDetection: removeFromStore, updateDetection } = useStore();
  const { detections: allDetections, setDetections: setAllDetections } = useDetectionsStore();
  const storeDetections = useStore(s => s.detections);
  const { formatArea, formatDistance, getAreaUnit, getDistanceUnit } = useUnits();
  const { toast } = useToast();
  
  // Get pixels per foot for dimension calculation (assuming 1/4" = 1' scale)
  const pixelsPerFoot = 48; // TODO: Get this from actual scale setting
  
  // Handle delete from panel with toast feedback
  const handleDelete = (id: string) => {
    const detection = allDetections.find(d => d.id === id);
    const name = detection?.name || detection?.cls || "Element";
    
    // Remove from both stores
    removeFromStore(id);
    setAllDetections(allDetections.filter(d => d.id !== id));
    
    toast({
      title: "Element deleted",
      description: `${name} has been removed`,
      duration: 3000,
    });
  };
  
  // Handle rename with toast feedback
  const handleRename = (id: string, newName: string) => {
    // Update in store
    updateDetection(id, { name: newName });
    // Update in detections store
    setAllDetections(allDetections.map(d => 
      d.id === id ? { ...d, name: newName } : d
    ));
    setEditingId(null);
    
    toast({
      title: "Renamed",
      description: `Element renamed to "${newName}"`,
      duration: 2000,
    });
  };

  const cats = useMemo(() => {
    const p = analysisResults?.predictions || {};
    
    // Merge with live store detections to get real-time dimensions
    const mergeWithLiveData = (items: any[], category: string) => {
      return items.map(item => {
        const storeDetection = storeDetections.find(sd => sd.id === item.id);
        if (storeDetection) {
          const points = toPairs(storeDetection.points);
          const liveDimensions = recalculateDimensions(points, pixelsPerFoot, category);
          return {
            ...item,
            display: {
              ...item.display,
              ...liveDimensions
            }
          };
        }
        return item;
      });
    };
    
    return {
      openings: mergeWithLiveData(p.openings || [], 'openings'),
      rooms: mergeWithLiveData(p.rooms || [], 'rooms'),
      walls: mergeWithLiveData(p.walls || [], 'walls'),
    };
  }, [analysisResults, storeDetections, pixelsPerFoot]);

  const totals = useMemo(() => {
    const openCount = cats.openings.length;
    const roomArea = cats.rooms.reduce((s, r) => s + (r.display?.area_sqft || 0), 0);
    const roomPerim = cats.rooms.reduce((s, r) => s + (r.display?.perimeter_ft || 0), 0);
    const wallCount = cats.walls.length;
    const wallLength = cats.walls.reduce((s, w) => s + (w.display?.perimeter_ft || 0), 0);
    return { openCount, roomArea, roomPerim, wallCount, wallLength };
  }, [cats]);

  const editedName = (id: string, fallback: string) => roomEdits[id] ?? fallback;

  return (
    <div className="h-full overflow-auto bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Analysis Results</h3>
            {isAnalyzing && <Badge variant="secondary" className="text-xs">Analyzing...</Badge>}
          </div>
          <Button size="sm" onClick={onStartAnalysis} disabled={!drawing || isAnalyzing}>
            {isAnalyzing ? 'Running...' : 'Run Analysis'}
          </Button>
        </div>
        {drawing && (
          <div className="text-xs text-muted-foreground">
            {drawing.name}
          </div>
        )}

        {/* Color Legend */}
        {showColorLegend && (cats.rooms.length > 0 || cats.walls.length > 0 || cats.openings.length > 0) && (
          <div className="mt-3 p-2 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Color Legend</span>
              <button 
                onClick={() => setShowColorLegend(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DETECTION_COLORS.room }} />
                <span className="text-xs text-foreground">Rooms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DETECTION_COLORS.wall }} />
                <span className="text-xs text-foreground">Walls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DETECTION_COLORS.door }} />
                <span className="text-xs text-foreground">Doors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DETECTION_COLORS.window }} />
                <span className="text-xs text-foreground">Windows</span>
              </div>
            </div>
          </div>
        )}

        {/* quick totals */}
        <div className="space-y-3 mt-4">
          {/* Openings Card */}
          <Card className="p-3 bg-card border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Openings</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Doors</div>
                <div className="text-2xl font-bold text-foreground">
                  {cats.openings.filter(o => o.class.toLowerCase().includes('door')).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Windows</div>
                <div className="text-2xl font-bold text-foreground">
                  {cats.openings.filter(o => o.class.toLowerCase().includes('window')).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-foreground">
                  {cats.openings.length}
                </div>
              </div>
            </div>
          </Card>

          {/* Rooms Card */}
          <Card className="p-3 bg-card border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Rooms & Flooring</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Total Area</div>
                <div className="text-2xl font-bold text-foreground">{formatArea(totals.roomArea || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Perimeter</div>
                <div className="text-2xl font-bold text-foreground">{number(totals.roomPerim, 1)}</div>
                <div className="text-xs text-muted-foreground">ft</div>
              </div>
            </div>
          </Card>

          {/* Walls Card */}
          <Card className="p-3 bg-card border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Walls</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Segments</div>
                <div className="text-2xl font-bold text-foreground">{totals.wallCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Length</div>
                <div className="text-2xl font-bold text-foreground">{number(totals.wallLength, 1)}</div>
                <div className="text-xs text-muted-foreground">LF</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <div className="border-b border-border px-4">
          <TabsList className="w-full bg-transparent h-auto p-0 gap-1">
            <TabsTrigger 
              value="rooms" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs font-medium"
            >
              Rooms
            </TabsTrigger>
            <TabsTrigger 
              value="openings" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs font-medium"
            >
              Openings
            </TabsTrigger>
            <TabsTrigger 
              value="walls" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs font-medium"
            >
              Walls
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Rooms */}
        <TabsContent value="rooms" className="p-3">
          {cats.rooms.length === 0 ? (
            <div className="text-xs text-muted-foreground">No rooms detected.</div>
          ) : (
            <div className="space-y-2">
              {cats.rooms.map(r => (
                <Card 
                  key={r.id} 
                  className="p-3 hover:bg-accent/50 bg-card border-l-4 transition-all group"
                  style={{ borderLeftColor: getDetectionColor(r.class) }}
                  onMouseEnter={() => setHoveredDetectionId(r.id)}
                  onMouseLeave={() => setHoveredDetectionId(null)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: getDetectionColor(r.class) }}
                      />
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            className="h-8 flex-1"
                            value={roomEdits[r.id] ?? r.name ?? r.class ?? "Room"}
                            onChange={(e) => setRoomEdits(s => ({ ...s, [r.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(r.id, roomEdits[r.id] ?? r.name ?? r.class);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(r.id, roomEdits[r.id] ?? r.name ?? r.class)}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex-1 text-sm font-medium cursor-pointer hover:text-primary"
                          onClick={() => {
                            setEditingId(r.id);
                            setRoomEdits(s => ({ ...s, [r.id]: r.name ?? r.class ?? "Room" }));
                          }}
                        >
                          {r.name ?? r.class ?? "Room"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{Math.round((r.confidence ?? 0) * 100)}%</Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>Area: <span className="font-medium">{formatArea(r.display?.area_sqft || 0)}</span></div>
                    <div>Perimeter: <span className="font-medium">{formatDistance(r.display?.perimeter_ft || 0)}</span></div>
                    <div>Class: <span className="font-medium">{r.class}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Openings */}
        <TabsContent value="openings" className="p-3">
          {cats.openings.length === 0 ? (
            <div className="text-xs text-muted-foreground">No doors/windows detected.</div>
          ) : (
            <>
              {/* Group by type */}
              {['door', 'window'].map(type => {
                const items = cats.openings.filter(o => o.class.toLowerCase().includes(type));
                if (items.length === 0) return null;
                
                return (
                  <div key={type} className="mb-4">
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span>{type}s ({items.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((o, idx) => (
                        <div 
                          key={o.id} 
                          className="p-2 rounded hover:bg-accent/50 border-l-4 border-r border-t border-b bg-card transition-all group"
                          style={{ borderLeftColor: getDetectionColor(o.class) }}
                          onMouseEnter={() => setHoveredDetectionId(o.id)}
                          onMouseLeave={() => setHoveredDetectionId(null)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: getDetectionColor(o.class) }}
                              >
                                {idx + 1}
                              </div>
                              <span className="text-sm text-foreground capitalize">{o.class}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {Math.round((o.confidence ?? 0) * 100)}%
                              </Badge>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(o.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs ml-8">
                            <div>
                              <span className="text-muted-foreground">W: </span>
                              <span className="font-medium text-foreground">{number(o.display?.width_ft, 1)} ft</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">H: </span>
                              <span className="font-medium text-foreground">{number(o.display?.height_ft, 1)} ft</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="text-xs text-foreground">
                  <span className="font-medium">Note:</span> Opening dimensions should be verified against blueprint annotations or specifications.
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Walls */}
        <TabsContent value="walls" className="p-3">
          {cats.walls.length === 0 ? (
            <div className="text-xs text-muted-foreground">No walls detected.</div>
          ) : (
            <div className="space-y-2">
              {cats.walls.map(w => (
                <Card 
                  key={w.id} 
                  className="p-3 hover:bg-accent/50 bg-card border-l-4 transition-all group"
                  style={{ borderLeftColor: getDetectionColor(w.class) }}
                  onMouseEnter={() => setHoveredDetectionId(w.id)}
                  onMouseLeave={() => setHoveredDetectionId(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: getDetectionColor(w.class) }}
                      />
                      <div className="text-sm font-medium">{w.class}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{Math.round((w.confidence ?? 0) * 100)}%</Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(w.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>Length: <span className="font-medium">{number(w.display?.perimeter_ft, 1)}</span> LF</div>
                    <div>Area: <span className="font-medium">{number(w.display?.area_sqft, 1)}</span> SF</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!!analysisResults?.errors && (
        <div className="p-3 border-t">
          <div className="text-xs font-medium mb-1">Model Errors</div>
          <ul className="text-xs list-disc ml-4">
            {Object.entries(analysisResults.errors).map(([k, v]) => v ? <li key={k}><span className="font-semibold">{k}:</span> {String(v)}</li> : null)}
          </ul>
        </div>
      )}
    </div>
  );
}
