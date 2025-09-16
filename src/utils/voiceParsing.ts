export const extractNumber = (text: string): number | null => {
  if (!text) return null;
  // Normalize text
  const cleaned = text.replace(/,/g, '.').toLowerCase();

  // Try to find a numeric pattern first (e.g., 150, 150.5)
  const numberMatch = cleaned.match(/(-?\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const n = parseFloat(numberMatch[1]);
    if (!Number.isNaN(n)) return n;
  }

  // Very basic word-to-number fallback for common quantities
  const wordMap: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100
  };

  const tokens = cleaned.split(/\s+/);
  let total = 0;
  let current = 0;
  let found = false;

  for (const t of tokens) {
    if (t in wordMap) {
      found = true;
      const val = wordMap[t];
      if (val === 100 && current > 0) {
        current *= 100;
      } else {
        current += val;
      }
    } else if (found) {
      // stop when sequence ends
      break;
    }
  }

  total = current;
  return found && total > 0 ? total : null;
};

export interface FoodParsingResult {
  foodName?: string;
  amount?: number;
  unit?: string;
  originalText: string;
}

export const parseVoiceFoodInput = (text: string): FoodParsingResult => {
  if (!text) return { originalText: text };
  
  // Clean punctuation from the text
  const cleanedText = text.replace(/[.,!?;:]+\s*$/g, '').trim();
  const cleaned = cleanedText.toLowerCase().trim();
  
  // Extract size descriptors before processing - preserve them for the AI
  const sizeDescriptors = ['large', 'small', 'medium', 'big', 'huge', 'tiny', 'extra large', 'xl', 'jumbo'];
  const foundSizes = sizeDescriptors.filter(size => 
    cleaned.includes(size) || cleaned.includes(size.replace(' ', '-'))
  );
  
  // Helper function to clean and capitalize food names
  const cleanFoodName = (name: string) => {
    const trimmed = name.trim().replace(/[.,!?;:]+$/g, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };
  
  // Common unit patterns
  const unitPatterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*(grams?|g)\s+(?:of\s+)?(.+)/, unit: 'g' },
    { pattern: /(\d+(?:\.\d+)?)\s*(kilograms?|kg)\s+(?:of\s+)?(.+)/, unit: 'kg' },
    { pattern: /(\d+(?:\.\d+)?)\s*(ounces?|oz)\s+(?:of\s+)?(.+)/, unit: 'oz' },
    { pattern: /(\d+(?:\.\d+)?)\s*(pounds?|lbs?)\s+(?:of\s+)?(.+)/, unit: 'lbs' },
    { pattern: /(\d+(?:\.\d+)?)\s*(cups?)\s+(?:of\s+)?(.+)/, unit: 'cup' },
    { pattern: /(\d+(?:\.\d+)?)\s*(tablespoons?|tbsp)\s+(?:of\s+)?(.+)/, unit: 'tbsp' },
    { pattern: /(\d+(?:\.\d+)?)\s*(teaspoons?|tsp)\s+(?:of\s+)?(.+)/, unit: 'tsp' },
    { pattern: /(\d+(?:\.\d+)?)\s*(pieces?|pcs?)\s+(?:of\s+)?(.+)/, unit: 'piece' },
    { pattern: /(\d+(?:\.\d+)?)\s*(slices?)\s+(?:of\s+)?(.+)/, unit: 'slice' },
    { pattern: /(\d+(?:\.\d+)?)\s*(servings?)\s+(?:of\s+)?(.+)/, unit: 'serving' },
  ];
  
  // Singular unit patterns (without numbers) - e.g. "piece of bread", "slice of pizza"
  const singularPatterns = [
    { pattern: /^(?:a\s+)?piece\s+(?:of\s+)?(.+)$/, unit: 'piece' },
    { pattern: /^(?:a\s+)?slice\s+(?:of\s+)?(.+)$/, unit: 'slice' },
    { pattern: /^(?:a\s+)?cup\s+(?:of\s+)?(.+)$/, unit: 'cup' },
    { pattern: /^(?:a\s+)?serving\s+(?:of\s+)?(.+)$/, unit: 'serving' },
    { pattern: /^(?:an?\s+)?(.+?)\s+(?:piece|slice)$/, unit: 'piece' },
  ];
  
  // Try to match quantity + unit + food patterns
  for (const { pattern, unit } of unitPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const foodName = match[3]?.trim();
      
      if (amount && foodName) {
        // Include size descriptors in the food name if found
        const finalFoodName = foundSizes.length > 0 
          ? `${foundSizes.join(' ')} ${cleanFoodName(foodName)}`
          : cleanFoodName(foodName);
        
        return {
          foodName: finalFoodName,
          amount,
          unit,
          originalText: text
        };
      }
    }
  }
  
  // Try to match singular patterns (implies amount = 1)
  for (const { pattern, unit } of singularPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const foodName = match[1]?.trim();
      
      if (foodName) {
        const finalFoodName = foundSizes.length > 0 
          ? `${foundSizes.join(' ')} ${cleanFoodName(foodName)}`
          : cleanFoodName(foodName);
        
        return {
          foodName: finalFoodName,
          amount: 1,
          unit,
          originalText: text
        };
      }
    }
  }
  
  // Try to extract just a number at the beginning (e.g., "150 chicken breast")
  const simpleMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (simpleMatch) {
    const amount = parseFloat(simpleMatch[1]);
    const foodName = simpleMatch[2]?.trim();
    
    if (amount && foodName) {
      const finalFoodName = foundSizes.length > 0 
        ? `${foundSizes.join(' ')} ${cleanFoodName(foodName)}`
        : cleanFoodName(foodName);
      
      return {
        foodName: finalFoodName,
        amount,
        unit: 'g', // Default to grams
        originalText: text
      };
    }
  }
  
  // If no quantity pattern found, treat as just food name
  const finalFoodName = foundSizes.length > 0 
    ? `${foundSizes.join(' ')} ${cleanFoodName(cleanedText)}`
    : cleanFoodName(cleanedText);
    
  return {
    foodName: finalFoodName,
    originalText: text
  };
};
