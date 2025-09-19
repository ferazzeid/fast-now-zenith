/**
 * Truncates text to specified length and adds ellipsis
 */
export const truncateText = (text: string, maxLength: number = 25): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * Truncates food names to 25 characters for consistent display
 */
export const truncateFoodName = (name: string): string => {
  return truncateText(name, 25);
};

/**
 * Capitalizes the first letter of each word in a food name
 */
export const capitalizeFoodName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};