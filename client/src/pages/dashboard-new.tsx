import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import DrawingViewer from "@/components/drawing-viewer";
import InteractiveFloorPlan from "@/components/interactive-floor-plan";
import VerticalTakeoffSelector from "@/components/vertical-takeoff-selector";
import OrganizedTakeoffPanel from "@/components/organized-takeoff-panel";
import { CollapsibleTakeoffSelector } from "@/components/collapsible-takeoff-selector";
import { ElementListPanel } from "@/components/element-list-panel";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { VerticalToolPalette, type ToolType } from "@/components/VerticalToolPalette";
import { TakeoffSelectionModal } from "@/components/TakeoffSelectionModal";
import { MeasurementCategoryDialog } from "@/components/MeasurementCategoryDialog";
import { ReportGeneratorComponent } from "@/components/report-generator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CalibrationTool from "@/components/calibration-tool";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createApiUrl, createMlUrl } from "@/config/api";
import { Download, Ruler, Square, Hash, MessageSquare, PanelLeft, PanelRight, Hand, FileText, ChevronDown, Keyboard, Sparkles } from "lucide-react";
import type { Drawing, Project } from "@shared/schema";
import { useDetectionsStore } from "@/store/useDetectionsStore";
import type { Detection } from "@/store/useDetectionsStore";
import { useStore, type Detection as StoreDetection } from "@/store/useStore";
import { recalculateDimensions } from "@/utils/dimensionCalculator";
import { toPairs } from "@/utils/geometry";
import { compressImage, formatFileSize } from "@/utils/imageOptimizer";
import { AnalysisLoading } from "@/components/analysis-loading";
import { useMeasurementStore } from "@/store/useMeasurementStore";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { SettingsPanel } from "@/components/settings-panel";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import {
  calculateDistance,
  calculateArea,
  pixelsToRealWorld,
  formatMeasurement,
} from "@/utils/measurementUtils";

