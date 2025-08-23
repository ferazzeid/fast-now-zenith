// Utility functions for unit conversions across the app

export const formatDistance = (distance: number | null, units: 'metric' | 'imperial' = 'imperial') => {
  if (!distance) return '0';
  
  if (units === 'metric') {
    return `${distance.toFixed(2)} km`;
  } else {
    // Convert km to miles
    const miles = distance / 1.60934;
    return `${miles.toFixed(2)} mi`;
  }
};

export const formatSpeed = (speedMph: number, units: 'metric' | 'imperial' = 'imperial') => {
  if (units === 'metric') {
    // Convert mph to km/h
    const kmh = speedMph * 1.60934;
    return `${kmh.toFixed(1)} km/h`;
  } else {
    return `${speedMph.toFixed(1)} mph`;
  }
};

export const formatWeight = (weightKg: number | null, units: 'metric' | 'imperial' = 'imperial') => {
  if (!weightKg) return '0';
  
  if (units === 'metric') {
    return `${weightKg.toFixed(1)} kg`;
  } else {
    // Convert kg to lbs
    const lbs = weightKg * 2.20462;
    return `${lbs.toFixed(1)} lbs`;
  }
};

export const convertKmToMiles = (km: number): number => {
  return km / 1.60934;
};

export const convertMilesToKm = (miles: number): number => {
  return miles * 1.60934;
};

export const convertKgToLbs = (kg: number): number => {
  return kg * 2.20462;
};

export const convertLbsToKg = (lbs: number): number => {
  return lbs / 2.20462;
};