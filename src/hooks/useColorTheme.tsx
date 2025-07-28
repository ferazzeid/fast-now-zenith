import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ColorSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

export const useColorTheme = () => {
  const [colorSettings, setColorSettings] = useState<ColorSettings>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['primary_color', 'secondary_color', 'accent_color']);

      if (error) {
        console.error('Error loading color settings:', error);
        return;
      }

      const settings: ColorSettings = {};
      data?.forEach(setting => {
        settings[setting.setting_key as keyof ColorSettings] = setting.setting_value;
      });

      setColorSettings(settings);
      applyColors(settings);
    } catch (error) {
      console.error('Error in loadColors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (settings: ColorSettings) => {
    const root = document.documentElement;
    
    if (settings.primary_color) {
      // Convert hex to HSL and apply
      const hsl = hexToHsl(settings.primary_color);
      if (hsl) {
        root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }

    if (settings.secondary_color) {
      const hsl = hexToHsl(settings.secondary_color);
      if (hsl) {
        root.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }

    if (settings.accent_color) {
      const hsl = hexToHsl(settings.accent_color);
      if (hsl) {
        root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }
  };

  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  useEffect(() => {
    loadColors();
  }, [user]);

  return { colorSettings, loading, loadColors, applyColors };
};