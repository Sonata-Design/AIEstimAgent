import { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronRight, Trash2, Edit, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDetectionsStore } from "@/store/useDetectionsStore";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";

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
  onElementRename?: (elementId: string, newName: string) => void;
  selectedElementId?: string | null;
  hiddenElements?: Set<string>;
}

export function ElementListPanel({
  analysisResults,
  onElementVisibilityToggle,
  onElementSelect,
  onElementDelete,
  onElementRename,
  selectedElementId,
  hiddenElements = new Set()
}: ElementListPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['rooms', 'walls', 'openings', 'flooring', 'other']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Get manual elements from detections store
  const { detections, setDetections } = useDetectionsStore();
  const { updateDetection } = useStore();
  const { toast } = useToast();
  const manualElements = detections.filter((d: any) => d.isManual);
  
  console.log('[ElementListPanel] Detections:', detections.length, 'Manual elements:', manualElements.length);

  const elementGroups: ElementGroup[] = [];

  // Helper function to create element from detection
  const createElementFromDetection = (detection: any, defaultColor: string) => {
    // Check if this detection has been updated in the store
    const storeDetection = detections.find(d => d.id === detection.id);
    
    return {
      id: detection.id,
      type: detection.cls,
      // Use name from store if available (for renamed elements), otherwise use original
      name: storeDetection?.name || detection.name || detection.class || detection.label || detection.cls,
      area: detection.display?.area_sqft || 0,
      perimeter: detection.display?.perimeter_ft || 0,
      unit: 'sq ft',
      color: detection.color || defaultColor,
      visible: !hiddenElements.has(String(detection.id))
    };
  };

  // Rooms (AI-detected + Manual)
  const aiRooms = analysisResults?.predictions?.rooms?.length > 0
    ? analysisResults.predictions.rooms.map((room: any) => createElementFromDetection(room, '#10B981'))
    : [];
  const manualRooms = manualElements.filter((d: any) => d.cls === 'room').map((m: any) => createElementFromDetection(m, '#10B981'));
  const allRooms = [...aiRooms, ...manualRooms];
  
  if (allRooms.length > 0) {
    elementGroups.push({
      type: 'rooms',
      label: 'Rooms',
      icon: '🏠',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      elements: allRooms,
      totalArea: allRooms.reduce((sum: number, r: Element) => sum + (r.area || 0), 0),
      totalCount: allRooms.length
    });
  }

  // Flooring (Manual only)
  const manualFlooring = manualElements.filter((d: any) => d.cls === 'flooring').map((m: any) => createElementFromDetection(m, '#40E0D0'));
  if (manualFlooring.length > 0) {
    elementGroups.push({
      type: 'flooring',
      label: 'Flooring',
      icon: '📐',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      elements: manualFlooring,
      totalArea: manualFlooring.reduce((sum: number, r: Element) => sum + (r.area || 0), 0),
      totalCount: manualFlooring.length
    });
  }

  // Other (Manual only)
  const manualOther = manualElements.filter((d: any) => d.cls === 'other').map((m: any) => createElementFromDetection(m, '#800080'));
  if (manualOther.length > 0) {
    elementGroups.push({
      type: 'other',
      label: 'Other',
      icon: '📦',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      elements: manualOther,
      totalArea: manualOther.reduce((sum: number, r: Element) => sum + (r.area || 0), 0),
      totalCount: manualOther.length
    });
  }

  if (analysisResults?.predictions) {
    // Walls
    if (analysisResults.predictions.walls?.length > 0) {
      const walls = analysisResults.predictions.walls.map((wall: any) => {
        const storeDetection = detections.find(d => d.id === wall.id);
        return {
          id: wall.id,
          type: 'wall',
          name: storeDetection?.name || wall.name || wall.class || 'Wall',
          perimeter: wall.display?.perimeter_ft || 0,
          area: wall.display?.area_sqft || 0,
          unit: 'LF',
          color: '#64748b',
          visible: !hiddenElements.has(wall.id)
        };
      });

      elementGroups.push({
        type: 'walls',
        label: 'Walls',
        icon: '🧱',
        color: 'bg-orange-100 text-orange-700 border-orange-300',
        elements: walls,
        totalPerimeter: walls.reduce((sum: number, w: Element) => sum + (w.perimeter || 0), 0),
        totalCount: walls.length
      });
    }

    // Openings (Doors & Windows)
    if (analysisResults.predictions.openings?.length > 0) {
      const openings = analysisResults.predictions.openings.map((opening: any) => {
        const storeDetection = detections.find(d => d.id === opening.id);
        return {
          id: opening.id,
          type: opening.class?.toLowerCase().includes('door') ? 'door' : 'window',
          name: storeDetection?.name || opening.name || opening.class || 'Opening',
          count: 1,
          unit: 'EA',
          color: opening.class?.toLowerCase().includes('door') ? '#3b82f6' : '#10b981',
          visible: !hiddenElements.has(opening.id)
        };
      });

      elementGroups.push({
        type: 'openings',
        label: 'Doors & Windows',
        icon: '🚪',
        color: 'bg-green-100 text-green-700 border-green-300',
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

  const handleStartEdit = (element: Element) => {
    setEditingId(element.id);
    setEditValue(element.name);
  };

  const handleSaveEdit = (elementId: string) => {
    if (!editValue.trim()) return;
    
    // Update in store
    updateDetection(elementId, { name: editValue });
    // Update in detections store
    setDetections(detections.map(d => 
      d.id === elementId ? { ...d, name: editValue } : d
    ));
    
    // Notify parent to update analysisResults
    onElementRename?.(elementId, editValue);
    
    toast({
      title: "Renamed",
      description: `Element renamed to "${editValue}"`,
      duration: 2000,
    });
    
    setEditingId(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = (element: Element) => {
    // Call parent delete handler
    onElementDelete?.(element.id);
    
    // Show toast notification
    toast({
      title: "Element deleted",
      description: `${element.name} has been removed`,
      duration: 3000,
    });
  };

  // Show empty state only if there are NO elements (including manual rooms)
  if (elementGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No elements detected</p>
          <p className="text-xs text-muted-foreground">Run AI analysis or create manual rooms</p>
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{group.label}</span>
                      <span className="text-xs text-muted-foreground">{group.elements.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.totalArea && `${group.totalArea.toFixed(1)} SF`}
                      {group.totalArea && group.totalPerimeter && ' • '}
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
                          "group flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer border-l-2 transition-all duration-200 hover:shadow-sm",
                          isSelected ? "bg-accent border-l-primary shadow-sm" : "border-l-transparent"
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

                        {editingId === element.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') handleSaveEdit(element.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="h-7 text-sm flex-1"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(element.id);
                              }}
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{element.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {element.perimeter && element.perimeter > 0 && `${element.perimeter.toFixed(1)} LF`}
                                {element.area && element.area > 0 && element.perimeter && element.perimeter > 0 && ' • '}
                                {element.area && element.area > 0 && `${element.area.toFixed(1)} SF`}
                                {element.count && `${element.count} ${element.unit}`}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(element);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(element);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </>
                        )}
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
