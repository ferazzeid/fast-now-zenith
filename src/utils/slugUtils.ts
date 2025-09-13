/**
 * Generate a URL-safe slug from a title string
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .substring(0, 50); // Limit length to 50 characters
};

/**
 * Generate a unique slug by appending timestamp if needed
 */
export const generateUniqueSlug = (title: string): string => {
  const baseSlug = generateSlug(title);
  const timestamp = Date.now();
  const shortTimestamp = timestamp.toString().slice(-6); // Use last 6 digits
  
  return baseSlug ? `${baseSlug}-${shortTimestamp}` : `motivator-${shortTimestamp}`;
};