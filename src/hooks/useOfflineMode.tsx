import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOfflineMode = () => {
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOfflineSetting();
  }, []);

  const loadOfflineSetting = async () => {
    try {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'offline_mode_enabled')
        .maybeSingle();
      
      setOfflineEnabled(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error loading offline mode setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOfflineSetting = async (enabled: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'offline_mode_enabled',
          setting_value: enabled.toString()
        });

      if (error) throw error;

      setOfflineEnabled(enabled);
      return { success: true };
    } catch (error) {
      console.error('Error updating offline mode setting:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    offlineEnabled,
    loading,
    updateOfflineSetting,
  };
};

// Global flag checker for components
export const isOfflineModeEnabled = async (): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'offline_mode_enabled')
      .maybeSingle();
    
    return data?.setting_value === 'true';
  } catch {
    return false;
  }
};