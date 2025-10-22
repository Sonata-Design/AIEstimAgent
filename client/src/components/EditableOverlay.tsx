import React from "react"
import { Stage, Layer, Line, Circle } from "react-konva"
import { v4 as uuidv4 } from "uuid"
import { useStore, type Point, type Detection, type SelectedVertex } from "../store/useStore"
import { useSettingsStore } from "../store/useSettingsStore"
import { toPairs } from "../utils/geometry"
import { smartSimplify } from "../utils/polygonUtils"
import DraggableToolbar from "./DraggableToolbar"
import SelectionBox from "./SelectionBox"
import { MeasurementLayer } from "./MeasurementLayer"
import { useMeasurementStore } from "../store/useMeasurementStore"
import { DETECTION_COLORS, OPACITY, getDetectionColor } from "../config/colors"

type Props = { 
  width: number; 
  height: number;
  scale?: number; // Canvas scale for inverse scaling of UI elements
  measurementMode?: 'distance' | 'area' | null;
  onMeasurementClick?: (point: Point) => void;
  onMeasurementComplete?: () => void;
  onMeasurementRightClick?: () => void;
  hiddenElements?: Set<string>;
}
const STROKE_WIDTH = 2
const STROKE_WIDTH_HOVER = 4
const BASE_VERTEX_RADIUS = 6
const BASE_VERTEX_RADIUS_SELECTED = 8

