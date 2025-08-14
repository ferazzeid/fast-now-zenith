// Food unit conversion utilities - Simplified for grams-only system

export interface UnitConversion {
  value: string;
  label: string;
}

// Available serving size units (simplified set)
export const SERVING_SIZE_UNITS: UnitConversion[] = [
  { value: 'grams', label: 'grams' },
  { value: 'milliliters', label: 'milliliters' },
  { value: 'pieces', label: 'pieces' },
  { value: 'cups', label: 'cups' },
  { value: 'slices', label: 'slices' }
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

    
    case 'cups':
    case 'cup':
      // Rough estimates for common foods
      const foodType = foodName?.toLowerCase() || '';
      if (foodType.includes('rice') || foodType.includes('pasta')) {
        return amount * 185; // 1 cup cooked rice/pasta ≈ 185g
      } else if (foodType.includes('flour')) {
        return amount * 125; // 1 cup flour ≈ 125g
      } else if (foodType.includes('sugar')) {
        return amount * 200; // 1 cup sugar ≈ 200g
      } else if (foodType.includes('milk') || foodType.includes('water') || foodType.includes('juice') || foodType.includes('pepsi') || foodType.includes('coke') || foodType.includes('soda')) {
        return amount * 240; // 1 cup liquid ≈ 240g
      } else {
        return amount * 150; // Default for solid foods
      }
    
    case 'pieces':
    case 'piece':
      // Very rough estimates - AI will help refine these
      const food = foodName?.toLowerCase() || '';
      if (food.includes('apple')) {
        return amount * 180; // 1 medium apple ≈ 180g
      } else if (food.includes('banana')) {
        return amount * 120; // 1 medium banana ≈ 120g
      } else if (food.includes('orange')) {
        return amount * 150; // 1 medium orange ≈ 150g
      } else if (food.includes('slice') || food.includes('bread')) {
        return amount * 30; // 1 slice bread ≈ 30g
      } else if (food.includes('egg')) {
        return amount * 50; // 1 large egg ≈ 50g
      } else {
        return amount * 100; // Default piece size
      }
    
    case 'slices':
    case 'slice':
      // Common slice weights
      if (foodName?.toLowerCase().includes('bread')) {
        return amount * 30; // 1 slice bread ≈ 30g
      } else if (foodName?.toLowerCase().includes('cheese')) {
        return amount * 15; // 1 slice cheese ≈ 15g
      } else if (foodName?.toLowerCase().includes('pizza')) {
        return amount * 120; // 1 pizza slice ≈ 120g
      } else {
        return amount * 25; // Default slice weight
      }
    
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
      case 'pieces': return '1 piece';
      case 'cups': return '1 cup';
      case 'slices': return '1 slice';
      case 'grams': return '1 gram';
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
    case 'pieces': return 'Pieces';
    case 'cups': return 'Cups';
    case 'slices': return 'Slices';
    default: return unit.charAt(0).toUpperCase() + unit.slice(1);
  }
};