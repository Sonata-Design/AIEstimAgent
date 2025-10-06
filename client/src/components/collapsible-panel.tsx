import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  side: 'left' | 'right';
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsedWidth?: number;
  expandedWidth?: number;
  className?: string;
}

export function CollapsiblePanel({
  side,
  children,
  defaultCollapsed = false,
  collapsedWidth = 64,
  expandedWidth = 320,
  className
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        "relative bg-background border-border transition-all duration-300 ease-in-out flex-shrink-0 group",
        side === 'left' ? 'border-r' : 'border-l',
        className
      )}
      style={{
        width: isCollapsed ? `${collapsedWidth}px` : `${expandedWidth}px`
      }}
    >
      {/* Collapse/Expand Button - Shows on hover */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute top-4 z-20 h-8 w-8 p-0 rounded-md border border-border bg-background shadow-md hover:bg-accent hover:border-primary opacity-0 group-hover:opacity-100 transition-all duration-200",
          side === 'left' ? '-right-3' : '-left-3'
        )}
        onClick={toggleCollapse}
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <Maximize2 className="w-4 h-4" />
        ) : (
          <Minimize2 className="w-4 h-4" />
        )}
      </Button>

      {/* Panel Content */}
      <div className={cn(
        "h-full overflow-hidden transition-opacity duration-300",
        isCollapsed && "opacity-0"
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
