import { supabase } from '@/integrations/supabase/client';

export const forcePWARefresh = async () => {
  try {
    console.log('Starting PWA cache refresh...');
    
    // 1. Force manifest refresh with cache busting
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const url = new URL(manifestLink.href, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      url.searchParams.set('bust', Math.random().toString(36));
      manifestLink.href = url.toString();
      console.log('Manifest URL updated with cache busting');
    }

    // 2. Invoke dynamic manifest function to refresh server-side
    await supabase.functions.invoke('dynamic-manifest');
    console.log('Dynamic manifest function invoked');

    // 3. Update service worker to clear PWA cache
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ 
          type: 'CLEAR_PWA_CACHE',
          timestamp: Date.now()
        });
        console.log('Service worker notified to clear PWA cache');
      }
    }

    // 4. Clear any cached manifest data in browser
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName.includes('manifest') || cacheName.includes('pwa')) {
          await caches.delete(cacheName);
          console.log(`Cleared cache: ${cacheName}`);
        }
      }
    }

    // 5. Force a small delay to allow updates to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('PWA cache refresh completed');
    return true;
  } catch (error) {
    console.error('Error refreshing PWA cache:', error);
    return false;
  }
};

export const validatePWAManifest = async (): Promise<{
  isValid: boolean;
  manifest?: any;
  error?: string;
}> => {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      return { isValid: false, error: 'No manifest link found' };
    }

    const response = await fetch(manifestLink.href, { 
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      return { isValid: false, error: `Failed to fetch manifest: ${response.status}` };
    }

    const manifest = await response.json();
    
    // Basic validation
    const requiredFields = ['name', 'short_name', 'start_url', 'display'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        manifest 
      };
    }

    return { isValid: true, manifest };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Error validating manifest: ${error.message}` 
    };
  }
};