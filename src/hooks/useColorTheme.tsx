import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseHSL } from '@/utils/colorUtils';

interface ColorSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  ai_color?: string;
  chat_ai_color?: string;
  chat_user_color?: string;
}

export const useColorTheme = (shouldLoad: boolean = true) => {
  const [colorSettings, setColorSettings] = useState<ColorSettings>({});
  const [loading, setLoading] = useState(true);

  const loadColors = async () => {
    // Skip loading if we shouldn't load yet (during startup)
    if (!shouldLoad) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'brand_ai_color', 'chat_ai_color', 'chat_user_color']);

      if (error) {
        console.error('Error loading color settings:', error);
        // Apply cached colors on error
        const cachedColors = localStorage.getItem('admin_colors');
        if (cachedColors) {
          try {
            const parsedColors = JSON.parse(cachedColors);
            console.log('Applying cached colors due to database error');
            applyColors(parsedColors);
            setColorSettings(parsedColors);
          } catch (cacheError) {
            console.error('Error parsing cached colors:', cacheError);
          }
        }
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
        } else if (setting.setting_key === 'chat_ai_color') {
          settings.chat_ai_color = setting.setting_value;
        } else if (setting.setting_key === 'chat_user_color') {
          settings.chat_user_color = setting.setting_value;
        }
      });

      setColorSettings(settings);
      applyColors(settings);
      
      // Cache the colors for instant loading on next visit
      localStorage.setItem('admin_colors', JSON.stringify(settings));
    } catch (error) {
      console.error('Error in loadColors:', error);
      // Apply cached colors on error
      const cachedColors = localStorage.getItem('admin_colors');
      if (cachedColors) {
        try {
          const parsedColors = JSON.parse(cachedColors);
          console.log('Applying cached colors due to network error');
          applyColors(parsedColors);
          setColorSettings(parsedColors);
        } catch (cacheError) {
          console.error('Error parsing cached colors:', cacheError);
        }
      }
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

    if (settings.chat_ai_color) {
      // The values from database are already in HSL format
      root.style.setProperty('--chat-ai', settings.chat_ai_color);
    }

    if (settings.chat_user_color) {
      // The values from database are already in HSL format
      root.style.setProperty('--chat-user', settings.chat_user_color);
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
    root.style.setProperty('--chat-ai', '262 83% 58%');
    root.style.setProperty('--chat-user', '188 94% 43%');
  };


  useEffect(() => {
    // Always start with cached colors if available, then neutral defaults
    const cachedColors = localStorage.getItem('admin_colors');
    if (cachedColors) {
      try {
        const parsedColors = JSON.parse(cachedColors);
        console.log('Applying cached colors immediately');
        applyColors(parsedColors);
        setColorSettings(parsedColors);
      } catch (error) {
        console.error('Error parsing cached colors:', error);
        applyNeutralDefaults();
      }
    } else {
      applyNeutralDefaults();
    }
    
    // Load fresh colors from database when ready
    if (shouldLoad) {
      loadColors();
    }
  }, [shouldLoad]);

  return { colorSettings, loading, loadColors, applyColors };
};