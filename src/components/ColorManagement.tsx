import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useColorTheme } from "@/hooks/useColorTheme";

interface ColorValues {
  primary: string;
  primaryHover: string;
  accent: string;
  ai: string;
}

export const ColorManagement: React.FC = () => {
  const [colors, setColors] = useState<ColorValues>({
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#22c55e',
    ai: '#eab308'
  });
  
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const { toast } = useToast();
  const { loadColors } = useColorTheme();

  useEffect(() => {
    loadCurrentColors();
  }, []);

  const loadCurrentColors = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'brand_ai_color']);

      if (error) {
        console.error('Error loading colors:', error);
        return;
      }

      const newColors = { ...colors };
      data?.forEach(setting => {
        if (setting.setting_key === 'brand_primary_color' && setting.setting_value) {
          newColors.primary = hslToHex(setting.setting_value);
        } else if (setting.setting_key === 'brand_primary_hover' && setting.setting_value) {
          newColors.primaryHover = hslToHex(setting.setting_value);
        } else if (setting.setting_key === 'brand_accent_color' && setting.setting_value) {
          newColors.accent = hslToHex(setting.setting_value);
        } else if (setting.setting_key === 'brand_ai_color' && setting.setting_value) {
          newColors.ai = hslToHex(setting.setting_value);
        }
      });
      setColors(newColors);
    } catch (error) {
      console.error('Error loading current colors:', error);
    }
  };

  const hslToHex = (hsl: string): string => {
    // Parse HSL string like "220 35% 45%" to hex
    const [h, s, l] = hsl.split(' ').map((val, index) => {
      if (index === 0) return parseInt(val);
      return parseInt(val.replace('%', ''));
    });

    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '220 35% 45%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleColorChange = (colorType: keyof ColorValues, newColor: string) => {
    setColors(prev => ({ ...prev, [colorType]: newColor }));
    
    // Apply color immediately for live preview
    const root = document.documentElement;
    const hslValue = hexToHsl(newColor);
    
    if (colorType === 'primary') {
      root.style.setProperty('--primary', hslValue);
      root.style.setProperty('--ring', hslValue);
    } else if (colorType === 'primaryHover') {
      root.style.setProperty('--secondary', hslValue);
    } else if (colorType === 'accent') {
      root.style.setProperty('--accent', hslValue);
    } else if (colorType === 'ai') {
      root.style.setProperty('--ai', hslValue);
    }
  };

  const saveColors = async () => {
    try {
      const updates = [
        {
          setting_key: 'brand_primary_color',
          setting_value: hexToHsl(colors.primary)
        },
        {
          setting_key: 'brand_primary_hover',
          setting_value: hexToHsl(colors.primaryHover)
        },
        {
          setting_key: 'brand_accent_color',
          setting_value: hexToHsl(colors.accent)
        },
        {
          setting_key: 'brand_ai_color',
          setting_value: hexToHsl(colors.ai)
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) {
          console.error('Error saving color setting:', error);
          throw error;
        }
      }

      // Generate Android colors from database colors
      try {
        const { data: androidResult, error: androidError } = await supabase.functions.invoke('generate-android-colors');
        if (androidError) {
          console.warn('Failed to generate Android colors:', androidError);
        } else {
          console.log('Android colors generated:', androidResult);
        }
      } catch (error) {
        console.warn('Error calling generate-android-colors:', error);
      }

      // Reload colors to ensure consistency
      await loadColors();
      
      toast({
        title: "Success",
        description: "Brand colors saved for web and native apps successfully",
      });
    } catch (error) {
      console.error('Error saving colors:', error);
      toast({
        title: "Error",
        description: `Failed to save brand colors: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = () => {
    const defaultColors = {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      accent: '#8b5cf6',
      ai: '#eab308'
    };
    
    setColors(defaultColors);
    
    // Apply defaults immediately
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(defaultColors.primary));
    root.style.setProperty('--ring', hexToHsl(defaultColors.primary));
    root.style.setProperty('--secondary', hexToHsl(defaultColors.primaryHover));
    root.style.setProperty('--accent', hexToHsl(defaultColors.accent));
    root.style.setProperty('--ai', hexToHsl(defaultColors.ai));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
          Brand Colors
        </CardTitle>
        <CardDescription>
          Customize your app's color scheme and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Pickers Grid */}
        <div className="grid grid-cols-4 gap-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Color</Label>
            <div 
              className="w-full h-12 rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary }}
              onClick={() => setActiveColorPicker(activeColorPicker === 'primary' ? null : 'primary')}
            />
            
            {activeColorPicker === 'primary' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setActiveColorPicker(null)}>
                <div className="bg-background border rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Choose Primary Color</Label>
                  </div>
                  <HexColorPicker 
                    color={colors.primary} 
                    onChange={(color) => handleColorChange('primary', color)}
                    style={{ width: '100%', height: '200px' }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setActiveColorPicker(null)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Hover Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Hover</Label>
            <div 
              className="w-full h-12 rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
              style={{ backgroundColor: colors.primaryHover }}
              onClick={() => setActiveColorPicker(activeColorPicker === 'primaryHover' ? null : 'primaryHover')}
            />
            
            {activeColorPicker === 'primaryHover' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setActiveColorPicker(null)}>
                <div className="bg-background border rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Choose Primary Hover Color</Label>
                  </div>
                  <HexColorPicker 
                    color={colors.primaryHover} 
                    onChange={(color) => handleColorChange('primaryHover', color)}
                    style={{ width: '100%', height: '200px' }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setActiveColorPicker(null)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Accent</Label>
            <div 
              className="w-full h-12 rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
              style={{ backgroundColor: colors.accent }}
              onClick={() => setActiveColorPicker(activeColorPicker === 'accent' ? null : 'accent')}
            />
            
            {activeColorPicker === 'accent' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setActiveColorPicker(null)}>
                <div className="bg-background border rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Choose Accent Color</Label>
                  </div>
                  <HexColorPicker 
                    color={colors.accent} 
                    onChange={(color) => handleColorChange('accent', color)}
                    style={{ width: '100%', height: '200px' }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setActiveColorPicker(null)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">AI</Label>
            <div 
              className="w-full h-12 rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
              style={{ backgroundColor: colors.ai }}
              onClick={() => setActiveColorPicker(activeColorPicker === 'ai' ? null : 'ai')}
            />
            
            {activeColorPicker === 'ai' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setActiveColorPicker(null)}>
                <div className="bg-background border rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Choose AI Color</Label>
                  </div>
                  <HexColorPicker 
                    color={colors.ai} 
                    onChange={(color) => handleColorChange('ai', color)}
                    style={{ width: '100%', height: '200px' }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setActiveColorPicker(null)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={saveColors} className="flex-1">
            Save
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>
        <div className="pb-4"></div>
      </CardContent>
    </Card>
  );
};