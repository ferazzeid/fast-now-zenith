/**
 * Cache Management Utilities
 * 
 * Provides comprehensive cache clearing for authentication delays 
 * and component regression issues.
 */

// Clear all caches that could cause authentication delays
export const clearAuthenticationCaches = async () => {
  console.log('🧹 Clearing authentication caches...');
  
  // Clear localStorage role testing
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_role_testing');
    console.log('✓ Cleared role testing cache');
  }
  
  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('✓ Cleared service worker cache');
    } catch (error) {
      console.warn('Could not clear service worker:', error);
    }
  }
  
  // Clear browser caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✓ Cleared browser caches');
    } catch (error) {
      console.warn('Could not clear browser caches:', error);
    }
  }
};

// Clear component-specific caches that could cause regression
export const clearComponentCaches = () => {
  console.log('🧹 Clearing component caches...');
  
  if (typeof window !== 'undefined') {
    // Clear any cached component state
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('camera') || 
        key.includes('image') || 
        key.includes('upload') ||
        key.includes('component-cache')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✓ Cleared ${keysToRemove.length} component cache keys`);
  }
};

// Force cache busting for specific functionality
export const bustCameraCache = () => {
  console.log('📷 Busting camera cache...');
  
  // Add cache-busting timestamp to force fresh component loading
  if (typeof window !== 'undefined') {
    localStorage.setItem('camera-cache-buster', Date.now().toString());
  }
};

// Complete cache reset for authentication issues
export const performCompleteAuthCacheReset = async () => {
  console.log('🔄 Performing complete authentication cache reset...');
  
  await clearAuthenticationCaches();
  clearComponentCaches();
  bustCameraCache();
  
  console.log('✅ Complete cache reset finished');
};