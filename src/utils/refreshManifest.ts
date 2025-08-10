import { supabase } from '@/integrations/supabase/client';

export const refreshManifest = async () => {
  try {
    await supabase.functions.invoke('dynamic-manifest');
    console.log('Dynamic manifest refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh dynamic manifest:', error);
  }
};