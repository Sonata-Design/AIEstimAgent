import { create } from "zustand";

export type Point = [number, number];

export type MeasurementType = 'distance' | 'area';

export interface Measurement {
  id: string;
  type: MeasurementType;
  points: Point[];
  value: number; // In real-world units (feet or sq ft)
  label: string;
  color: string;
  category?: string; // room, wall, flooring, other
  name?: string; // Custom name
}

interface MeasurementState {
  measurements: Measurement[];
  currentMeasurement: Partial<Measurement> | null;
  measurementMode: MeasurementType | null;
  
  // Actions
  addMeasurement: (measurement: Measurement) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  setCurrentMeasurement: (measurement: Partial<Measurement> | null) => void;
  setMeasurementMode: (mode: MeasurementType | null) => void;
  updateCurrentMeasurement: (points: Point[]) => void;
}

export const useMeasurementStore = create<MeasurementState>((set) => ({
  measurements: [],
  currentMeasurement: null,
  measurementMode: null,
  
  addMeasurement: (measurement) =>
    set((state) => ({
      measurements: [...state.measurements, measurement],
      currentMeasurement: null,
    })),
  
  removeMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    })),
  
  clearMeasurements: () =>
    set({ measurements: [], currentMeasurement: null }),
  
  setCurrentMeasurement: (measurement) =>
    set({ currentMeasurement: measurement }),
  
  setMeasurementMode: (mode) =>
    set({ measurementMode: mode, currentMeasurement: mode ? { type: mode, points: [] } : null }),
  
  updateCurrentMeasurement: (points) =>
    set((state) => ({
      currentMeasurement: state.currentMeasurement
        ? { ...state.currentMeasurement, points }
        : null,
    })),
}));
