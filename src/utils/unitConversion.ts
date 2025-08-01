// Unit conversion utilities
// All speeds are stored in MPH in the database but can be displayed in km/h

export const MPH_TO_KMH = 1.60934;
export const KMH_TO_MPH = 1 / MPH_TO_KMH;

/**
 * Convert MPH to km/h
 */
export const mphToKmh = (mph: number): number => {
  return Number((mph * MPH_TO_KMH).toFixed(1));
};

/**
 * Convert km/h to MPH
 */
export const kmhToMph = (kmh: number): number => {
  return Number((kmh * KMH_TO_MPH).toFixed(1));
};

/**
 * Convert display speed to storage speed (always MPH)
 */
export const displaySpeedToStorageSpeed = (speed: number, units: 'metric' | 'imperial'): number => {
  return units === 'metric' ? kmhToMph(speed) : speed;
};

/**
 * Convert storage speed (MPH) to display speed based on units
 */
export const storageSpeedToDisplaySpeed = (speedMph: number, units: 'metric' | 'imperial'): number => {
  return units === 'metric' ? mphToKmh(speedMph) : speedMph;
};