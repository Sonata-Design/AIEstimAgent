import { useState } from "react";
import Layout from "@/components/layout";
import DrawingViewer from "@/components/drawing-viewer";
import VerticalTakeoffSelector from "@/components/vertical-takeoff-selector";
import AIChatWidget from "@/components/ai-chat-widget";
import RealtimeAnalysisPanel from "@/components/realtime-analysis-panel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Download,
  Ruler,
  Square,
  Hash
} from "lucide-react";
import type { Drawing } from "@shared/schema";

export default function Dashboard() {
  const [selectedTakeoffTypes, setSelectedTakeoffTypes] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);

  const { toast } = useToast();

  const handleRunAnalysis = () => {
    // Use default types if none selected
    const typesToAnalyze = selectedTakeoffTypes.length > 0 
      ? selectedTakeoffTypes 
      : ['doors', 'windows', 'flooring', 'electrical'];
    
    if (typesToAnalyze.length === 0) {
      toast({
        title: "No takeoff types available",
        description: "Unable to start analysis without element types.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    // Update selected types if we're using defaults
    if (selectedTakeoffTypes.length === 0) {
      setSelectedTakeoffTypes(typesToAnalyze);
    }
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${typesToAnalyze.length} element types.`,
      });
    }, 8000); // Longer duration to show the progress steps
  };

  const handleFileUpload = (drawing: Drawing) => {
    setCurrentDrawing(drawing);
    
    // Auto-select common takeoff types if none are selected
    if (selectedTakeoffTypes.length === 0) {
      setSelectedTakeoffTypes(['doors', 'windows', 'flooring', 'electrical']);
    }
    
    // Automatically start analysis after a brief delay
    setTimeout(() => {
      handleRunAnalysis();
    }, 1000);
    
    toast({
      title: "File uploaded successfully",
      description: "Starting automatic AI analysis...",
    });
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Vertical Takeoff Selector - Left Sidebar */}
        <VerticalTakeoffSelector
          selectedTypes={selectedTakeoffTypes}
          onSelectionChange={setSelectedTakeoffTypes}
          onRunAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Simplified Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500">
                  {currentDrawing?.name || "Upload a drawing to begin"}
                </span>
              </div>
            </div>
          </div>

          {/* Drawing Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-slate-900">
                  {currentDrawing?.name || "No drawing selected"}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Scale:</span>
                  <select className="text-xs border border-slate-300 rounded px-2 py-1">
                    <option>1/4" = 1'</option>
                    <option>1/8" = 1'</option>
                    <option>1/2" = 1'</option>
                  </select>
                </div>
                
                {/* Manual Measurement Tools */}
                <div className="flex items-center space-x-1 border-l border-slate-300 pl-3">
                  <Button variant="ghost" size="sm" title="Linear measurement">
                    <Ruler className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Area measurement">
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Count items">
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>

                {/* View Controls - Moved next to measurement tools */}
                <div className="flex items-center bg-white rounded-lg p-1 border">
                  <Button variant="ghost" size="sm" className="bg-blueprint-50 text-blueprint-700 text-xs">
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 text-xs">
                    Annotate
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Export Report - Moved to right side next to AI Assistant */}
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Drawing Viewer */}
            <DrawingViewer drawing={currentDrawing} onFileUpload={handleFileUpload} />

            {/* Real-time Analysis Panel - Moved up to align with drawing tools */}
            <RealtimeAnalysisPanel 
              drawing={currentDrawing}
              selectedTypes={selectedTakeoffTypes}
              isAnalyzing={isAnalyzing}
              onStartAnalysis={handleRunAnalysis}
            />
          </div>

          {/* AI Chat Widget - Positioned in top right corner of main area */}
          <AIChatWidget />
        </main>
      </div>
    </Layout>
  );
}