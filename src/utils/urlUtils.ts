/**
 * URL utilities for generating proper website links
 */

// Default website base URL - should be configurable
const DEFAULT_WEBSITE_BASE_URL = 'https://fastnow.app';

// Get website base URL from environment or use default
const getWebsiteBaseUrl = (): string => {
  // Try to get from environment first
  if (typeof window !== 'undefined') {
    // In browser, we could get it from a meta tag or config
    const metaUrl = document.querySelector('meta[name="website-url"]')?.getAttribute('content');
    if (metaUrl) return metaUrl;
  }
  
  // Fallback to default
  return DEFAULT_WEBSITE_BASE_URL;
};

/**
 * Generate a proper website URL from a slug
 */
export const generateWebsiteUrl = (slug: string): string => {
  if (!slug) return '';
  
  const baseUrl = getWebsiteBaseUrl();
  
  // Remove any leading slashes
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
  
  // If it's already an absolute URL, return as-is
  if (cleanSlug.startsWith('http://') || cleanSlug.startsWith('https://')) {
    return cleanSlug;
  }
  
  // For motivator slugs, create the full website URL
  if (!cleanSlug.startsWith('motivators/')) {
    return `${baseUrl}/motivators/${cleanSlug}`;
  }
  
  return `${baseUrl}/${cleanSlug}`;
};

/**
 * Check if a URL is absolute (external)
 */
export const isAbsoluteUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Get the current website base URL for display purposes
 */
export const getDisplayWebsiteUrl = (): string => {
  return getWebsiteBaseUrl();
};

/**
 * Validate and fix URL format
 */
export const validateAndFixUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // If it's already absolute, return it
  if (isAbsoluteUrl(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // If it starts with /, it's likely a relative path that should be a website URL
  if (trimmedUrl.startsWith('/')) {
    return generateWebsiteUrl(trimmedUrl);
  }
  
  // If it doesn't start with http, assume it's a slug
  return generateWebsiteUrl(trimmedUrl);
};