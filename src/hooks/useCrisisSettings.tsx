import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CrisisSettings {
  triggerHours: number;
  style: 'direct' | 'motivational' | 'tough_love' | 'psychological';
  intensity: number;
}

export const useCrisisSettings = () => {
  const [settings, setSettings] = useState<CrisisSettings>({
    triggerHours: 24,
    style: 'psychological',
    intensity: 7
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['crisis_trigger_hours', 'ai_crisis_style', 'ai_coaching_encouragement_level']);

      const settingsMap: Record<string, string> = {};
      if (data) {
        data.forEach(setting => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
      }

      setSettings({
        triggerHours: parseInt(settingsMap.crisis_trigger_hours || '24'),
        style: (settingsMap.ai_crisis_style as CrisisSettings['style']) || 'psychological',
        intensity: parseInt(settingsMap.ai_coaching_encouragement_level || '7')
      });
    } catch (error) {
      console.error('Error loading crisis settings:', error);
      toast({
        title: "Error",
        description: "Failed to load crisis settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: loadSettings
  };
};