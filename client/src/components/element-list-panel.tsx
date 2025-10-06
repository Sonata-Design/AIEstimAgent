import { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronRight, Trash2, Edit, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Element {
  id: string;
  type: string;
  name: string;
  area?: number;
  perimeter?: number;
  count?: number;
  unit: string;
  color?: string;
  visible?: boolean;
}

interface ElementGroup {
  type: string;
  label: string;
  icon: string;
  color: string;
  elements: Element[];
  totalArea?: number;
  totalPerimeter?: number;
  totalCount?: number;
}

interface ElementListPanelProps {
  analysisResults?: any;
  onElementVisibilityToggle?: (elementId: string, visible: boolean) => void;
  onElementSelect?: (elementId: string) => void;
  onElementDelete?: (elementId: string) => void;
  selectedElementId?: string | null;
  hiddenElements?: Set<string>;
}

export function ElementListPanel({
  analysisResults,
  onElementVisibilityToggle,
  onElementSelect,
  onElementDelete,
  selectedElementId,
  hiddenElements = new Set()
}: ElementListPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['rooms', 'walls', 'openings']));

  // Parse analysis results into grouped elements
  const elementGroups: ElementGroup[] = [];

  if (analysisResults?.predictions) {
    // Rooms/Flooring
    if (analysisResults.predictions.rooms?.length > 0) {
      const rooms = analysisResults.predictions.rooms.map((room: any) => ({
        id: room.id,
        type: 'room',
        name: room.class || 'Room',
        area: room.display?.area_sqft || 0,
        perimeter: room.display?.perimeter_ft || 0,
        unit: 'sq ft',
        color: '#f59e0b',
        visible: !hiddenElements.has(room.id)
      }));

      elementGroups.push({
        type: 'rooms',
        label: 'Flooring',
        icon: '🏠',
        color: 'bg-amber-100 text-amber-700 border-amber-300',
        elements: rooms,
        totalArea: rooms.reduce((sum: number, r: Element) => sum + (r.area || 0), 0),
        totalCount: rooms.length
      });
    }

    // Walls
    if (analysisResults.predictions.walls?.length > 0) {
      const walls = analysisResults.predictions.walls.map((wall: any) => ({
        id: wall.id,
        type: 'wall',
        name: wall.class || 'Wall',
        perimeter: wall.display?.perimeter_ft || 0,
        area: wall.display?.area_sqft || 0,
        unit: 'LF',
        color: '#64748b',
        visible: !hiddenElements.has(wall.id)
      }));

      elementGroups.push({
        type: 'walls',
        label: 'Walls',
        icon: '🧱',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        elements: walls,
        totalPerimeter: walls.reduce((sum: number, w: Element) => sum + (w.perimeter || 0), 0),
        totalCount: walls.length
      });
    }

    // Openings (Doors & Windows)
    if (analysisResults.predictions.openings?.length > 0) {
      const openings = analysisResults.predictions.openings.map((opening: any) => ({
        id: opening.id,
        type: opening.class?.toLowerCase().includes('door') ? 'door' : 'window',
        name: opening.class || 'Opening',
        count: 1,
        unit: 'EA',
        color: opening.class?.toLowerCase().includes('door') ? '#3b82f6' : '#10b981',
        visible: !hiddenElements.has(opening.id)
      }));

      elementGroups.push({
        type: 'openings',
        label: 'Doors & Windows',
        icon: '🚪',
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        elements: openings,
        totalCount: openings.length
      });
    }
  }

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleElementVisibility = (elementId: string, currentVisible: boolean) => {
    const newVisible = !currentVisible;
    onElementVisibilityToggle?.(elementId, newVisible);
  };

  const toggleGroupVisibility = (group: ElementGroup, visible: boolean) => {
    const newVisible = !visible;
    console.log(`[ElementList] Toggling ${group.label} from ${visible} to ${newVisible}`);
    console.log(`[ElementList] Group has ${group.elements.length} elements:`, group.elements.map(e => e.id));
    // Notify parent for each element
    group.elements.forEach(element => {
      console.log(`[ElementList] Setting ${element.id} (${element.name}) to ${newVisible}`);
      onElementVisibilityToggle?.(element.id, newVisible);
    });
  };

  if (!analysisResults || elementGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No elements detected</p>
          <p className="text-xs text-muted-foreground">Run AI analysis to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Elements</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Copy className="w-3 h-3 mr-1" />
              Copy All
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {elementGroups.reduce((sum, g) => sum + g.elements.length, 0)} total elements
        </div>
      </div>

      {/* Element Groups */}
      <div className="flex-1 overflow-y-auto">
        {elementGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.type);
          const allVisible = group.elements.every(e => !hiddenElements.has(e.id));
          const someVisible = group.elements.some(e => !hiddenElements.has(e.id));

          return (
            <div key={group.type} className="border-b border-border">
              {/* Group Header */}
              <div className="sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2 p-3 hover:bg-accent/50 cursor-pointer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleGroup(group.type)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>

                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded border",
                      group.color
                    )}
                  >
                    <span className="text-base">{group.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => toggleGroup(group.type)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{group.label}</span>
                      <span className="text-xs text-muted-foreground">{group.elements.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.totalArea && `${group.totalArea.toFixed(1)} SF`}
                      {group.totalPerimeter && `${group.totalPerimeter.toFixed(1)} LF`}
                      {group.totalCount && !group.totalArea && !group.totalPerimeter && `${group.totalCount} items`}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupVisibility(group, allVisible);
                    }}
                  >
                    {allVisible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : someVisible ? (
                      <Eye className="w-4 h-4 text-muted-foreground opacity-50" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Group Elements */}
              {isExpanded && (
                <div className="bg-muted/30">
                  {group.elements.map((element) => {
                    const isVisible = !hiddenElements.has(element.id);
                    const isSelected = selectedElementId === element.id;

                    return (
                      <div
                        key={element.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer border-l-2 transition-colors",
                          isSelected ? "bg-accent border-l-primary" : "border-l-transparent"
                        )}
                        onClick={() => onElementSelect?.(element.id)}
                      >
                        <Checkbox
                          checked={isVisible}
                          onCheckedChange={() => toggleElementVisibility(element.id, isVisible)}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-10"
                        />

                        <div
                          className="w-3 h-3 rounded-sm border"
                          style={{ backgroundColor: element.color }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{element.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {element.area && `${element.area.toFixed(1)} ${element.unit}`}
                            {element.perimeter && `${element.perimeter.toFixed(1)} ${element.unit}`}
                            {element.count && `${element.count} ${element.unit}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onElementDelete?.(element.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs space-y-1">
          {elementGroups.map(group => (
            <div key={group.type} className="flex justify-between">
              <span className="text-muted-foreground">{group.label}:</span>
              <span className="font-medium">
                {group.totalArea && `${group.totalArea.toFixed(1)} SF`}
                {group.totalPerimeter && `${group.totalPerimeter.toFixed(1)} LF`}
                {group.totalCount && !group.totalArea && !group.totalPerimeter && `${group.totalCount} EA`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
