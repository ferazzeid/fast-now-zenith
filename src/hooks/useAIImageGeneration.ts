import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAIImageGeneration = () => {
  const [aiImageEnabled, setAiImageEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAIImageSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'enable_ai_image_generation')
          .maybeSingle();

        if (!error && data) {
          const val = (data.setting_value ?? '').toString().toLowerCase();
          setAiImageEnabled(val === 'true' || val === '1' || val === 'yes');
        } else {
          setAiImageEnabled(false);
        }
      } catch (error) {
        console.error('Failed to load AI image generation setting:', error);
        setAiImageEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkAIImageSetting();
  }, []);

  const updateAIImageSetting = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'enable_ai_image_generation', 
          setting_value: enabled.toString() 
        });

      if (!error) {
        setAiImageEnabled(enabled);
        return { success: true };
      } else {
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    aiImageEnabled,
    loading,
    updateAIImageSetting
  };
};