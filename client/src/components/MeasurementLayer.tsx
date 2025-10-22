import React from "react";
import { Layer, Line, Circle, Text, Group } from "react-konva";
import type { Measurement, Point } from "@/store/useMeasurementStore";
import { getMidpoint, getCenterPoint } from "@/utils/measurementUtils";

interface MeasurementLayerProps {
  measurements: Measurement[];
  currentMeasurement: Partial<Measurement> | null;
  onMeasurementClick?: (id: string) => void;
  scale?: number; // Canvas scale for inverse scaling
  hiddenElements?: Set<string>; // For hiding room masks
}

export function MeasurementLayer({
  measurements,
  currentMeasurement,
  onMeasurementClick,
  scale = 1,
  hiddenElements = new Set(),
}: MeasurementLayerProps) {
  const inverseScale = 1 / scale;

  const renderMeasurement = (measurement: Measurement | Partial<Measurement>, isTemp: boolean = false) => {
    const { id, type, points = [], label, color = '#3B82F6', category } = measurement;
    
    // Hide if in hiddenElements set (for room masks)
    if (!isTemp && id && hiddenElements.has(id)) {
      return null;
    }
    
    // Use green color for rooms
    const displayColor = category === 'room' ? '#10B981' : color;
    
    if (points.length === 0) return null;

    const flatPoints = points.flat();
    const key = isTemp ? 'temp-measurement' : id;

    return (
      <Group key={key}>
        {/* Draw the line/polygon */}
        <Line
          points={flatPoints}
          stroke={displayColor}
          strokeWidth={2 * inverseScale}
          dash={isTemp ? [5 * inverseScale, 5 * inverseScale] : undefined}
          closed={type === 'area' && points.length > 2}
          fill={type === 'area' && points.length > 2 ? `${displayColor}30` : undefined}
          listening={!isTemp}
          onClick={() => !isTemp && id && onMeasurementClick?.(id as string)}
          onTap={() => !isTemp && id && onMeasurementClick?.(id as string)}
        />

        {/* Draw points */}
        {points.map((point, index) => (
          <Circle
            key={`${key}-point-${index}`}
            x={point[0]}
            y={point[1]}
            radius={4 * inverseScale}
            fill={displayColor}
            stroke="white"
            strokeWidth={1 * inverseScale}
            listening={false}
          />
        ))}

        {/* Labels removed - room names shown in right panel only */}
      </Group>
    );
  };

  return (
    <Layer>
      {/* Render completed measurements */}
      {measurements.map((measurement) => renderMeasurement(measurement, false))}
      
      {/* Render current measurement being drawn */}
      {currentMeasurement && currentMeasurement.points && currentMeasurement.points.length > 0 && (
        renderMeasurement(currentMeasurement, true)
      )}
    </Layer>
  );
}
