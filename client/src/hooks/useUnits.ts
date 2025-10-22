import { useSettingsStore } from "@/store/useSettingsStore";
import { formatMeasurement } from "@/utils/measurementUtils";

/**
 * Hook to format measurements with user's preferred units
 */
export function useUnits() {
  const units = useSettingsStore(state => state.units);

  const formatArea = (sqFeet: number, decimals: number = 1) => {
    return formatMeasurement(sqFeet, 'area', decimals, units);
  };

  const formatDistance = (feet: number, decimals: number = 1) => {
    return formatMeasurement(feet, 'distance', decimals, units);
  };

  const getAreaUnit = () => {
    return units === 'metric' ? 'm²' : 'sq ft';
  };

  const getDistanceUnit = () => {
    return units === 'metric' ? 'm' : 'ft';
  };

  return {
    units,
    formatArea,
    formatDistance,
    getAreaUnit,
    getDistanceUnit,
  };
}
