import { useState, useEffect } from "react";
import { 
  MousePointer, 
  Hand,
  Scissors, 
  Combine, 
  Split, 
  Move3d, 
  Pencil, 
  Settings,
  Undo2,
  Redo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ToolType = 'select' | 'pan' | 'cut' | 'merge' | 'split' | 'measure' | 'markup' | 'settings';

interface Tool {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  disabled?: boolean;
}

interface VerticalToolPaletteProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function VerticalToolPalette({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: VerticalToolPaletteProps) {
  const tools: Tool[] = [
    { 
      id: 'select', 
      icon: MousePointer, 
      label: 'Select', 
      shortcut: 'V' 
    },
    { 
      id: 'pan', 
      icon: Hand, 
      label: 'Pan', 
      shortcut: 'H' 
    },
    { 
      id: 'cut', 
      icon: Scissors, 
      label: 'Cut/Subtract', 
      shortcut: 'C',
      disabled: true // Will enable when implementing
    },
    { 
      id: 'merge', 
      icon: Combine, 
      label: 'Merge', 
      shortcut: 'M',
      disabled: true
    },
    { 
      id: 'split', 
      icon: Split, 
      label: 'Split', 
      shortcut: 'S',
      disabled: true
    },
    { 
      id: 'measure', 
      icon: Move3d, 
      label: 'Measure',
      shortcut: 'R'
    },
    { 
      id: 'markup', 
      icon: Pencil, 
      label: 'Markup',
      disabled: true
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings' 
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Tool shortcuts
      if (key === 'v') {
        onToolChange('select');
      } else if (key === 'h') {
        onToolChange('pan');
      } else if (key === 'r') {
        onToolChange('measure');
      } else if (key === 'c') {
        onToolChange('cut');
      } else if (key === 'm') {
        onToolChange('merge');
      } else if (key === 's') {
        onToolChange('split');
      }
      
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (key === 'z' && !e.shiftKey && canUndo) {
          e.preventDefault();
          onUndo?.();
        } else if ((key === 'y' || (key === 'z' && e.shiftKey)) && canRedo) {
          e.preventDefault();
          onRedo?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToolChange, onUndo, onRedo, canUndo, canRedo]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-16 bg-background border-r border-border flex flex-col items-center py-4 gap-2">
        {/* Main Tools */}
        {tools.map((tool, index) => {
          const IconComponent = tool.icon;
          const isActive = activeTool === tool.id;
          
          // Add separator before cut tool, measure tool and settings
          const showSeparator = index === 2 || index === 5 || index === 7;
          
          return (
            <div key={tool.id} className="w-full flex flex-col items-center">
              {showSeparator && (
                <div className="w-10 h-px bg-border my-2" />
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={tool.disabled}
                    onClick={() => onToolChange(tool.id)}
                    className={cn(
                      "w-10 h-10 rounded-md flex items-center justify-center transition-all",
                      "hover:bg-accent hover:scale-105",
                      isActive && "bg-primary text-primary-foreground shadow-sm scale-100",
                      !isActive && "text-muted-foreground",
                      tool.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="flex items-center gap-2 px-2 py-1 text-xs"
                  sideOffset={5}
                >
                  <span className="font-medium">{tool.label}</span>
                  {tool.shortcut && (
                    <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border">
                      {tool.shortcut}
                    </kbd>
                  )}
                  {tool.disabled && (
                    <span className="text-[10px] text-muted-foreground italic">(Soon)</span>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Undo/Redo at bottom */}
        <div className="w-10 h-px bg-border my-2" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canUndo}
              onClick={onUndo}
              className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center transition-all",
                "hover:bg-accent hover:scale-105",
                "text-muted-foreground",
                !canUndo && "opacity-40 cursor-not-allowed"
              )}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="flex items-center gap-2 px-2 py-1 text-xs"
            sideOffset={5}
          >
            <span className="font-medium">Undo</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border">Ctrl+Z</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canRedo}
              onClick={onRedo}
              className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center transition-all",
                "hover:bg-accent hover:scale-105",
                "text-muted-foreground",
                !canRedo && "opacity-40 cursor-not-allowed"
              )}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="flex items-center gap-2 px-2 py-1 text-xs"
            sideOffset={5}
          >
            <span className="font-medium">Redo</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border">Ctrl+Y</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
