import { supabase } from '@/integrations/supabase/client';

export const forcePWARefresh = async () => {
  try {
    console.log('Starting PWA cache refresh (preserving uploaded icons)...');
    
    // 1. Fetch current PWA settings from database (DO NOT overwrite them)
    const { data: settingsData } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['app_favicon', 'app_logo', 'app_icon_url']);

    const settings: Record<string, string> = {};
    settingsData?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    console.log('Preserving existing PWA settings:', settings);

    // 2. Update HTML icon links with cache busting (using existing URLs)
    const cacheBust = `?v=${Date.now()}&refresh=${Date.now()}`;
    
    // Update favicon links
    if (settings.app_favicon) {
      const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      const shortcutIconLink = document.getElementById('dynamic-shortcut-icon') as HTMLLinkElement;
      const iconLinks = document.querySelectorAll('link[rel="icon"]');
      
      if (faviconLink) {
        faviconLink.href = settings.app_favicon + cacheBust;
        console.log('Updated dynamic favicon:', faviconLink.href);
      }
      if (shortcutIconLink) {
        shortcutIconLink.href = settings.app_favicon + cacheBust;
        console.log('Updated shortcut icon:', shortcutIconLink.href);
      }
      iconLinks.forEach((icon: any) => {
        icon.href = settings.app_favicon + cacheBust;
        console.log('Updated icon link:', icon.href);
      });
    }

    // Update apple touch icons with app_icon_url or fallback to app_logo
    const appIconUrl = settings.app_icon_url || settings.app_logo;
    if (appIconUrl) {
      const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
      appleTouchIcons.forEach((icon: any) => {
        icon.href = appIconUrl + cacheBust;
        console.log('Updated apple touch icon:', icon.href);
      });
    }
    
    // 3. Clear ALL browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Clearing ALL caches:', cacheNames);
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // 4. Unregister and re-register service worker for complete refresh
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered service worker');
      }
    }
    
    // 5. Force manifest refresh with aggressive cache busting
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const url = new URL(manifestLink.href, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      url.searchParams.set('bust', Math.random().toString(36));
      url.searchParams.set('refresh', Date.now().toString());
      manifestLink.href = url.toString();
      console.log('Manifest URL updated:', manifestLink.href);
    }

    // 6. Re-register service worker after delay
    setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Re-registered service worker:', registration);
      } catch (error) {
        console.error('Failed to re-register service worker:', error);
      }
    }, 1000);

    // 7. Force page reload on mobile devices for complete refresh
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile device detected, forcing page reload in 2 seconds...');
      setTimeout(() => {
        console.log('Reloading page for mobile cache clear...');
        location.reload();
      }, 2000);
    }
    
    console.log('PWA cache refresh completed (icons preserved)');
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

    console.log('Fetching manifest from:', manifestLink.href);

    // Use fetch with no-cors mode to avoid CORS issues
    const response = await fetch(manifestLink.href, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    if (!response.ok) {
      return { isValid: false, error: `Failed to fetch manifest: ${response.status}` };
    }

    const manifest = await response.json();
    console.log('Manifest data:', manifest);
    
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
    console.error('Manifest validation error:', error);
    return { 
      isValid: false, 
      error: `Error validating manifest: ${error.message}` 
    };
  }
};