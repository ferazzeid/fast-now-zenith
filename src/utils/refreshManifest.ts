import { supabase } from '@/integrations/supabase/client';
import { forcePWARefresh } from './pwaCache';

export const refreshManifest = async () => {
  try {
    // Use the enhanced PWA refresh mechanism
    const success = await forcePWARefresh();
    if (success) {
      console.log('PWA manifest and cache refreshed successfully');
    } else {
      console.warn('PWA refresh completed with some issues');
    }
    return success;
  } catch (error) {
    console.error('Failed to refresh PWA manifest:', error);
    return false;
  }
};