import { ChevronLeft, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageGallery } from "./page-gallery";
import type { PDFProcessResult } from "./pdf-upload-zone";

interface PDFGallerySidebarProps {
  pdfData: PDFProcessResult;
  selectedPageNumber: number | null;
  onPageSelect: (pageNumber: number) => void;
  onBack: () => void;
}

export function PDFGallerySidebar({
  pdfData,
  selectedPageNumber,
  onPageSelect,
  onBack,
}: PDFGallerySidebarProps) {
  const [selectedPagesCount, setSelectedPagesCount] = useState(0);

  return (
    <aside className="w-80 flex-shrink-0 border-r border-border bg-background flex flex-col h-full overflow-hidden">
      {/* Header Section: Navigation & File Info */}
      <div className="px-2 py-1 border-b border-border flex-shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="-ml-2 h-7 text-muted-foreground hover:text-foreground mb-0.5 text-xs"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Back
        </Button>
        
        {/* Two Column Layout */}
        <div className="flex justify-between gap-2">
          {/* Left Column */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <FileText className="w-3 h-3 text-primary flex-shrink-0" />
              <h3 className="font-bold text-sm truncate" title={pdfData.filename}>
                {pdfData.filename || "Document"}
              </h3>
            </div>
            <div className="text-xs text-muted-foreground">
              {pdfData.pages.length} {pdfData.pages.length === 1 ? 'page' : 'pages'}
            </div>
          </div>
          
          {/* Right Column */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-0.5">
              <FileText className="w-3 h-3 text-primary flex-shrink-0" />
              <h3 className="font-bold text-sm">
                Page
              </h3>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedPagesCount}/{pdfData.pages.length} selected
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Gallery Area */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <PageGallery
          pages={pdfData.pages}
          selectedPageNumber={selectedPageNumber}
          onPageSelect={onPageSelect}
          onBack={onBack}
          onSelectedPagesChange={setSelectedPagesCount}
        />
      </div>
    </aside>
  );
}