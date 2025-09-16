import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Palette, RotateCcw } from 'lucide-react';

interface ColorValues {
  primary: string;
  primaryHover: string;
  accent: string;
  ai: string;
}

interface ColorMode {
  light: ColorValues;
  dark: ColorValues;
}

const EnhancedColorManagement: React.FC = () => {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  
  // Separate color states for light and dark modes
  const [colors, setColors] = useState<ColorMode>({
    light: {
      primary: '#0f172a',
      primaryHover: '#1e293b', 
      accent: '#3b82f6',
      ai: '#8b5cf6'
    },
    dark: {
      primary: '#f8fafc',
      primaryHover: '#f1f5f9',
      accent: '#60a5fa', 
      ai: '#a78bfa'
    }
  });

  // Improved muted-foreground colors for better visibility
  const improvedMutedForeground = {
    light: '210 40% 40%', // Darker for better contrast
    dark: '210 40% 78%'   // Lighter than the problematic 65%
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map((val, index) => 
      index === 0 ? parseFloat(val) : parseFloat(val.replace('%', ''))
    );
    
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    
    let r, g, b;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h, s;
    if (diff === 0) {
      h = s = 0;
    } else {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / diff + 2) / 6; break;
        case b: h = ((r - g) / diff + 4) / 6; break;
        default: h = 0;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleColorChange = (colorKey: keyof ColorValues, newColor: string) => {
    const hslValue = hexToHsl(newColor);
    setColors(prev => ({
      ...prev,
      [currentMode]: {
        ...prev[currentMode],
        [colorKey]: newColor
      }
    }));
    
    // Apply to CSS variables for live preview based on preview mode
    const modePrefix = previewMode === 'dark' ? 'dark:' : '';
    const cssVarName = `--${colorKey === 'primaryHover' ? 'primary-hover' : colorKey}`;
    document.documentElement.style.setProperty(cssVarName, hslValue);
  };

  const generateEnhancedCSSCode = (): string => {
    return `:root {
  /* Enhanced Color System - Light Mode */
  --primary: ${hexToHsl(colors.light.primary)};
  --primary-hover: ${hexToHsl(colors.light.primaryHover)};
  --accent: ${hexToHsl(colors.light.accent)};
  --ai: ${hexToHsl(colors.light.ai)};
  
  /* Improved muted-foreground for better visibility */
  --muted-foreground: ${improvedMutedForeground.light};
}

[data-theme="dark"] {
  /* Enhanced Color System - Dark Mode */
  --primary: ${hexToHsl(colors.dark.primary)};
  --primary-hover: ${hexToHsl(colors.dark.primaryHover)};
  --accent: ${hexToHsl(colors.dark.accent)};
  --ai: ${hexToHsl(colors.dark.ai)};
  
  /* Improved muted-foreground for better dark mode visibility */
  --muted-foreground: ${improvedMutedForeground.dark};
}`;
  };

  const generateTailwindCode = (): string => {
    return `// tailwind.config.ts - colors section
colors: {
  // Light mode colors
  primary: {
    DEFAULT: "hsl(${hexToHsl(colors.light.primary)})",
    hover: "hsl(${hexToHsl(colors.light.primaryHover)})"
  },
  accent: "hsl(${hexToHsl(colors.light.accent)})",
  ai: "hsl(${hexToHsl(colors.light.ai)})",
  
  // Dark mode handled via CSS variables
  // See generated CSS for dark mode variants
}`;
  };

  const resetToDefaults = () => {
    setColors({
      light: {
        primary: '#0f172a',
        primaryHover: '#1e293b',
        accent: '#3b82f6',
        ai: '#8b5cf6'
      },
      dark: {
        primary: '#f8fafc',
        primaryHover: '#f1f5f9',
        accent: '#60a5fa',
        ai: '#a78bfa'
      }
    });
    
    // Reset CSS variables
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--primary-hover');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--ai');
    
    toast({
      title: "Colors reset",
      description: "All colors have been reset to their defaults"
    });
  };

  const ColorPickerModal = ({ colorKey, isOpen }: { colorKey: keyof ColorValues; isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background p-6 rounded-lg border shadow-lg">
          <div className="mb-4">
            <Label className="text-sm font-medium">{colorKey} ({currentMode} mode)</Label>
          </div>
          <HexColorPicker
            color={colors[currentMode][colorKey]}
            onChange={(color) => handleColorChange(colorKey, color)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveColorPicker(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Enhanced Color Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex items-center justify-between">
          <Label htmlFor="color-mode" className="text-sm font-medium">
            Edit Mode:
          </Label>
          <Tabs value={currentMode} onValueChange={(value) => setCurrentMode(value as 'light' | 'dark')}>
            <TabsList>
              <TabsTrigger value="light">Light Mode</TabsTrigger>
              <TabsTrigger value="dark">Dark Mode</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preview Mode Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="preview-mode" className="text-sm font-medium">
            Preview in:
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm">Light</span>
            <Switch
              id="preview-mode"
              checked={previewMode === 'dark'}
              onCheckedChange={(checked) => setPreviewMode(checked ? 'dark' : 'light')}
            />
            <span className="text-sm">Dark</span>
          </div>
        </div>

        {/* Color Previews */}
        <div className="space-y-4">
          <h4 className="font-medium">Current Colors for {currentMode} mode</h4>
          <p className="text-sm text-muted-foreground">
            These colors are currently hard-coded in the design system. The color pickers below are for reference and preview only.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(colors[currentMode]) as Array<keyof ColorValues>).map((colorKey) => (
              <div key={colorKey} className="space-y-2">
                <Label className="text-sm font-medium capitalize">
                  {colorKey.replace(/([A-Z])/g, ' $1')}
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveColorPicker(colorKey)}
                    className="w-12 h-8 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: colors[currentMode][colorKey] }}
                  />
                  <Badge variant="secondary" className="text-xs font-mono">
                    {colors[currentMode][colorKey]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Color Picker Modals */}
        {(Object.keys(colors[currentMode]) as Array<keyof ColorValues>).map((colorKey) => (
          <ColorPickerModal
            key={`${currentMode}-${colorKey}`}
            colorKey={colorKey}
            isOpen={activeColorPicker === colorKey}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default EnhancedColorManagement;