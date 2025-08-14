// Food unit conversion utilities - Simplified for grams-only system

export interface UnitConversion {
  value: string;
  label: string;
}

// Available serving size units (simplified set)
export const SERVING_SIZE_UNITS: UnitConversion[] = [
  { value: 'grams', label: 'grams' },
  { value: 'milliliters', label: 'milliliters' }
];

// Get all available serving units
export const getServingUnitsForUser = (): UnitConversion[] => {
  return SERVING_SIZE_UNITS;
};

// Get default unit (always grams)
export const getDefaultServingSizeUnit = (): string => {
  return 'grams';
};

// Convert various units to grams (rough estimates for common foods)
export const convertToGrams = (amount: number, unit: string, foodName?: string): number => {
  switch (unit.toLowerCase()) {
    case 'grams':
      return amount;
    
    case 'milliliters':
    case 'milliliter':
    case 'ml':
      // Approximate: 1 ml ≈ 1 g for most liquids
      return amount * 1;
    
    default:
      console.warn(`Unknown unit: ${unit}, treating as grams`);
      return amount;
  }
};

// Format unit display text
export const formatUnitDisplay = (amount: string, unit: string): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '';
  
  if (numAmount === 1) {
    // Singular forms
    switch (unit) {
      case 'grams': return '1 gram';
      case 'milliliters': return '1 milliliter';
      default: return `1 ${unit}`;
    }
  } else {
    // Plural forms
    return `${numAmount} ${unit}`;
  }
};

// Get unit display name for labels
export const getUnitDisplayName = (unit: string): string => {
  switch (unit) {
    case 'grams': return 'Grams';
    case 'milliliters':
    case 'ml': return 'Milliliters';
    default: return unit.charAt(0).toUpperCase() + unit.slice(1);
  }
};