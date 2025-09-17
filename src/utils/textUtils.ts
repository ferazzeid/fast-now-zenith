// Text utilities for consistent formatting across the app

/**
 * Capitalizes the first letter of each word in a food name
 * Handles special cases like "and", "with", "from" which should remain lowercase
 * Unless they're at the beginning of the string
 */
export const capitalizeFoodName = (foodName: string): string => {
  if (!foodName || typeof foodName !== 'string') return '';
  
  // Words that should remain lowercase unless at the beginning
  const lowercaseWords = ['and', 'with', 'from', 'of', 'in', 'on', 'at', 'to', 'for', 'the', 'a', 'an'];
  
  return foodName
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Keep certain words lowercase unless they're the first word
      if (lowercaseWords.includes(word)) {
        return word;
      }
      
      // Capitalize other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Capitalizes just the first letter of a string
 */
export const capitalizeFirst = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formats food names consistently for display
 */
export const formatFoodNameForDisplay = (foodName: string) => {
  return capitalizeFoodName(foodName);
};
