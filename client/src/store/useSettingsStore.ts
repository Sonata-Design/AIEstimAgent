import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Units = 'imperial' | 'metric';

interface SettingsState {
  // Display Settings
  theme: Theme;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Measurement Settings
  units: Units;
  
  // Performance Settings
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  
  // Actions
  setTheme: (theme: Theme) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setUnits: (units: Units) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'system' as Theme,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  units: 'imperial' as Units,
  autoSave: true,
  autoSaveInterval: 30,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        applyTheme(theme);
      },
      
      setShowGrid: (showGrid) => set({ showGrid }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setGridSize: (gridSize) => set({ gridSize }),
      setUnits: (units) => set({ units }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'estimagent-settings',
    }
  )
);

// Helper function to apply theme
function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.remove('light', 'dark');
    root.classList.add(systemTheme);
  } else {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('estimagent-settings');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      applyTheme(state.theme || 'system');
    } catch (e) {
      applyTheme('system');
    }
  } else {
    applyTheme('system');
  }
}
