// client/src/components/DetectionOverlay.tsx
import React from "react";
import { useDetectionsStore } from "@/store/useDetectionsStore";

type Props = {
  width: number;
  height: number;
};

export default function DetectionOverlay({ width, height }: Props) {
  const { detections } = useDetectionsStore();

  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
      {detections.map((d) => {
        const path = d.points.map((p) => p.join(",")).join(" ");
        const fill = d.cls === "room" ? "rgba(34,197,94,0.18)" :
                     d.cls === "wall" ? "rgba(59,130,246,0.18)" :
                     d.cls === "door" ? "rgba(234,179,8,0.25)" :
                     "rgba(147,51,234,0.20)";
        const stroke = "rgba(30,41,59,0.9)";
        return (
          <polygon
            key={d.id}
            points={path}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
