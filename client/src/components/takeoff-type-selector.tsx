import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Box, 
  Square, 
  Zap, 
  Droplets, 
  DoorOpen, 
  Maximize2, 
  Home,
  Hammer,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Drawing } from "@shared/schema";

interface TakeoffType {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: string;
  unit: string;
  color: string;
}

const TAKEOFF_TYPES: TakeoffType[] = [
  {
    id: "rooms",
    name: "Rooms & Flooring",
    icon: Box,
    description: "Room detection and floor area measurements",
    category: "rooms",
    unit: "sq ft",
    color: "bg-purple-500"
  },
  {
    id: "doors",
    name: "Doors",
    icon: DoorOpen,
    description: "Interior and exterior doors",
    category: "doors",
    unit: "each",
    color: "bg-blue-500"
  },
  {
    id: "windows",
    name: "Windows", 
    icon: Square,
    description: "All window types and sizes",
    category: "windows",
    unit: "each",
    color: "bg-cyan-500"
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: Box,
    description: "Floor area measurements",
    category: "flooring", 
    unit: "sq ft",
    color: "bg-amber-500"
  },
  {
    id: "walls",
    name: "Walls",
    icon: Maximize2,
    description: "Wall length and area",
    category: "walls",
    unit: "linear ft",
    color: "bg-slate-500"
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: Zap,
    description: "Outlets, switches, fixtures",
    category: "electrical",
    unit: "each",
    color: "bg-yellow-500"
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: Droplets,
    description: "Fixtures and pipe runs",
    category: "plumbing",
    unit: "each",
    color: "bg-blue-600"
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: Home,
    description: "Heating and cooling systems",
    category: "hvac",
    unit: "each",
    color: "bg-green-500"
  },
  {
    id: "structural",
    name: "Structural",
    icon: Hammer,
    description: "Beams, columns, foundations",
    category: "structural",
    unit: "each",
    color: "bg-red-500"
  }
];

interface TakeoffTypeSelectorProps {
  drawing: Drawing;
  onComplete?: () => void;
}

export default function TakeoffTypeSelector({ drawing, onComplete }: TakeoffTypeSelectorProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { toast } = useToast();

  const runTakeoffMutation = useMutation({
    mutationFn: async (typeIds: string[]) => {
      return apiRequest(`/api/drawings/${drawing.id}/run-takeoff`, "POST", { elementTypes: typeIds });
    },
    onSuccess: () => {
      toast({
        title: "Takeoff Started",
        description: "AI analysis is running on selected element types",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drawings", drawing.id, "takeoffs"] });
      onComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start takeoff analysis",
        variant: "destructive",
      });
    },
  });

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTypes(TAKEOFF_TYPES.map(type => type.id));
  };

  const handleClearAll = () => {
    setSelectedTypes([]);
  };

  const handleRunTakeoff = () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one element type to analyze",
        variant: "destructive",
      });
      return;
    }
    runTakeoffMutation.mutate(selectedTypes);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Takeoff Types</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which building elements to detect and measure
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TAKEOFF_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            
            return (
              <div
                key={type.id}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blueprint-500 bg-blueprint-50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }
                `}
                onClick={() => handleTypeToggle(type.id)}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{type.name}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {type.unit}
                    </Badge>
                  </div>
                </div>
                
                {/* Checkbox indicator */}
                <div className="absolute top-2 right-2">
                  <Checkbox checked={isSelected} onChange={() => handleTypeToggle(type.id)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectedTypes.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium mb-2">
              Selected: {selectedTypes.length} element type{selectedTypes.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTypes.map(typeId => {
                const type = TAKEOFF_TYPES.find(t => t.id === typeId);
                return type ? (
                  <Badge key={typeId} variant="secondary" className="text-xs">
                    {type.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleRunTakeoff}
            disabled={selectedTypes.length === 0 || runTakeoffMutation.isPending}
            className="bg-blueprint-600 hover:bg-blueprint-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {runTakeoffMutation.isPending ? "Starting Analysis..." : "Run AI Takeoff"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}