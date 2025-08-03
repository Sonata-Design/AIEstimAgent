import { useState } from "react";
import Layout from "@/components/layout";
import DrawingViewer from "@/components/drawing-viewer";
import VerticalTakeoffSelector from "@/components/vertical-takeoff-selector";
import LLMTakeoffProcessor from "@/components/llm-takeoff-processor";
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

  const { toast } = useToast();

  const handleRunAnalysis = () => {
    if (selectedTakeoffTypes.length === 0) {
      toast({
        title: "No takeoff types selected",
        description: "Please select at least one element type to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${selectedTakeoffTypes.length} element types.`,
      });
    }, 5000);
  };

  // Use a sample drawing for demonstration
  const sampleDrawing: Drawing = {
    id: "sample-1",
    projectId: "proj-1", 
    name: "Ground Floor Plan",
    filename: "ground-floor.pdf",
    fileSize: 2048000,
    uploadedAt: new Date().toISOString(),
    status: "complete",
    aiProcessed: true
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
          {/* Project Actions Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {currentProject?.name || "No Project Selected"}
                </h2>
                {currentProject && (
                  <span className="text-sm text-slate-500">
                    {drawings.length} drawing{drawings.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blueprint-600 hover:bg-blueprint-700" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dashboard-project-name">Project Name</Label>
                      <Input
                        id="dashboard-project-name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-project-location">Location</Label>
                      <Input
                        id="dashboard-project-location"
                        value={newProject.location || ""}
                        onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                        placeholder="Enter project location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-project-client">Client</Label>
                      <Input
                        id="dashboard-project-client"
                        value={newProject.client || ""}
                        onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-project-description">Description</Label>
                      <Input
                        id="dashboard-project-description"
                        value={newProject.description || ""}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Enter project description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-project-status">Status</Label>
                      <select
                        id="dashboard-project-status"
                        value={newProject.status}
                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleCreateProject}
                        disabled={createProjectMutation.isPending}
                        className="flex-1 bg-blueprint-600 hover:bg-blueprint-700"
                      >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Drawing Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-slate-900">
                  {selectedDrawing?.name || "Select a drawing"}
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
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Controls */}
                <div className="flex items-center bg-white rounded-lg p-1 border">
                  <Button variant="ghost" size="sm" className="bg-blueprint-50 text-blueprint-700 text-xs">
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 text-xs">
                    Annotate
                  </Button>
                </div>
                
                {/* AI Takeoff Button */}
                <Dialog open={isTakeoffDialogOpen} onOpenChange={setIsTakeoffDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700" 
                      size="sm"
                      disabled={!selectedDrawing}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Run AI Takeoff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>AI Takeoff Analysis</DialogTitle>
                    </DialogHeader>
                    {selectedDrawing && (
                      <TakeoffTypeSelector 
                        drawing={selectedDrawing} 
                        onComplete={() => setIsTakeoffDialogOpen(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {/* Export */}
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Drawing Viewer */}
            <DrawingViewer drawing={selectedDrawing} />

            {/* Enhanced LLM Takeoff Panel */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">AI Takeoff Analysis</h2>
                <p className="text-sm text-slate-600">Advanced LLM-powered floorplan analysis</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedDrawing ? (
                  <LLMTakeoffProcessor 
                    drawing={selectedDrawing} 
                    onAnalysisComplete={() => {
                      // Refresh takeoff data after analysis
                    }}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-sm text-slate-600">Select a drawing to begin AI analysis</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
