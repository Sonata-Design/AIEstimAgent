import { useState } from "react";
import { 
  Building2, 
  Maximize, 
  ArrowUpDown, 
  Zap, 
  Droplets, 
  Wind, 
  Hammer,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TakeoffType {
  id: string;
  name: string;
  description: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  disabled?: boolean;
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
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    disabled: true
  },
  {
    id: "plumbing",
    name: "Plumbing",
    description: "Fixtures and pipe runs",
    unit: "each",
    icon: Droplets,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    disabled: true
  },
  {
    id: "hvac",
    name: "HVAC",
    description: "Heating and cooling systems",
    unit: "each",
    icon: Wind,
    color: "text-green-600 bg-green-50 border-green-200",
    disabled: true
  },
  {
    id: "structural",
    name: "Structural",
    description: "Beams, columns, foundations",
    unit: "each",
    icon: Hammer,
    color: "text-red-600 bg-red-50 border-red-200",
    disabled: true
  }
];

interface TakeoffSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
  onRunAnalysis: () => void;
  isAnalyzing?: boolean;
}

export function TakeoffSelectionModal({
  open,
  onOpenChange,
  selectedTypes,
  onSelectionChange,
  onRunAnalysis,
  isAnalyzing = false
}: TakeoffSelectionModalProps) {
  const handleTypeToggle = (typeId: string, disabled?: boolean) => {
    if (disabled) return; // Don't allow toggling disabled types
    
    const newSelection = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    // Only select enabled types
    onSelectionChange(takeoffTypes.filter(type => !type.disabled).map(type => type.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleRunAnalysis = () => {
    onRunAnalysis();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Takeoff Types</DialogTitle>
          <DialogDescription>
            Choose which building elements to detect and measure in your drawing
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
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

          {/* Takeoff Types Grid */}
          <div className="grid grid-cols-2 gap-3">
            {takeoffTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              
              return (
                <div
                  key={type.id}
                  onClick={() => handleTypeToggle(type.id, type.disabled)}
                  className={cn(
                    "transition-all duration-200 rounded-lg border p-4",
                    type.disabled 
                      ? "opacity-50 cursor-not-allowed bg-muted" 
                      : "cursor-pointer hover:shadow-md hover:scale-[1.02]",
                    !type.disabled && isSelected 
                      ? 'bg-primary/10 border-primary border-2 shadow-sm' 
                      : !type.disabled && 'bg-card border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <IconComponent className={cn(
                        "w-6 h-6",
                        isSelected ? 'text-primary' : type.color.split(' ')[0]
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-foreground">{type.name}</h3>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleTypeToggle(type.id)}
                          onClick={(e) => e.stopPropagation()}
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

          {/* Selection Summary */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {selectedTypes.length === 0 ? (
                "No takeoff types selected. Please select at least one to continue."
              ) : (
                `${selectedTypes.length} takeoff type${selectedTypes.length > 1 ? 's' : ''} selected`
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isAnalyzing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRunAnalysis}
            disabled={selectedTypes.length === 0 || isAnalyzing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden min-w-[200px]"
          >
            {isAnalyzing ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                <Loader2 className="w-4 h-4 animate-spin mr-2 relative z-10" />
                <span className="relative z-10">Analyzing...</span>
                <Sparkles className="w-4 h-4 ml-2 animate-bounce relative z-10" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
