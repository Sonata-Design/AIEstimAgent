import { useState } from 'react';
import { Check, Zap, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { PageData } from '@/types/pdf';

interface PageGalleryProps {
  pages: PageData[];
  onBack: () => void;
  selectedPageNumber?: number | null;
  onPageSelect?: (pageNumber: number) => void;
  onSelectedPagesChange?: (count: number) => void;
}

const PAGE_TYPE_COLORS: Record<string, string> = {
  floor_plan: 'bg-blue-100 text-blue-800 border-blue-200',
  elevation: 'bg-green-100 text-green-800 border-green-200',
  electrical_plan: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  plumbing_plan: 'bg-purple-100 text-purple-800 border-purple-200',
  hvac_plan: 'bg-orange-100 text-orange-800 border-orange-200',
  site_plan: 'bg-teal-100 text-teal-800 border-teal-200',
  section: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  detail: 'bg-pink-100 text-pink-800 border-pink-200',
  notes: 'bg-gray-100 text-gray-800 border-gray-200',
  cover_page: 'bg-gray-100 text-gray-800 border-gray-200',
  schedule: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  unknown: 'bg-red-100 text-red-800 border-red-200',
};

const PAGE_TYPE_ICONS: Record<string, string> = {
  floor_plan: '🏠',
  elevation: '🏢',
  electrical_plan: '⚡',
  plumbing_plan: '🚰',
  hvac_plan: '❄️',
  site_plan: '🗺️',
  section: '📐',
  detail: '🔍',
  notes: '📝',
  cover_page: '📄',
  schedule: '📊',
  unknown: '❓',
};

export function PageGallery({ pages, onBack, selectedPageNumber, onPageSelect, onSelectedPagesChange }: PageGalleryProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const togglePage = (pageNum: number, analyzable: boolean) => {
    if (!analyzable) return;
    
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
    onSelectedPagesChange?.(newSelected.size);
  };

  const selectAllAnalyzable = () => {
    // Only select floor plan pages for now
    const floorPlans = pages
      .filter(p => p.type === 'floor_plan' && p.analyzable)
      .map(p => p.page_number);
    const newSelected = new Set(floorPlans);
    setSelectedPages(newSelected);
    onSelectedPagesChange?.(newSelected.size);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
    onSelectedPagesChange?.(0);
  };

  const analyzableCount = pages.filter(p => p.analyzable).length;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Quick Actions */}
      <div className="flex gap-2 flex-shrink-0 p-3 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSelection}
          className="h-8 text-xs flex-1"
        >
          Clear
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllAnalyzable}
          className="h-8 text-xs flex-1"
        >
          <Zap className="w-3 h-3" />
        </Button>
      </div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0 p-2 border-b border-border">
        <Card className="p-2 bg-muted border-border">
          <div className="text-lg font-bold text-foreground">{pages.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="p-2 bg-muted border-border">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{analyzableCount}</div>
          <div className="text-xs text-muted-foreground">Analyzable</div>
        </Card>
      </div>

      {/* Page Grid - Vertical Sidebar */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 px-2 py-3">
        <div className="flex flex-col gap-2 pb-6">
        {pages.map((page) => {
          const isSelected = selectedPages.has(page.page_number);
          const pageTypeColor = PAGE_TYPE_COLORS[page.type] || PAGE_TYPE_COLORS.unknown;
          const pageTypeIcon = PAGE_TYPE_ICONS[page.type] || PAGE_TYPE_ICONS.unknown;

          const isPageSelected = selectedPageNumber === page.page_number;

          return (
            <Card
              key={page.page_number}
              className={`relative transition-all hover:shadow-lg flex gap-2 bg-muted border-border ${
                isPageSelected
                  ? 'ring-2 ring-purple-500 shadow-md bg-purple-100 dark:bg-purple-900/30'
                  : ''
              } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${!page.analyzable ? 'opacity-50' : ''}`}
            >
              {/* Checkbox for selection */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePage(page.page_number, page.analyzable);
                  }}
                  disabled={!page.analyzable}
                  className={`p-1 rounded transition-colors ${
                    page.analyzable
                      ? 'hover:bg-accent cursor-pointer'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Not Analyzable or Coming Soon Badge */}
              {!page.analyzable && (
                <div className="absolute top-1 left-1 z-10">
                  <Badge variant="secondary" className="text-xs">
                    Not Analyzable
                  </Badge>
                </div>
              )}
              
              {/* Coming Soon for non-floor-plan pages */}
              {page.type !== 'floor_plan' && page.analyzable && (
                <div className="absolute top-1 left-1 z-10">
                  <Badge className="text-xs bg-amber-900/50 text-amber-200 border-amber-700">
                    coming soon...
                  </Badge>
                </div>
              )}

              {/* Thumbnail - Clickable to view */}
              <div 
                className="aspect-[3/4] w-20 bg-accent overflow-hidden rounded flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                onClick={() => {
                  if (onPageSelect && page.analyzable) {
                    onPageSelect(page.page_number);
                  }
                }}
              >
                <img
                  src={page.thumbnail}
                  alt={`Page ${page.page_number}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="p-2 space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Page {page.page_number}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <span className="text-xs">{pageTypeIcon}</span>
                  <Badge className={`${pageTypeColor} text-xs py-0 px-1`} variant="outline">
                    {page.type.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground truncate" title={page.title}>
                  {page.title}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence:</span>
                  <span className="font-medium text-xs">
                    {(page.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Help Text */}
      {analyzableCount === 0 && (
        <div className="text-center py-2 text-muted-foreground flex-shrink-0">
          <p className="text-xs">No analyzable pages</p>
        </div>
      )}
    </div>
  );
}
