import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/store/useSettingsStore";
import { 
  Settings, 
  Keyboard, 
  Ruler, 
  Eye,
  Zap,
  RotateCcw,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onShowShortcuts?: () => void;
  onShowTakeoffSelection?: () => void;
}

export function SettingsPanel({ open, onOpenChange, onShowShortcuts, onShowTakeoffSelection }: SettingsPanelProps) {
  const { toast } = useToast();
  
  // Get settings from store
  const {
    theme,
    showGrid,
    snapToGrid,
    units,
    autoSave,
    setTheme,
    setShowGrid,
    setSnapToGrid,
    setUnits,
    setAutoSave,
    resetSettings,
  } = useSettingsStore();
  
  // Local state for unsaved changes
  const [localSettings, setLocalSettings] = useState({
    theme,
    showGrid,
    snapToGrid,
    units,
    autoSave,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync local state when store changes or dialog opens
  useEffect(() => {
    if (open) {
      setLocalSettings({
        theme,
        showGrid,
        snapToGrid,
        units,
        autoSave,
      });
    }
  }, [open, theme, showGrid, snapToGrid, units, autoSave]);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate async save (adds visual feedback)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Apply all settings
    setTheme(localSettings.theme);
    setShowGrid(localSettings.showGrid);
    setSnapToGrid(localSettings.snapToGrid);
    setUnits(localSettings.units);
    setAutoSave(localSettings.autoSave);
    
    setIsSaving(false);
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
    
    onOpenChange?.(false);
  };
  
  const handleReset = () => {
    resetSettings();
    setLocalSettings({
      theme: 'system',
      showGrid: false,
      snapToGrid: false,
      units: 'imperial',
      autoSave: true,
    });
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };
  
  const handleCancel = () => {
    // Revert local changes
    setLocalSettings({
      theme,
      showGrid,
      snapToGrid,
      units,
      autoSave,
    });
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your workspace preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onShowShortcuts?.();
                onOpenChange?.(false);
              }}
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Keyboard Shortcuts
              <kbd className="ml-auto px-2 py-1 text-xs bg-muted border border-border rounded">
                ?
              </kbd>
            </Button>
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Display
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-xs text-muted-foreground">Choose your color theme</p>
                </div>
                <Select 
                  value={localSettings.theme} 
                  onValueChange={(value) => setLocalSettings({...localSettings, theme: value as any})}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Grid</Label>
                  <p className="text-xs text-muted-foreground">Display grid overlay</p>
                </div>
                <Switch
                  checked={localSettings.showGrid}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, showGrid: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Snap to Grid</Label>
                  <p className="text-xs text-muted-foreground">Align to grid points</p>
                </div>
                <Switch
                  checked={localSettings.snapToGrid}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, snapToGrid: checked})}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Measurement Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Measurements
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Units</Label>
                <p className="text-xs text-muted-foreground">Measurement system</p>
              </div>
              <Select 
                value={localSettings.units} 
                onValueChange={(value) => setLocalSettings({...localSettings, units: value as any})}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Imperial</SelectItem>
                  <SelectItem value="metric">Metric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Performance Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-save</Label>
                <p className="text-xs text-muted-foreground">Save changes automatically</p>
              </div>
              <Switch
                checked={localSettings.autoSave}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, autoSave: checked})}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-between">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