const isDetection = (value: unknown): value is Detection => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Detection;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.cls === "string" &&
    Array.isArray(candidate.points)
  );
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedTakeoffTypes, setSelectedTakeoffTypes] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showAnalysisButtonPulse, setShowAnalysisButtonPulse] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'view' | 'annotate'>('view');
  const [activeTool, setActiveTool] = useState<'ruler' | 'area' | 'count' | null>(null);
  const [selectedScale, setSelectedScale] = useState("1/4\" = 1'");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);
  const [customPixelsPerFoot, setCustomPixelsPerFoot] = useState<number | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activePaletteTool, setActivePaletteTool] = useState<ToolType>('select');
  const [showTakeoffModal, setShowTakeoffModal] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [pendingMeasurement, setPendingMeasurement] = useState<{
    points: [number, number][];
    type: 'distance' | 'area';
    value: number;
    label: string;
  } | null>(null);

  const { toast } = useToast();
  
  // Keyboard shortcut: Ctrl+L to toggle right panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setIsRightPanelCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // MODIFICATION: The Zustand hook is now called at the top level, which is correct.
  const setDetections = useDetectionsStore(s => s.setDetections);
  
  // Undo/Redo from store with toast feedback
  const undoStore = useStore(s => s.undo);
  const redoStore = useStore(s => s.redo);
  const canUndo = useStore(s => s.canUndo);
  const canRedo = useStore(s => s.canRedo);
  
  const undo = () => {
    undoStore();
    toast({
      title: "Undone",
      description: "Previous action has been undone",
      duration: 2000,
    });
  };
  
  const redo = () => {
    redoStore();
    toast({
      title: "Redone",
      description: "Action has been redone",
      duration: 2000,
    });
  };
  
  // Measurement store
  const {
    measurementMode,
    setMeasurementMode,
    addMeasurement,
    updateCurrentMeasurement,
  } = useMeasurementStore();
  
  // Debug: Log when measurementMode changes
  useEffect(() => {
    console.log('[Dashboard] measurementMode changed to:', measurementMode);
  }, [measurementMode]);

  // Pulse AI Analysis button for 3 seconds when drawing is uploaded
  useEffect(() => {
    if (currentDrawing && !analysisResults) {
      setShowAnalysisButtonPulse(true);
      const timer = setTimeout(() => {
        setShowAnalysisButtonPulse(false);
      }, 3000); // Stop after 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowAnalysisButtonPulse(false);
    }
  }, [currentDrawing, analysisResults]);
  
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  
  // Keyboard shortcuts for measurement tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keys if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (measurementMode && !isTyping) {
        if (e.key === 'Escape') {
          // Cancel current measurement
          setMeasurementPoints([]);
          updateCurrentMeasurement([]);
          setMeasurementMode(null);
          setActivePaletteTool('select');
          toast({
            title: "Measurement Cancelled",
            description: "Press Measure to start again",
          });
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          // Remove last vertex (only if not typing in a dialog)
          if (measurementPoints.length > 0) {
            e.preventDefault(); // Prevent browser back navigation
            const newPoints = measurementPoints.slice(0, -1);
            setMeasurementPoints(newPoints);
            updateCurrentMeasurement(newPoints);
            toast({
              title: "Vertex Removed",
              description: `${newPoints.length} point${newPoints.length !== 1 ? 's' : ''} remaining`,
            });
          }
        } else if (e.key === 'Enter' && measurementMode === 'area' && measurementPoints.length >= 3) {
          // Complete area measurement
          completeMeasurement(measurementPoints);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [measurementMode, measurementPoints]);
  
  // NOTE: Real-time dimension updates are now handled in OrganizedTakeoffPanel
  // by reading directly from the store, avoiding re-renders that break editing
  
  const getPixelsPerFoot = (scale: string): number => {
    const scaleMap: { [key: string]: number } = {
      '1/4" = 1\'': 48,
      '1/8" = 1\'': 24,
      '1/2" = 1\'': 96,
      '1" = 1\'': 192,
    };
    return scaleMap[scale] || 48;
  };

  const handleRunAnalysis = async () => {
    if (!currentDrawing || !currentDrawing.fileUrl) {
      toast({ title: "No Drawing", description: "Please upload a drawing first.", variant: "destructive" });
      return;
    }
    const typesToAnalyze = selectedTakeoffTypes.length > 0 ? selectedTakeoffTypes : ['flooring', 'openings', 'walls'];
    if (typesToAnalyze.length === 0) {
      toast({ title: "No Selection", description: "Please select at least one takeoff type.", variant: "destructive" });
      return;
    }

    const startTime = performance.now();
    console.log('[Analysis] Starting analysis...');
    
    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const fetchStart = performance.now();
      const response = await fetch(currentDrawing.fileUrl);
      const imageBlob = await response.blob();
      const imageFile = new File([imageBlob], currentDrawing.filename!, { type: imageBlob.type });
      console.log(`[Analysis] Image fetch took ${(performance.now() - fetchStart).toFixed(0)}ms`);

      // Use custom calibrated scale if available, otherwise use standard scale
      let scaleValue: number;
      if (customPixelsPerFoot) {
        // Custom calibration: convert pixels per foot to scale factor
        // Assuming 96 DPI: scale = pixels_per_foot / 96
        scaleValue = customPixelsPerFoot / 96;
      } else {
        // Convert scale string to numeric value (e.g., "1/4\" = 1'" -> 0.25)
        const scaleMap: { [key: string]: number } = {
          '1/4" = 1\'': 0.25,
          '1/8" = 1\'': 0.125,
          '1/2" = 1\'': 0.5,
          '1" = 1\'': 1.0,
        };
        scaleValue = scaleMap[selectedScale] || 0.25;
      }

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('types', JSON.stringify(typesToAnalyze));
      formData.append('scale', scaleValue.toString());

      console.log('[Analysis] Sending request to ML service:', createMlUrl('/analyze'));
      const mlStart = performance.now();
      const results = await apiRequest(createMlUrl('/analyze'), 'POST', formData, true);
      console.log(`[Analysis] ML inference took ${(performance.now() - mlStart).toFixed(0)}ms`);

      setAnalysisResults(results);

      // MODIFICATION: The hook itself is removed from here. We now call the 'setDetections' function.
      if (results && results.predictions) {
        // We can flatten all predictions from different categories into one array for the store
        const allPredictions = Object.values(results.predictions)
          .flat()
          .filter((item): item is Detection => isDetection(item));

        // Preserve manual rooms (from measurement tool) when updating detections
        const currentDetections = useDetectionsStore.getState().detections;
        const manualRooms = currentDetections.filter((d: any) => d.isManual);
        
        // Combine AI predictions with manual rooms
        setDetections([...allPredictions, ...manualRooms]);

        // Save analysis results to database as takeoffs
        try {
          const saveStart = performance.now();
          await apiRequest(createApiUrl(`/api/drawings/${currentDrawing.id}/analysis`), 'POST', {
            results: results,
            scale: scaleValue
          });
          console.log(`[Analysis] Saving to DB took ${(performance.now() - saveStart).toFixed(0)}ms`);

          // Invalidate takeoffs query to refresh the takeoff panel
          queryClient.invalidateQueries({ queryKey: ["/api/drawings", currentDrawing.id, "takeoffs"] });
        } catch (saveError) {
          console.error("Failed to save analysis results:", saveError);
          // Don't show error to user as the analysis itself succeeded
        }
      } else {
        setDetections([]); // Clear detections if the analysis returns no predictions
      }

      const totalTime = performance.now() - startTime;
      console.log(`[Analysis] ✅ Total analysis time: ${totalTime.toFixed(0)}ms (${(totalTime / 1000).toFixed(1)}s)`);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${typesToAnalyze.length} element types in ${(totalTime / 1000).toFixed(1)}s`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createNewProject = async (drawingName: string): Promise<Project> => {
    const projectData = { name: `Project - ${drawingName}`, description: `Auto-generated project for ${drawingName}`, status: "active" };
    const project = await apiRequest(createApiUrl("/api/projects"), "POST", projectData);
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    return project;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setCurrentDrawing(null);
    setAnalysisResults(null);
    setDetections([]); // Clear previous detections on new upload

    try {
      // Optimize image before upload
      setUploadProgress('Optimizing image...');
      const originalSize = formatFileSize(file.size);
      const optimizedFile = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.85,
        maxSizeMB: 5
      });
      const newSize = formatFileSize(optimizedFile.size);
      console.log(`Image optimized: ${originalSize} → ${newSize}`);
      
      setUploadProgress('Uploading to server...');
      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      const uploadResult = await apiRequest(createApiUrl('/api/upload'), 'POST', uploadFormData, true);

      let projectToUse = currentProject || await createNewProject(file.name);
      setCurrentProject(projectToUse);

      const drawingData = {
        projectId: projectToUse.id,
        name: file.name,
        filename: uploadResult.filename,
        fileUrl: uploadResult.fileUrl,
        fileType: file.type,
        status: "complete",
        scale: selectedScale,
        aiProcessed: false
      };
      const savedDrawing = await apiRequest(createApiUrl(`/api/projects/${projectToUse.id}/drawings`), "POST", drawingData);

      setCurrentDrawing(savedDrawing);
      toast({ title: "Upload Successful", description: "Select takeoff types and click 'Run AI Analysis'." });
    } catch (error) {
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "An unknown error occurred", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleElementVisibilityToggle = (elementId: string, visible: boolean) => {
    console.log(`[Dashboard] Eye button clicked! Element ${elementId} (type: ${typeof elementId}) visibility changed to ${visible}`);
    setHiddenElements(prevHidden => {
      const newHidden = new Set(prevHidden);
      // Ensure elementId is a string
      const idStr = String(elementId);
      if (visible) {
        newHidden.delete(idStr);
        console.log(`[Dashboard] Removed ${idStr} from hidden set`);
      } else {
        newHidden.add(idStr);
        console.log(`[Dashboard] Added ${idStr} to hidden set`);
      }
      console.log(`[Dashboard] Hidden elements:`, Array.from(newHidden));
      console.log(`[Dashboard] Hidden elements count: ${newHidden.size}`);
      return newHidden;
    });
  };

  const handleElementDelete = (elementId: string) => {
    // Remove from useStore (canvas detections)
    const removeDetection = useStore.getState().removeDetection;
    removeDetection(elementId);
    
    // Remove from useDetectionsStore (analysis results)
    const currentDetections = useDetectionsStore.getState().detections;
    useDetectionsStore.getState().setDetections(
      currentDetections.filter(d => d.id !== elementId)
    );
    
    // Remove from analysisResults
    if (analysisResults?.predictions) {
      setAnalysisResults({
        ...analysisResults,
        predictions: {
          ...analysisResults.predictions,
          rooms: analysisResults.predictions.rooms?.filter((r: any) => r.id !== elementId) || [],
          walls: analysisResults.predictions.walls?.filter((w: any) => w.id !== elementId) || [],
          openings: analysisResults.predictions.openings?.filter((o: any) => o.id !== elementId) || [],
        }
      });
    }
    
    // Remove from hidden elements set if present
    setHiddenElements(prev => {
      const newHidden = new Set(prev);
      newHidden.delete(elementId);
      return newHidden;
    });
    
    console.log('Deleted element:', elementId);
  };

  const handleElementRename = (elementId: string, newName: string) => {
    // Update in analysisResults
    if (analysisResults?.predictions) {
      const updateElementName = (elements: any[]) => 
        elements?.map((el: any) => el.id === elementId ? { ...el, name: newName } : el) || [];

      setAnalysisResults({
        ...analysisResults,
        predictions: {
          ...analysisResults.predictions,
          rooms: updateElementName(analysisResults.predictions.rooms),
          walls: updateElementName(analysisResults.predictions.walls),
          openings: updateElementName(analysisResults.predictions.openings),
        }
      });
    }
    
    console.log('Renamed element:', elementId, 'to', newName);
  };

  const completeMeasurement = (points: [number, number][]) => {
    const pixelsPerFoot = customPixelsPerFoot || getPixelsPerFoot(selectedScale);
    
    if (measurementMode === 'distance' && points.length === 2) {
      const distancePixels = calculateDistance(points[0], points[1]);
      const distanceFeet = pixelsToRealWorld(distancePixels, pixelsPerFoot, false);
      const label = formatMeasurement(distanceFeet, 'distance');
      
      // For distance, auto-show dialog
      setPendingMeasurement({
        points,
        type: 'distance',
        value: distanceFeet,
        label,
      });
      setShowCategoryDialog(true);
    } else if (measurementMode === 'area' && points.length >= 3) {
      const areaPixels = calculateArea(points);
      const areaSqFt = pixelsToRealWorld(areaPixels, pixelsPerFoot, true);
      const label = formatMeasurement(areaSqFt, 'area');
      
      // For area, save pending but DON'T show dialog yet (wait for right-click)
      setPendingMeasurement({
        points,
        type: 'area',
        value: areaSqFt,
        label,
      });
      
      // Keep the area visible by updating current measurement
      updateCurrentMeasurement(points);
      
      toast({
        title: "Area Drawn",
        description: "Right-click inside the area to categorize it",
      });
    }
    
    setMeasurementPoints([]);
  };

  const handleMeasurementRightClick = () => {
    if (pendingMeasurement && pendingMeasurement.type === 'area') {
      setShowCategoryDialog(true);
    }
  };

  const handleMeasurementConfirm = (category: string, name: string) => {
    if (!pendingMeasurement) return;
    
    const measurementId = uuidv4();
    
    // Define colors for each category
    const categoryColors: { [key: string]: string } = {
      room: '#10B981',      // Green for rooms
      wall: '#3B82F6',      // Blue for walls
      flooring: '#8B5CF6',  // Purple for flooring
      other: '#EC4899',     // Pink for other
    };
    
    // For area measurements, add as detection (appears in right panel with toolbar)
    if (pendingMeasurement.type === 'area') {
      const pixelsPerFoot = customPixelsPerFoot || getPixelsPerFoot(selectedScale);
      const areaPixels = calculateArea(pendingMeasurement.points);
      const areaSqFt = pixelsToRealWorld(areaPixels, pixelsPerFoot, true);
      
      const newStoreDetection: any = {
        id: measurementId,
        cls: category, // Use the category as the class (room, wall, flooring, other)
        points: pendingMeasurement.points,
        label: name || category,
        isManual: true,
        color: categoryColors[category] || '#4ecdc4', // Assign color based on category
      };
      
      // Add to useStore for EditableOverlay (this gives it the draggable toolbar)
      const { setDetections: setStoreDetections, detections: storeDetections } = useStore.getState();
      setStoreDetections([...storeDetections, newStoreDetection]);
      
      // Also add to useDetectionsStore with isManual flag (so it persists through analysis)
      const newDetection: any = {
        id: measurementId,
        cls: category,
        class: name || category,
        points: pendingMeasurement.points,
        isManual: true,
        color: categoryColors[category] || '#4ecdc4',
        display: {
          area_sqft: areaSqFt,
          perimeter_ft: 0,
        }
      };
      const currentDetections = useDetectionsStore.getState().detections;
      useDetectionsStore.getState().setDetections([...currentDetections, newDetection]);
    } else {
      // For distance measurements, save to measurement store
      const color = categoryColors[category] || '#ff6b6b';
      
      const newMeasurement = {
        id: measurementId,
        type: pendingMeasurement.type,
        points: pendingMeasurement.points,
        value: pendingMeasurement.value,
        label: name || pendingMeasurement.label,
        color,
        category,
        name,
      };
      
      addMeasurement(newMeasurement);
    }
    
    // Reset all measurement state to allow creating new measurements
    setPendingMeasurement(null);
    setShowCategoryDialog(false);
    setMeasurementPoints([]);
    
    // Clear any selection mode in the store to prevent editing mode conflicts
    const { setSelectionMode, clearSelectedVertices } = useStore.getState();
    setSelectionMode('normal');
    clearSelectedVertices(); // Deselect all vertices after saving
    
    // Re-initialize currentMeasurement with the correct type for next measurement
    // This ensures the preview will work for the next measurement
    if (measurementMode) {
      updateCurrentMeasurement([]);
      // Or better: reinitialize with type
      const { setCurrentMeasurement } = useMeasurementStore.getState();
      setCurrentMeasurement({ type: measurementMode, points: [] });
    }
    
    console.log('[Dashboard] Measurement saved, ready for next measurement. Mode:', measurementMode);
    
    toast({
      title: "Measurement Saved",
      description: `${pendingMeasurement.type === 'distance' ? 'Distance' : 'Area'} measurement added as ${category}`,
    });
  };

  const handleMeasurementCancel = () => {
    setPendingMeasurement(null);
    setShowCategoryDialog(false);
    updateCurrentMeasurement([]); // Clear the preview
  };

  const handleToolChange = (tool: ToolType) => {
    console.log('[Dashboard] Tool changed to:', tool);
    
    if (tool === 'settings') {
      setShowSettingsPanel(true);
    } else if (tool === 'pan') {
      setActivePaletteTool(tool);
      setIsPanMode(true);
      // Keep measurement mode and points active so user can pan and return to measuring
      // Don't clear measurementMode or measurementPoints
    } else if (tool === 'measure') {
      setActivePaletteTool(tool);
      setIsPanMode(false);
      // Always ensure measurement mode is set when activating measure tool
      if (!measurementMode) {
        setMeasurementMode('distance');
      }
    } else if (tool === 'select') {
      console.log('[Dashboard] Select tool activated - clearing measurement mode');
      setActivePaletteTool(tool);
      setIsPanMode(false);
      setMeasurementMode(null);
      setMeasurementPoints([]);
      updateCurrentMeasurement([]);
    } else {
      setActivePaletteTool(tool);
      setIsPanMode(false);
      setMeasurementMode(null);
      setMeasurementPoints([]);
      updateCurrentMeasurement([]);
      // TODO: Implement tool-specific logic
    }
  };

  return (
    <Layout>
      <div className="flex h-full overflow-hidden">
        {/* Vertical Tool Palette */}
        <div className="hidden lg:flex">
          <VerticalToolPalette
            activeTool={activePaletteTool}
            onToolChange={handleToolChange}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-background border-b border-border px-4 lg:px-6 py-3">
            <div className="flex items-center">
              {/* Mobile Left Panel - Takeoff Selector */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                    <PanelLeft className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Takeoff Types Menu</SheetTitle>
                    <SheetDescription>Select building elements to detect and measure from this list.</SheetDescription>
                  </SheetHeader>
                  <VerticalTakeoffSelector
                    selectedTypes={selectedTakeoffTypes}
                    onSelectionChange={setSelectedTakeoffTypes}
                    onRunAnalysis={handleRunAnalysis}
                    isAnalyzing={isAnalyzing}
                  />
                </SheetContent>
              </Sheet>

              {/* Mobile Tool Palette */}
              <div className="lg:hidden flex items-center gap-1 mr-2 bg-muted rounded-lg p-1">
                <Button
                  variant={activePaletteTool === 'select' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToolChange('select')}
                >
                  <Hand className="w-4 h-4" />
                </Button>
                <Button
                  variant={activePaletteTool === 'measure' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToolChange('measure')}
                >
                  <Ruler className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {currentProject && (
                  <span className="text-sm font-medium text-foreground">{currentProject.name}</span>
                )}
                {currentProject && currentDrawing && (
                  <span className="text-muted-foreground">/</span>
                )}
                {currentDrawing && (
                  <span className="text-sm text-muted-foreground">{currentDrawing.name}</span>
                )}
                {!currentProject && !currentDrawing && (
                  <span className="text-sm text-muted-foreground">No drawing selected</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                {/* AI Analysis Button - Primary Action */}
                <Button
                  onClick={() => setShowTakeoffModal(true)}
                  className={cn(
                    "hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-105",
                    showAnalysisButtonPulse && "animate-pulse"
                  )}
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Analysis
                </Button>

                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="hidden sm:flex bg-green-600 hover:bg-green-700 text-white"
                      disabled={!currentProject || !currentDrawing}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Generate Report</DialogTitle>
                    </DialogHeader>
                    {currentProject && currentDrawing ? (
                      <ReportGeneratorComponent
                        project={currentProject}
                        takeoffs={[]}
                        drawings={[currentDrawing]}
                        analyses={[]}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Please select a project and drawing first.</p>
                    )}
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline"
                  size="sm" 
                  className="hidden sm:flex bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden ml-auto">
                    <PanelRight className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-full sm:w-96">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Organized Takeoff Panel</SheetTitle>
                    <SheetDescription>View organized takeoffs by location, type, or trade.</SheetDescription>
                  </SheetHeader>
                  <OrganizedTakeoffPanel
                    drawing={currentDrawing}
                    selectedTypes={selectedTakeoffTypes}
                    isAnalyzing={isAnalyzing}
                    onStartAnalysis={handleRunAnalysis}
                    analysisResults={analysisResults}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex-1 relative bg-muted/30 flex flex-col border-border p-2 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-4">
                <div className="flex items-center space-x-2">
                  {!customPixelsPerFoot ? (
                    <>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Scale:</span>
                      <select className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground" value={selectedScale} onChange={(e) => setSelectedScale(e.target.value)} disabled={isCalibrating}>
                        <option>1/4" = 1'</option>
                        <option>1/8" = 1'</option>
                        <option>1/2" = 1'</option>
                        <option>1" = 1'</option>
                      </select>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Calibrated:</span>
                      <span className="text-xs font-medium text-primary">{customPixelsPerFoot.toFixed(1)} px/ft</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomPixelsPerFoot(null)}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </div>
                <CalibrationTool
                  isActive={isCalibrating}
                  points={calibrationPoints}
                  onActivate={() => {
                    setIsCalibrating(true);
                    setIsPanMode(false);
                  }}
                  onComplete={(pixelsPerFoot) => {
                    setCustomPixelsPerFoot(pixelsPerFoot);
                    setIsCalibrating(false);
                    setCalibrationPoints([]);
                    toast({
                      title: "Calibration Complete",
                      description: `Scale set to ${pixelsPerFoot.toFixed(1)} pixels per foot`,
                    });
                  }}
                  onCancel={() => {
                    setIsCalibrating(false);
                    setCalibrationPoints([]);
                  }}
                />
                
                {/* Measurement Mode Dropdown - only show when measure tool is active */}
                {activePaletteTool === 'measure' && measurementMode && (
                  <div className="ml-4">
                    <select 
                      className="text-xs bg-background border border-border rounded px-3 py-1.5 text-foreground h-8"
                      value={measurementMode}
                      onChange={(e) => setMeasurementMode(e.target.value as 'distance' | 'area')}
                    >
                      <option value="distance">📏 Distance</option>
                      <option value="area">📐 Area</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {isAnalyzing ? (
              <div className="flex-1 flex items-center justify-center">
                <AnalysisLoading stage="analyzing" />
              </div>
            ) : (
              <>
                <InteractiveFloorPlan
                  drawing={currentDrawing}
                  highlightedElement={selectedElementId}
                  activeViewMode={activeViewMode}
                  activeTool={activeTool}
                  selectedScale={selectedScale}
                  onElementClick={setSelectedElementId}
                  onMeasurement={() => { }}
                  analysisResults={analysisResults}
                  isCalibrating={isCalibrating}
                  calibrationPoints={calibrationPoints}
                  isPanMode={isPanMode}
                  hiddenElements={hiddenElements}
                  measurementMode={measurementMode}
                  onMeasurementClick={(point) => {
                    // Don't add points while in pan mode
                    if (isPanMode) {
                      return;
                    }
                    
                    console.log('[Dashboard] Measurement click. Current points:', measurementPoints.length, 'Adding:', point);
                    const newPoints = [...measurementPoints, point];
                    setMeasurementPoints(newPoints);
                    updateCurrentMeasurement(newPoints);
                    console.log('[Dashboard] New points array:', newPoints.length);
                    
                    // Auto-complete distance measurement after 2 points
                    if (measurementMode === 'distance' && newPoints.length === 2) {
                      completeMeasurement(newPoints);
                    }
                  }}
                  onMeasurementComplete={() => {
                    // Complete area measurement
                    if (measurementMode === 'area' && measurementPoints.length >= 3) {
                      completeMeasurement(measurementPoints);
                    }
                  }}
                  onMeasurementRightClick={handleMeasurementRightClick}
                  onCalibrationClick={(x, y) => {
                    if (calibrationPoints.length < 2) {
                      setCalibrationPoints([...calibrationPoints, { x, y }]);
                    }
                  }}
                />

                {!currentDrawing && (
                  <DrawingViewer 
                    drawing={null} 
                    onFileUpload={handleFileUpload} 
                    isUploading={isUploading}
                  />
                )}
                
                {isUploading && uploadProgress && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
                      <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <CollapsiblePanel
          side="right"
          expandedWidth={384}
          collapsedWidth={64}
          collapsed={isRightPanelCollapsed}
          onCollapsedChange={setIsRightPanelCollapsed}
          className="hidden lg:flex flex-col"
        >

          <ElementListPanel
            analysisResults={analysisResults}
            onElementVisibilityToggle={handleElementVisibilityToggle}
            onElementSelect={setSelectedElementId}
            onElementDelete={handleElementDelete}
            onElementRename={handleElementRename}
            selectedElementId={selectedElementId}
            hiddenElements={hiddenElements}
          />
        </CollapsiblePanel>
      </div>

      {/* Takeoff Selection Modal */}
      <TakeoffSelectionModal
        open={showTakeoffModal}
        onOpenChange={setShowTakeoffModal}
        selectedTypes={selectedTakeoffTypes}
        onSelectionChange={setSelectedTakeoffTypes}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
      />

      {/* Measurement Category Dialog */}
      {pendingMeasurement && (
        <MeasurementCategoryDialog
          open={showCategoryDialog}
          onOpenChange={setShowCategoryDialog}
          measurementType={pendingMeasurement.type}
          measurementValue={pendingMeasurement.label}
          onConfirm={handleMeasurementConfirm}
          onCancel={handleMeasurementCancel}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettingsPanel}
        onOpenChange={setShowSettingsPanel}
        onShowShortcuts={() => setShowShortcutsDialog(true)}
        onShowTakeoffSelection={() => setShowTakeoffModal(true)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcutsDialog} 
        onOpenChange={setShowShortcutsDialog} 
      />
    </Layout>
  );
}
