import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getEnvironmentConfig } from '@/config/environment';

interface ColorSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  ai_color?: string;
}

export const useColorTheme = () => {
  const [colorSettings, setColorSettings] = useState<ColorSettings>({});
  const [loading, setLoading] = useState(true);

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'brand_ai_color']);

      if (error) {
        console.error('Error loading color settings:', error);
        return;
      }

      const settings: ColorSettings = {};
      data?.forEach(setting => {
        // Map the database keys to our interface keys
        if (setting.setting_key === 'brand_primary_color') {
          settings.primary_color = setting.setting_value;
        } else if (setting.setting_key === 'brand_primary_hover') {
          settings.secondary_color = setting.setting_value;
        } else if (setting.setting_key === 'brand_accent_color') {
          settings.accent_color = setting.setting_value;
        } else if (setting.setting_key === 'brand_ai_color') {
          settings.ai_color = setting.setting_value;
        }
      });

      setColorSettings(settings);
      applyColors(settings);
      
      // Cache the colors for instant loading on next visit
      localStorage.setItem('admin_colors', JSON.stringify(settings));
    } catch (error) {
      console.error('Error in loadColors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (settings: ColorSettings) => {
    const root = document.documentElement;
    
    if (settings.primary_color) {
      // The values from database are already in HSL format (e.g., "220 35% 45%")
      root.style.setProperty('--primary', settings.primary_color);
      root.style.setProperty('--ring', settings.primary_color);
      
      // Generate glow and hover variants
      const hsl = parseHSL(settings.primary_color);
      if (hsl) {
        root.style.setProperty('--primary-glow', `${hsl.h} ${Math.min(hsl.s + 10, 100)}% ${Math.min(hsl.l + 10, 100)}%`);
        root.style.setProperty('--primary-hover', `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 5, 0)}%`);
      }
    }

    if (settings.secondary_color) {
      // The values from database are already in HSL format
      root.style.setProperty('--secondary', settings.secondary_color);
    }

    if (settings.accent_color) {
      // The values from database are already in HSL format
      root.style.setProperty('--accent', settings.accent_color);
    }

    if (settings.ai_color) {
      // The values from database are already in HSL format
      root.style.setProperty('--ai', settings.ai_color);
    }
  };

  // Apply neutral default colors while loading database colors
  const applyNeutralDefaults = () => {
    const root = document.documentElement;
    
    // Use neutral colors as emergency fallbacks only
    root.style.setProperty('--primary', '220 13% 45%');
    root.style.setProperty('--ring', '220 13% 45%');
    root.style.setProperty('--primary-glow', '220 13% 55%');
    root.style.setProperty('--primary-hover', '220 13% 40%');
    root.style.setProperty('--secondary', '220 13% 40%');
    root.style.setProperty('--accent', '220 13% 50%');
    root.style.setProperty('--ai', '220 13% 50%');
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

  const parseHSL = (hslString: string) => {
    // Parse "220 35% 45%" format
    const matches = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!matches) return null;
    
    return {
      h: parseInt(matches[1]),
      s: parseInt(matches[2]),
      l: parseInt(matches[3])
    };
  };

  useEffect(() => {
    // Check if colors are cached in localStorage
    const cachedColors = localStorage.getItem('admin_colors');
    if (cachedColors) {
      try {
        const parsedColors = JSON.parse(cachedColors);
        applyColors(parsedColors);
        setColorSettings(parsedColors);
      } catch (error) {
        console.error('Error parsing cached colors:', error);
        applyNeutralDefaults();
      }
    } else {
      // Apply neutral defaults while loading database colors
      applyNeutralDefaults();
    }
    
    // Load fresh colors from database
    loadColors();
  }, []);

  return { colorSettings, loading, loadColors, applyColors };
};