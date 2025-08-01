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
 * When units are metric, the display speed is in km/h and needs conversion to MPH
 * When units are imperial, the display speed is already in MPH
 */
export const displaySpeedToStorageSpeed = (speed: number, units: 'metric' | 'imperial'): number => {
  if (units === 'metric') {
    // Display is km/h, convert to MPH for storage
    return kmhToMph(speed);
  } else {
    // Display is MPH, store as-is
    return speed;
  }
};

/**
 * Convert storage speed (MPH) to display speed based on units
 * When units are metric, convert MPH to km/h for display
 * When units are imperial, display MPH as-is
 */
export const storageSpeedToDisplaySpeed = (speedMph: number, units: 'metric' | 'imperial'): number => {
  if (units === 'metric') {
    // Storage is MPH, convert to km/h for display
    return mphToKmh(speedMph);
  } else {
    // Storage is MPH, display as-is
    return speedMph;
  }
};