// Food unit conversion utilities - Simplified for grams-only system

export interface UnitConversion {
  value: string;
  label: string;
}

// Available serving size units with comprehensive options
export const SERVING_SIZE_UNITS: UnitConversion[] = [
  { value: 'grams', label: 'g' },
  { value: 'milliliters', label: 'ml' },
  { value: 'cups', label: 'cup' },
  { value: 'tablespoons', label: 'tbsp' },
  { value: 'teaspoons', label: 'tsp' },
  { value: 'ounces', label: 'oz' },
  { value: 'pieces', label: 'piece' },
  { value: 'slices', label: 'slice' },
  { value: 'handfuls', label: 'handful' }
];

// Get all available serving units
export const getServingUnitsForUser = (): UnitConversion[] => {
  return SERVING_SIZE_UNITS;
};

// Get default unit (always grams)
export const getDefaultServingSizeUnit = (): string => {
  return 'grams';
};

// Contextual portion estimates for common foods
const getPortionEstimate = (unit: string, foodName?: string): number => {
  const food = foodName?.toLowerCase() || '';
  
  switch (unit.toLowerCase()) {
    case 'handful':
    case 'handfuls':
      if (food.includes('cheese') || food.includes('nuts') || food.includes('seeds')) return 30;
      if (food.includes('berries') || food.includes('grapes')) return 80;
      if (food.includes('leafy') || food.includes('spinach') || food.includes('lettuce')) return 20;
      if (food.includes('mushroom')) return 40;
      return 40; // Default handful

    case 'slice':
    case 'slices':
      if (food.includes('bread') || food.includes('toast')) return 25;
      if (food.includes('cheese')) return 20;
      if (food.includes('tomato')) return 15;
      if (food.includes('onion')) return 10;
      if (food.includes('apple') || food.includes('orange')) return 30;
      return 25; // Default slice

    case 'piece':
    case 'pieces':
      if (food.includes('fruit') || food.includes('apple') || food.includes('orange')) return 150;
      if (food.includes('chicken') || food.includes('breast')) return 120;
      if (food.includes('egg')) return 50;
      return 50; // Default piece

    case 'cup':
    case 'cups':
      return 240; // Standard cup = 240ml/240g

    case 'tablespoon':
    case 'tablespoons':
    case 'tbsp':
      return 15;

    case 'teaspoon':
    case 'teaspoons':
    case 'tsp':
      return 5;

    case 'ounce':
    case 'ounces':
    case 'oz':
      return 28.35; // 1 oz = 28.35g

    default:
      return 1;
  }
};

// Convert various units to grams with contextual intelligence
export const convertToGrams = (amount: number, unit: string, foodName?: string): number => {
  const unitLower = unit.toLowerCase();
  
  switch (unitLower) {
    case 'grams':
    case 'gram':
    case 'g':
      return amount;
    
    case 'milliliters':
    case 'milliliter':
    case 'ml':
      // Approximate: 1 ml ≈ 1 g for most liquids
      return amount * 1;
    
    case 'kilograms':
    case 'kilogram':
    case 'kg':
      return amount * 1000;
    
    case 'pounds':
    case 'pound':
    case 'lbs':
    case 'lb':
      return amount * 453.592;
      
    case 'handful':
    case 'handfuls':
    case 'slice':
    case 'slices':
    case 'piece':
    case 'pieces':
    case 'cup':
    case 'cups':
    case 'tablespoon':
    case 'tablespoons':
    case 'tbsp':
    case 'teaspoon':
    case 'teaspoons':
    case 'tsp':
    case 'ounce':
    case 'ounces':
    case 'oz':
      const estimatedGrams = getPortionEstimate(unitLower, foodName);
      return amount * estimatedGrams;
    
    default:
      console.warn(`Unknown unit: ${unit}, treating as grams`);
      return amount;
  }
};

// Format unit display text with proper pluralization
export const formatUnitDisplay = (amount: string, unit: string): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '';
  
  const unitLower = unit.toLowerCase();
  
  if (numAmount === 1) {
    // Singular forms
    switch (unitLower) {
      case 'grams': return '1 gram';
      case 'milliliters': return '1 milliliter';
      case 'cups': return '1 cup';
      case 'tablespoons': return '1 tablespoon';
      case 'teaspoons': return '1 teaspoon';
      case 'ounces': return '1 ounce';
      case 'pieces': return '1 piece';
      case 'slices': return '1 slice';
      case 'handfuls': return '1 handful';
      default: return `1 ${unit}`;
    }
  } else {
    // Plural forms
    switch (unitLower) {
      case 'grams': return `${numAmount} grams`;
      case 'milliliters': return `${numAmount} milliliters`;
      case 'cups': return `${numAmount} cups`;
      case 'tablespoons': return `${numAmount} tablespoons`;
      case 'teaspoons': return `${numAmount} teaspoons`;
      case 'ounces': return `${numAmount} ounces`;
      case 'pieces': return `${numAmount} pieces`;
      case 'slices': return `${numAmount} slices`;
      case 'handfuls': return `${numAmount} handfuls`;
      default: return `${numAmount} ${unit}`;
    }
  }
};

// Get unit display name for labels
export const getUnitDisplayName = (unit: string): string => {
  switch (unit.toLowerCase()) {
    case 'grams': return 'g';
    case 'milliliters':
    case 'ml': return 'ml';
    case 'cups': return 'cup';
    case 'tablespoons': return 'tbsp';
    case 'teaspoons': return 'tsp';
    case 'ounces': return 'oz';
    case 'pieces': return 'piece';
    case 'slices': return 'slice';
    case 'handfuls': return 'handful';
    default: return unit.charAt(0).toUpperCase() + unit.slice(1);
  }
};

// Parse natural language portions into standardized amounts
export const parseNaturalPortion = (text: string, foodName?: string): { amount: number; unit: string } => {
  const cleanText = text.toLowerCase().trim();
  
  // Handle common natural language patterns
  if (cleanText.includes('handful')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*handful/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'handfuls' };
  }
  
  if (cleanText.includes('slice')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*slice/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'slices' };
  }
  
  if (cleanText.includes('piece')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*piece/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'pieces' };
  }
  
  if (cleanText.includes('cup')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*cup/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'cups' };
  }
  
  // Handle tablespoon/teaspoon
  if (cleanText.includes('tablespoon') || cleanText.includes('tbsp')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:tablespoon|tbsp)/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'tablespoons' };
  }
  
  if (cleanText.includes('teaspoon') || cleanText.includes('tsp')) {
    const match = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:teaspoon|tsp)/);
    return { amount: match ? parseFloat(match[1]) : 1, unit: 'teaspoons' };
  }
  
  // Handle numeric amounts with grams
  const gramMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:grams|gram|g)/);
  if (gramMatch) {
    return { amount: parseFloat(gramMatch[1]), unit: 'grams' };
  }
  
  // Default fallback
  return { amount: 100, unit: 'grams' };
};