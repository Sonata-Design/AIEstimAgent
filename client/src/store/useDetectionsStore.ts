// client/src/store/useDetectionsStore.ts
import { create } from "zustand";
import type { XY } from "@/lib/types";

export type Detection = {
  id: string;
  cls: "room" | "door" | "window" | "wall";
  name?: string | null;
  score?: number;
  box?: { x: number; y: number; w: number; h: number };
  points: XY[];
  source?: "rooms" | "openings" | "walls";
};

type State = {
  detections: Detection[];
  scaleDenom: number | null;      // e.g. 48 for 1/4"=1'
  dpi: number;                    // default 96
  unit: "ft" | "m" | "cm" | "in"; // display unit
};

type Actions = {
  setDetections: (ds: Detection[]) => void;
  addDetections: (ds: Detection[]) => void;
  updateDetection: (id: string, patch: Partial<Detection>) => void;
  setScaleDenom: (d: number | null) => void;
  setDpi: (v: number) => void;
  setUnit: (u: State["unit"]) => void;
  clear: () => void;
};

export const useDetectionsStore = create<State & Actions>((set) => ({
  detections: [],
  scaleDenom: null,
  dpi: 96,
  unit: "ft",
  setDetections: (ds: Detection[]) => set({ detections: ds }),
  addDetections: (ds: Detection[]) => set((s) => ({ detections: [...s.detections, ...ds] })),
  updateDetection: (id: string, patch: Partial<Detection>) =>
    set((s) => ({
      detections: s.detections.map(d => d.id === id ? { ...d, ...patch } : d)
    })),
  setScaleDenom: (d: number | null) => set({ scaleDenom: d }),
  setDpi: (v: number) => set({ dpi: v }),
  setUnit: (u: State["unit"]) => set({ unit: u }),
  clear: () => set({ detections: [] }),
}));
