import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import ProjectSidebar from "@/components/project-sidebar";
import DrawingViewer from "@/components/drawing-viewer";
import TakeoffPanel from "@/components/takeoff-panel";
import { Button } from "@/components/ui/button";
import { 
  Settings,
  Download,
  Ruler,
  Square,
  Hash
} from "lucide-react";
import type { Project, Drawing } from "@shared/schema";

export default function Dashboard() {
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: drawings = [], isLoading: drawingsLoading } = useQuery({
    queryKey: ["/api/projects", currentProject?.id, "drawings"],
    enabled: !!currentProject?.id,
  });

  // Set first project as current if none selected
  if (projects && projects.length > 0 && !currentProject) {
    setCurrentProject(projects[0]);
  }

  // Set first drawing as selected if none selected
  if (drawings && drawings.length > 0 && !selectedDrawing) {
    setSelectedDrawing(drawings[0]);
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Sidebar */}
        <ProjectSidebar
          currentProject={currentProject}
          setCurrentProject={setCurrentProject}
          drawings={drawings}
          selectedDrawing={selectedDrawing}
          setSelectedDrawing={setSelectedDrawing}
          isLoading={projectsLoading || drawingsLoading}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-slate-900">
                  {selectedDrawing?.name || "Select a drawing"}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">Scale:</span>
                  <select className="text-sm border border-slate-300 rounded px-2 py-1">
                    <option>1/4" = 1'</option>
                    <option>1/8" = 1'</option>
                    <option>1/2" = 1'</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Controls */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <Button variant="ghost" size="sm" className="bg-white text-slate-900 shadow-sm">
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600">
                    Annotate
                  </Button>
                </div>
                
                {/* Measurement Tools */}
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
                
                {/* Export */}
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Drawing Viewer */}
            <DrawingViewer drawing={selectedDrawing} />

            {/* Takeoff Results Panel */}
            <TakeoffPanel drawing={selectedDrawing} />
          </div>
        </main>
      </div>
    </Layout>
  );
}
