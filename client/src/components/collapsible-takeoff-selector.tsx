import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Building2, Maximize, ArrowUpDown, Zap, Droplets, Wind, Hammer, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TakeoffType {
  id: string;
  name: string;
  description: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const takeoffTypes: TakeoffType[] = [
  {
    id: "openings",
    name: "Doors & Windows",
    description: "All door and window types",
    unit: "each",
    icon: Building2,
    color: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    id: "flooring",
    name: "Flooring & Rooms",
    description: "Floor area and room detection",
    unit: "sq ft",
    icon: Maximize,
    color: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    id: "walls",
    name: "Walls",
    description: "Wall length and area",
    unit: "linear ft",
    icon: ArrowUpDown,
    color: "text-slate-600 bg-slate-50 border-slate-200"
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Outlets, switches, fixtures",
    unit: "each",
    icon: Zap,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200"
  },
  {
    id: "plumbing",
    name: "Plumbing",
    description: "Fixtures and pipe runs",
    unit: "each",
    icon: Droplets,
    color: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    id: "hvac",
    name: "HVAC",
    description: "Heating and cooling systems",
    unit: "each",
    icon: Wind,
    color: "text-green-600 bg-green-50 border-green-200"
  },
  {
    id: "structural",
    name: "Structural",
    description: "Beams, columns, foundations",
    unit: "each",
    icon: Hammer,
    color: "text-red-600 bg-red-50 border-red-200"
  }
];

interface CollapsibleTakeoffSelectorProps {
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
  onRunAnalysis: () => void;
  isAnalyzing?: boolean;
}

export function CollapsibleTakeoffSelector({
  selectedTypes,
  onSelectionChange,
  onRunAnalysis,
  isAnalyzing = false
}: CollapsibleTakeoffSelectorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTypeToggle = (typeId: string) => {
    const newSelection = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(takeoffTypes.map(type => type.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div
      className={cn(
        "bg-background border-r border-border flex flex-col h-full transition-all duration-300 ease-in-out relative group",
        isCollapsed ? "w-16" : "w-80"
      )}
    >
      {/* Collapse/Expand Button - Shows on hover */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-4 z-20 h-8 w-8 p-0 rounded-md border border-border bg-background shadow-md hover:bg-accent hover:border-primary opacity-0 group-hover:opacity-100 transition-all duration-200"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <Maximize2 className="w-4 h-4" />
        ) : (
          <Minimize2 className="w-4 h-4" />
        )}
      </Button>

      {/* Expanded View */}
      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-2">Select Takeoff Types</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose which building elements to detect and measure</p>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                className="flex-1"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                className="flex-1"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Takeoff Types */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {takeoffTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              
              return (
                <div
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 rounded-lg border p-3",
                    isSelected 
                      ? 'bg-accent border-primary border-2 shadow-sm' 
                      : 'bg-card border-border hover:border-muted-foreground/30 hover:bg-accent/50'
                  )}
                  onClick={() => handleTypeToggle(type.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <IconComponent className={cn(
                        "w-5 h-5",
                        isSelected ? 'text-primary' : type.color.split(' ')[0]
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm text-foreground">{type.name}</h3>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleTypeToggle(type.id)}
                          className="ml-2"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {type.unit}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-border space-y-3 bg-background">
            <Button 
              onClick={onRunAnalysis}
              disabled={selectedTypes.length === 0 || isAnalyzing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden"
            >
              {isAnalyzing ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                  <Loader2 className="w-4 h-4 animate-spin mr-2 relative z-10" />
                  <span className="relative z-10 animate-pulse">AI is Analyzing...</span>
                  <Sparkles className="w-4 h-4 ml-2 animate-bounce relative z-10" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {`Run AI Analysis (${selectedTypes.length} selected)`}
                </>
              )}
            </Button>
            
            {selectedTypes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Select at least one element type to analyze
              </p>
            )}
          </div>
        </>
      )}

      {/* Collapsed View - Icon Only */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-3 h-full">
          <div className="text-xs font-semibold text-muted-foreground rotate-0 mb-2">
            {selectedTypes.length}
          </div>
          {takeoffTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            
            return (
              <button
                key={type.id}
                onClick={() => handleTypeToggle(type.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 border",
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-110' 
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:scale-105'
                )}
                title={type.name}
              >
                <IconComponent className="w-5 h-5" />
              </button>
            );
          })}

          {/* Run Analysis Button - Collapsed */}
          <div className="mt-auto">
            <Button
              onClick={onRunAnalysis}
              disabled={selectedTypes.length === 0 || isAnalyzing}
              size="sm"
              className={cn(
                "w-10 h-10 p-0 rounded-lg",
                isAnalyzing && "animate-pulse"
              )}
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
