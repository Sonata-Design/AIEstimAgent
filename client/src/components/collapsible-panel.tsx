import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  side: 'left' | 'right';
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapsedWidth?: number;
  expandedWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function CollapsiblePanel({
  side,
  children,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  collapsedWidth = 64,
  expandedWidth = 320,
  minWidth = 200,
  maxWidth = 600,
  className
}: CollapsiblePanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  const [width, setWidth] = useState(expandedWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    let newWidth: number;

    if (side === 'right') {
      newWidth = window.innerWidth - e.clientX;
    } else {
      newWidth = e.clientX - panelRect.left;
    }

    // Auto-collapse if dragged too far
    if (newWidth < 100) {
      if (onCollapsedChange) {
        onCollapsedChange(true);
      } else {
        setInternalCollapsed(true);
      }
      setIsResizing(false);
      return;
    }

    // Constrain width
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative bg-background border-border flex-shrink-0 group",
        side === 'left' ? 'border-r' : 'border-l',
        !isResizing && "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        width: isCollapsed ? `${collapsedWidth}px` : `${width}px`,
        userSelect: isResizing ? 'none' : 'auto'
      }}
    >
      {/* Resize Handle - Shows double-arrow cursor on hover */}
      {!isCollapsed && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-30 transition-all group/handle",
            side === 'left' ? '-right-0.5' : '-left-0.5'
          )}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          {/* Visual indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/handle:opacity-100 transition-opacity">
            <div className={cn(
              "h-12 w-1 bg-blue-500 rounded-full shadow-lg",
              side === 'left' ? 'ml-0.5' : 'mr-0.5'
            )} />
          </div>
        </div>
      )}

      {/* Collapsed State - Click to expand */}
      {isCollapsed && (
        <div 
          className="absolute inset-0 cursor-pointer hover:bg-accent/50 transition-all duration-200 flex items-center justify-center group/expand"
          onClick={toggleCollapse}
          title="Click to expand (Ctrl+L)"
        >
          <PanelRight className="w-5 h-5 text-muted-foreground transition-transform group-hover/expand:scale-110" />
        </div>
      )}

      {/* Panel Content */}
      <div className={cn(
        "h-full overflow-hidden transition-all duration-300 ease-in-out",
        isCollapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}>
        {children}
      </div>

      {/* Collapsed State Icon View */}
      {isCollapsed && (
        <div className="h-full flex flex-col items-center py-4 gap-4">
          {/* Add collapsed state icons here if needed */}
        </div>
      )}
    </div>
  );
}