export default function EditableOverlay({ 
  width, 
  height, 
  scale = 1,
  measurementMode = null,
  onMeasurementClick,
  onMeasurementComplete,
  onMeasurementRightClick,
  hiddenElements = new Set()
}: Props) {
  const {
    detections, setDetections, updateDetection,
    selectionMode, selectedVertices, isSelecting, selectionStart, selectionEnd,
    setSelectionMode, clearSelectedVertices, toggleVertexSelection,
    setIsSelecting, setSelectionStart, setSelectionEnd, selectVerticesInArea,
    deleteSelectedVertices, simplifySelectedVertices, hoveredDetectionId, setHoveredDetectionId
  } = useStore()
  
  // Get snap-to-grid settings
  const { snapToGrid, gridSize } = useSettingsStore()
  
  const [selectedPolygonId, setSelectedPolygonId] = React.useState<number | string | null>(null)
  const stageRef = React.useRef<any>(null)
  
  // Helper function to snap coordinates to grid
  const snapToGridPoint = (x: number, y: number): [number, number] => {
    if (!snapToGrid) return [x, y]
    return [
      Math.round(x / gridSize) * gridSize,
      Math.round(y / gridSize) * gridSize
    ]
  }
  
  // Get measurements from store
  const measurements = useMeasurementStore(state => state.measurements);
  const currentMeasurement = useMeasurementStore(state => state.currentMeasurement);
  const removeMeasurement = useMeasurementStore(state => state.removeMeasurement);
  
  // Clear polygon selection when entering measurement mode
  React.useEffect(() => {
    if (measurementMode) {
      setSelectedPolygonId(null)
    }
  }, [measurementMode])
  
  // Use inverse scale for UI elements to keep them constant size
  const inverseScale = 1 / scale


  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return // Only handle when not in input fields
      
      switch (e.key) {
        case 'Escape':
          setSelectionMode('normal')
          clearSelectedVertices()
          setSelectedPolygonId(null)
          break
        case 'Delete':
        case 'Backspace':
          if (selectedVertices.length > 0) {
            e.preventDefault()
            deleteSelectedVertices()
          }
          break
        case 's':
          if (e.ctrlKey && selectedVertices.length > 0) {
            e.preventDefault()
            simplifySelectedVertices(3) // Default tolerance
          }
          break
        case 'a':
          if (e.ctrlKey) {
            e.preventDefault()
            setSelectionMode(selectionMode === 'multi-select' ? 'normal' : 'multi-select')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectionMode, selectedVertices, setSelectionMode, clearSelectedVertices, deleteSelectedVertices, simplifySelectedVertices])

  // --- selection helpers ---
  const isPolygonSelected = (d: Detection) => d.id === selectedPolygonId
  const clearPolygonSelection = () => setSelectedPolygonId(null)

  const isVertexSelected = (detectionId: string | number, vertexIndex: number) => {
    return selectedVertices.some(sv => 
      sv.detectionId === detectionId && sv.vertexIndex === vertexIndex
    )
  }

  // --- vertex ops ---
  const onVertexDrag = (d: Detection, vi: number, x: number, y: number) => {
    const pts = toPairs(d.points)
    // Apply snap-to-grid if enabled
    const [snappedX, snappedY] = snapToGridPoint(x, y)
    pts[vi] = [snappedX, snappedY]
    updateDetection(d.id as any, { points: pts })
    
    // Trigger dimension recalculation (will be handled by parent component)
    // The parent should listen to detection changes and recalculate dimensions
  }

  const nearestEdgeIndex = (pts: Point[], x: number, y: number) => {
    let bestI = 0, best = Infinity
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      const dist = pointToSegmentDistance([x, y], a, b)
      if (dist < best) { best = dist; bestI = i }
    }
    return bestI
  }

  const insertPointAt = (d: Detection, x: number, y: number) => {
    const pts = toPairs(d.points)
    if (pts.length < 2) return
    const i = nearestEdgeIndex(pts, x, y)
    const out = [...pts.slice(0, i + 1), [x, y] as Point, ...pts.slice(i + 1)]
    updateDetection(d.id as any, { points: out })
  }

  const removeVertex = (d: Detection, vi: number) => {
    const pts = toPairs(d.points)
    if (pts.length <= 3) return // keep polygon valid
    pts.splice(vi, 1)
    updateDetection(d.id as any, { points: pts })
  }

  // --- polygon ops ---
  const deletePolygon = (id: Detection["id"]) => {
    const next = detections.filter((x) => x.id !== id)
    setDetections(next)
    clearPolygonSelection()
    clearSelectedVertices()
  }

  const copyPolygon = (d: Detection) => {
    const pts = toPairs(d.points)
    const dup: Detection = {
      ...d,
      id: uuidv4(),
      name: (d.name || d.cls) + " Copy",
      points: pts.map(([x, y]) => [x + 10, y + 10] as Point), // slight offset
    }
    setDetections([...detections, dup])
    setSelectedPolygonId(dup.id)
  }

  const doneEditing = () => {
    clearPolygonSelection()
    clearSelectedVertices()
    setSelectionMode('normal')
  }

  const handleSimplify = () => {
    if (selectedVertices.length === 0) return

    // Group by detection and apply smart simplification
    const byDetection = new Map<string | number, number[]>()
    selectedVertices.forEach(sv => {
      if (!byDetection.has(sv.detectionId)) {
        byDetection.set(sv.detectionId, [])
      }
      byDetection.get(sv.detectionId)!.push(sv.vertexIndex)
    })

    const updatedDetections = detections.map(detection => {
      const selectedIndices = byDetection.get(detection.id)
      if (!selectedIndices || selectedIndices.length === 0) return detection
      
      const points = toPairs(detection.points)
      
      // Apply smart simplification with moderate settings
      const simplified = smartSimplify(points, {
        douglasPeuckerTolerance: 3,
        clusterThreshold: 8,
        angleThreshold: 10,
        minPoints: 3
      })
      
      return { ...detection, points: simplified }
    })

    setDetections(updatedDetections)
    clearSelectedVertices()
  }

  // --- stage handlers ---
  const handleStageMouseDown = (e: any) => {
    const stage = stageRef.current
    const pos = stage?.getPointerPosition()
    if (!pos) return

    // If clicking on empty area in multi-select mode, start selection rectangle
    if (selectionMode === 'multi-select' && e.target === stage) {
      setIsSelecting(true)
      setSelectionStart([pos.x, pos.y])
      setSelectionEnd([pos.x, pos.y])
      return
    }

    // Normal mode: clear selections when clicking empty area
    if (e.target === stage) {
      clearPolygonSelection()
      clearSelectedVertices()
    }
  }

  const handleStageDoubleClick = (e: any) => {
    const stage = stageRef.current
    const pos = stage?.getPointerPosition()
    if (!pos) return

    // Double-click on empty area to start selection box (auto-enter multi-select mode)
    if (e.target === stage) {
      setSelectionMode('multi-select')
      setIsSelecting(true)
      setSelectionStart([pos.x, pos.y])
      setSelectionEnd([pos.x, pos.y])
    }
  }

  const handleStageMouseMove = (e: any) => {
    if (!isSelecting) return
    
    const stage = stageRef.current
    const pos = stage?.getPointerPosition()
    if (!pos || !selectionStart) return
    
    setSelectionEnd([pos.x, pos.y])
  }

  const handleStageMouseUp = (e: any) => {
    if (isSelecting && selectionStart && selectionEnd) {
      selectVerticesInArea(selectionStart, selectionEnd)
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }

  const handlePolygonClick = (e: any, d: Detection) => {
    // Allow polygon clicks even in measurement mode (just don't add measurement points)
    // This allows users to select and edit masks while measure tool is active
    
    const stage = stageRef.current
    const pos = stage?.getPointerPosition()
    if (!pos) { 
      setSelectedPolygonId(d.id)
      return 
    }

    if (selectionMode === 'multi-select') {
      // In multi-select mode, don't change polygon selection
      return
    }

    if (e.evt.shiftKey) {
      insertPointAt(d, pos.x, pos.y)
      setSelectedPolygonId(d.id)
    } else {
      setSelectedPolygonId(d.id)
    }
  }

  const handleVertexClick = (e: any, detection: Detection, vertexIndex: number) => {
    e.cancelBubble = true
    
    if (selectionMode === 'multi-select') {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        // Ctrl+click to toggle individual vertex selection
        toggleVertexSelection({ detectionId: detection.id, vertexIndex })
      } else {
        // Single click in multi-select mode
        toggleVertexSelection({ detectionId: detection.id, vertexIndex })
      }
    }
  }

  const handleVertexDoubleClick = (e: any, detection: Detection, vertexIndex: number) => {
    e.cancelBubble = true
    
    if (selectionMode === 'normal') {
      removeVertex(detection, vertexIndex)
    }
  }

  // Get selected vertices count for current polygon
  const getSelectedVerticesCount = (detectionId: string | number) => {
    return selectedVertices.filter(sv => sv.detectionId === detectionId).length
  }

  // Handle canvas click for measurements
  const handleCanvasClick = (e: any) => {
    // Only handle measurement clicks if clicking on the stage itself (not on a polygon)
    if (measurementMode && onMeasurementClick && e.target === e.target.getStage()) {
      const stage = e.target.getStage()
      if (!stage) return
      
      const point = stage.getPointerPosition()
      if (!point) return
      
      onMeasurementClick([point.x, point.y])
      e.cancelBubble = true
    }
    // If clicking on a polygon, let it handle the click (don't cancel bubble)
  }

  // Handle double-click for completing area measurements
  const handleCanvasDoubleClick = (e: any) => {
    if (measurementMode === 'area' && onMeasurementComplete) {
      onMeasurementComplete()
      e.cancelBubble = true
    }
  }

  // Handle right-click for area categorization
  const handleCanvasRightClick = (e: any) => {
    if (measurementMode === 'area' && onMeasurementRightClick) {
      e.evt.preventDefault()
      onMeasurementRightClick()
      e.cancelBubble = true
    }
  }

  return (
    <>
      {/* Multi-select mode indicator */}
      {selectionMode === 'multi-select' && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#2563eb',
          color: 'white',
          padding: '4px 12px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          Multi-Select Mode (Press Esc to exit)
        </div>
      )}
      
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleCanvasClick}
        onDblClick={measurementMode ? handleCanvasDoubleClick : handleStageDoubleClick}
        onContextMenu={handleCanvasRightClick}
        scaleX={1}
        scaleY={1}
        pixelRatio={window.devicePixelRatio || 2}
        style={{ pointerEvents: 'auto' }}
      >
        <Layer 
          listening={true}
          imageSmoothingEnabled={false}
        >
          {/* Selection rectangle */}
          <SelectionBox 
            start={selectionStart}
            end={selectionEnd}
            visible={isSelecting}
          />

        {detections.map((d, index) => {
          // Skip rendering if detection is hidden
          if (hiddenElements.has(String(d.id))) {
            return null;
          }
          
          const pts = toPairs(d.points)
          if (pts.length < 3) return null;
          
          const flat = pts.flat()
          // Use detection's color if available, otherwise use class color mapping
          const color = (d as any).color || getDetectionColor(d.cls)
          const polygonSelected = isPolygonSelected(d)
          const hasSelectedVertices = getSelectedVerticesCount(d.id) > 0
          const isHovered = hoveredDetectionId === d.id
          
          // Use constant stroke widths with inverse scaling
          const scaledStrokeWidth = (isHovered ? STROKE_WIDTH_HOVER : STROKE_WIDTH) * inverseScale
          const glowStrokeWidth = 10 * inverseScale
          const shadowBlur = isHovered ? 20 * inverseScale : 0

          return (
            <React.Fragment key={d.id}>
              {/* Glow effect for hovered detection */}
              {isHovered && (
                <Line
                  points={flat as number[]}
                  closed
                  stroke={color}
                  strokeWidth={glowStrokeWidth}
                  fill="transparent"
                  opacity={0.3}
                  shadowColor={color}
                  shadowBlur={20 * inverseScale}
                  shadowOpacity={0.8}
                  listening={false}
                  perfectDrawEnabled={true}
                  strokeScaleEnabled={false}
                />
              )}
              
              <Line
                points={flat as number[]}
                closed
                stroke={color}
                strokeWidth={scaledStrokeWidth}
                fill={
                  polygonSelected || hasSelectedVertices 
                    ? `${color}${Math.round(OPACITY.fill.selected * 255).toString(16).padStart(2, '0')}`
                    : isHovered 
                    ? `${color}${Math.round(OPACITY.fill.hover * 255).toString(16).padStart(2, '0')}`
                    : `${color}${Math.round(OPACITY.fill.normal * 255).toString(16).padStart(2, '0')}`
                }
                onClick={(e) => handlePolygonClick(e, d)}
                onTap={(e) => handlePolygonClick(e, d)}
                shadowColor={isHovered ? color : undefined}
                shadowBlur={shadowBlur}
                shadowOpacity={isHovered ? 0.5 : 0}
                hitStrokeWidth={10 * inverseScale}
                perfectDrawEnabled={true}
                strokeScaleEnabled={false}
                listening={true}
              />

              {/* Vertices - always visible when polygon is selected or has selected vertices */}
              {(polygonSelected || hasSelectedVertices || selectionMode === 'multi-select') && 
                pts.map(([x, y], vi) => {
                  const vertexSelected = isVertexSelected(d.id, vi)
                  // Apply inverse scaling to keep vertex size constant
                  const scaledRadius = (vertexSelected ? BASE_VERTEX_RADIUS_SELECTED : BASE_VERTEX_RADIUS) * inverseScale
                  const scaledStrokeWidth = (vertexSelected ? 3 : 2) * inverseScale
                  
                  return (
                    <Circle
                      key={`${d.id}-${vi}`}
                      x={x}
                      y={y}
                      radius={scaledRadius}
                      fill={vertexSelected ? "#2563eb" : color}
                      stroke={vertexSelected ? "#1d4ed8" : "#ffffff"}
                      strokeWidth={scaledStrokeWidth}
                      draggable={selectionMode === 'normal'}
                      onDragMove={(e) => selectionMode === 'normal' && onVertexDrag(d, vi, e.target.x(), e.target.y())}
                      onClick={(e) => handleVertexClick(e, d, vi)}
                      onDblClick={(e) => handleVertexDoubleClick(e, d, vi)}
                      onTap={(e) => handleVertexClick(e, d, vi)}
                      hitStrokeWidth={0}
                      perfectDrawEnabled={true}
                      strokeScaleEnabled={false}
                      shadowForStrokeEnabled={false}
                    />
                  )
                })}

              {/* Draggable toolbar for selected polygon */}
              {polygonSelected && (
                <DraggableToolbar
                  detection={d}
                  canvasSize={[width, height]}
                  onDelete={() => deletePolygon(d.id)}
                  onCopy={() => copyPolygon(d)}
                  onDone={doneEditing}
                  onSimplify={selectedVertices.length > 0 ? handleSimplify : undefined}
                  selectedVerticesCount={getSelectedVerticesCount(d.id)}
                  scale={scale}
                />
              )}
            </React.Fragment>
          )
        })}
      </Layer>
      
      {/* Measurement Layer */}
      <MeasurementLayer
        measurements={measurements}
        currentMeasurement={currentMeasurement}
        onMeasurementClick={removeMeasurement}
        scale={scale}
        hiddenElements={hiddenElements}
      />
    </Stage>
    </>
  )
}

// ---------- math helpers ----------
function pointToSegmentDistance(p: Point, a: Point, b: Point) {
  const [px, py] = p, [x1, y1] = a, [x2, y2] = b
  const dx = x2 - x1, dy = y2 - y1
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  const cx = x1 + t * dx, cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}