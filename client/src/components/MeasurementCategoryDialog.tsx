import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Building2, Maximize, ArrowUpDown } from "lucide-react";

interface MeasurementCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurementType: 'distance' | 'area';
  measurementValue: string;
  onConfirm: (category: string, name: string) => void;
  onCancel: () => void;
}

const categories = [
  { id: 'room', label: 'Room', icon: Building2, description: 'Living room, bedroom, etc.' },
  { id: 'wall', label: 'Wall', icon: ArrowUpDown, description: 'Interior or exterior wall' },
  { id: 'flooring', label: 'Flooring', icon: Maximize, description: 'Floor area measurement' },
  { id: 'other', label: 'Other', icon: Building2, description: 'Custom measurement' },
];

export function MeasurementCategoryDialog({
  open,
  onOpenChange,
  measurementType,
  measurementValue,
  onConfirm,
  onCancel,
}: MeasurementCategoryDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState('room');
  const [customName, setCustomName] = useState('');

  const handleConfirm = () => {
    onConfirm(selectedCategory, customName || selectedCategory);
    setCustomName('');
    setSelectedCategory('room');
  };

  const handleCancel = () => {
    onCancel();
    setCustomName('');
    setSelectedCategory('room');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Categorize Measurement</DialogTitle>
          <DialogDescription>
            {measurementType === 'area' 
              ? `Area: ${measurementValue}` 
              : `Distance: ${measurementValue}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Category</Label>
            <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={category.id}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <RadioGroupItem value={category.id} id={category.id} />
                    <div className="flex items-center space-x-3 flex-1">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={category.id} className="cursor-pointer font-medium">
                          {category.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Custom Name (Optional)</Label>
            <Input
              id="name"
              placeholder={`e.g., Master Bedroom, North Wall`}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save Measurement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
