// client/src/components/realtime-analysis-panel.tsx — FULL UPDATED

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle } from "lucide-react";
import type { Drawing } from "@shared/schema";

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

  const cats = useMemo(() => {
    const p = analysisResults?.predictions || {};
    return {
      openings: p.openings || [],
      rooms: p.rooms || [],
      walls: p.walls || [],
    };
  }, [analysisResults]);

  const totals = useMemo(() => {
    const openCount = cats.openings.length;
    const roomArea = cats.rooms.reduce((s, r) => s + (r.display?.area || 0), 0);
    const roomPerim = cats.rooms.reduce((s, r) => s + (r.display?.perimeter || 0), 0);
    const innerWall = cats.walls.reduce((s, w) => s + (w.display?.inner_perimeter || 0), 0);
    const outerWall = cats.walls.reduce((s, w) => s + (w.display?.outer_perimeter || 0), 0);
    return { openCount, roomArea, roomPerim, innerWall, outerWall };
  }, [cats]);

  const editedName = (id: string, fallback: string) => roomEdits[id] ?? fallback;

  return (
    <div className="h-full overflow-auto bg-white border-l border-slate-200">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Real-time Analysis</div>
            <div className="text-[13px] text-slate-500">
              {drawing?.name ?? "No drawing"} {isAnalyzing && <Badge className="ml-2" variant="secondary">Running…</Badge>}
            </div>
          </div>
          <Button size="sm" onClick={onStartAnalysis} disabled={!drawing || isAnalyzing}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            Run AI Analysis
          </Button>
        </div>

        {/* quick totals */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <Card className="p-3">
            <div className="text-slate-500">Doors & Windows</div>
            <div className="text-lg font-semibold">{totals.openCount}</div>
          </Card>
          <Card className="p-3">
            <div className="text-slate-500">Rooms Area (px²)</div>
            <div className="text-lg font-semibold">{number(totals.roomArea)}</div>
          </Card>
          <Card className="p-3">
            <div className="text-slate-500">Rooms Perimeter (px)</div>
            <div className="text-lg font-semibold">{number(totals.roomPerim)}</div>
          </Card>
          <Card className="p-3">
            <div className="text-slate-500">Walls Perimeter (in/out px)</div>
            <div className="text-lg font-semibold">{number(totals.innerWall)} / {number(totals.outerWall)}</div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="rooms">Rooms & Flooring</TabsTrigger>
          <TabsTrigger value="openings">Doors & Windows</TabsTrigger>
          <TabsTrigger value="walls">Walls</TabsTrigger>
        </TabsList>

        {/* Rooms */}
        <TabsContent value="rooms" className="p-3">
          {cats.rooms.length === 0 ? (
            <div className="text-xs text-slate-500">No rooms detected.</div>
          ) : (
            <div className="space-y-2">
              {cats.rooms.map(r => (
                <Card key={r.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      className="h-8"
                      value={editedName(r.id, r.name ?? r.class ?? "Room")}
                      onChange={(e) => setRoomEdits(s => ({ ...s, [r.id]: e.target.value }))}
                    />
                    <Badge variant="outline">{Math.round((r.confidence ?? 0) * 100)}%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>Area: <span className="font-medium">{number(r.display?.area)}</span> px²</div>
                    <div>Perimeter: <span className="font-medium">{number(r.display?.perimeter)}</span> px</div>
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
            <div className="text-xs text-slate-500">No doors/windows detected.</div>
          ) : (
            <div className="space-y-2">
              {cats.openings.map(o => (
                <Card key={o.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{o.class}</div>
                    <Badge variant="outline">{Math.round((o.confidence ?? 0) * 100)}%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>Width: <span className="font-medium">{number(o.display?.width)}</span> px</div>
                    <div>Height: <span className="font-medium">{number(o.display?.height)}</span> px</div>
                    <div>Id: <span className="font-mono">{o.id}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Walls */}
        <TabsContent value="walls" className="p-3">
          {cats.walls.length === 0 ? (
            <div className="text-xs text-slate-500">No walls detected.</div>
          ) : (
            <div className="space-y-2">
              {cats.walls.map(w => (
                <Card key={w.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{w.class}</div>
                    <Badge variant="outline">{Math.round((w.confidence ?? 0) * 100)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>Inner Perimeter: <span className="font-medium">{number(w.display?.inner_perimeter)}</span> px</div>
                    <div>Outer Perimeter: <span className="font-medium">{number(w.display?.outer_perimeter)}</span> px</div>
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
