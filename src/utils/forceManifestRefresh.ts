import { supabase } from '@/integrations/supabase/client';

export const forceManifestRefresh = async () => {
  try {
    console.log('Starting manifest and icon refresh...');
    
    // Get current icon settings from database
    const { data: settingsData } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['app_logo', 'app_favicon']);

    const settings: Record<string, string> = {};
    settingsData?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    // Update apple touch icons
    const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
    const iconUrl = settings.app_logo || settings.app_favicon || '/icon-512.png';
    
    appleTouchIcons.forEach((icon: any) => {
      const url = new URL(iconUrl, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      icon.href = url.toString();
      console.log('Updated apple touch icon:', url.toString());
    });

    // Update regular favicon
    const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    const shortcutIcon = document.getElementById('dynamic-shortcut-icon') as HTMLLinkElement;
    const faviconUrl = settings.app_favicon || settings.app_logo || '/icon-192.png';
    
    if (favicon) {
      const url = new URL(faviconUrl, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      favicon.href = url.toString();
      console.log('Updated favicon:', url.toString());
    }
    
    if (shortcutIcon) {
      const url = new URL(faviconUrl, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      shortcutIcon.href = url.toString();
      console.log('Updated shortcut icon:', url.toString());
    }

    // Force manifest refresh with cache busting
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const url = new URL(manifestLink.href, window.location.origin);
      url.searchParams.set('v', Date.now().toString());
      url.searchParams.set('refresh', 'true');
      manifestLink.href = url.toString();
      console.log('Updated manifest link:', url.toString());
    }

    // Clear PWA caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cleared PWA caches:', cacheNames);
    }

    // Force service worker update
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.update()));
      console.log('Updated service workers');
    }

    console.log('Manifest and icon refresh completed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing manifest and icons:', error);
    return false;
  }
};