import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code } from "lucide-react";
import { STATIC_COLORS } from "@/utils/staticAssets";

interface ColorValues {
  primary: string;
  primaryHover: string;
  accent: string;
  ai: string;
  chatAi: string;
  chatUser: string;
}

export const ColorManagement: React.FC = () => {
  // Load current static colors
  const [colors, setColors] = useState<ColorValues>({
    primary: `hsl(${STATIC_COLORS.primary})`,
    primaryHover: `hsl(${STATIC_COLORS.secondary})`,
    accent: `hsl(${STATIC_COLORS.accent})`,
    ai: `hsl(${STATIC_COLORS.ai})`,
    chatAi: `hsl(${STATIC_COLORS.chatAi})`,
    chatUser: `hsl(${STATIC_COLORS.chatUser})`
  });
  
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully!`,
    });
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
    } else if (colorType === 'chatAi') {
      root.style.setProperty('--chat-ai', hslValue);
    } else if (colorType === 'chatUser') {
      root.style.setProperty('--chat-user', hslValue);
    }
  };

  const generateCSSCode = () => {
    return `:root {
  /* Brand Colors */
  --primary: ${hexToHsl(colors.primary)};
  --secondary: ${hexToHsl(colors.primaryHover)};
  --accent: ${hexToHsl(colors.accent)};
  --ai: ${hexToHsl(colors.ai)};
  --chat-ai: ${hexToHsl(colors.chatAi)};
  --chat-user: ${hexToHsl(colors.chatUser)};
  
  /* Auto-generated variants */
  --ring: var(--primary);
  --primary-foreground: 210 40% 98%;
  --secondary-foreground: 222.2 84% 4.9%;
  --accent-foreground: 222.2 84% 4.9%;
}

.dark {
  --primary: ${hexToHsl(colors.primary)};
  --secondary: ${hexToHsl(colors.primaryHover)};
  --accent: ${hexToHsl(colors.accent)};
  --ai: ${hexToHsl(colors.ai)};
  --chat-ai: ${hexToHsl(colors.chatAi)};
  --chat-user: ${hexToHsl(colors.chatUser)};
}`;
  };

  const generateTailwindCode = () => {
    return `// tailwind.config.ts colors section
colors: {
  primary: {
    DEFAULT: "hsl(${hexToHsl(colors.primary)})",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(${hexToHsl(colors.primaryHover)})",
    foreground: "hsl(var(--secondary-foreground))",
  },
  accent: {
    DEFAULT: "hsl(${hexToHsl(colors.accent)})",
    foreground: "hsl(var(--accent-foreground))",
  },
  ai: {
    DEFAULT: "hsl(${hexToHsl(colors.ai)})",
  },
  "chat-ai": {
    DEFAULT: "hsl(${hexToHsl(colors.chatAi)})",
  },
  "chat-user": {
    DEFAULT: "hsl(${hexToHsl(colors.chatUser)})",
  },
}`;
  };

  const resetToDefaults = () => {
    const defaultColors = {
      primary: `hsl(${STATIC_COLORS.primary})`,
      primaryHover: `hsl(${STATIC_COLORS.secondary})`,
      accent: `hsl(${STATIC_COLORS.accent})`,
      ai: `hsl(${STATIC_COLORS.ai})`,
      chatAi: `hsl(${STATIC_COLORS.chatAi})`,
      chatUser: `hsl(${STATIC_COLORS.chatUser})`
    };
    
    setColors(defaultColors);
    
    // Apply defaults immediately
    const root = document.documentElement;
    root.style.setProperty('--primary', STATIC_COLORS.primary);
    root.style.setProperty('--ring', STATIC_COLORS.primary);
    root.style.setProperty('--secondary', STATIC_COLORS.secondary);
    root.style.setProperty('--accent', STATIC_COLORS.accent);
    root.style.setProperty('--ai', STATIC_COLORS.ai);
    root.style.setProperty('--chat-ai', STATIC_COLORS.chatAi);
    root.style.setProperty('--chat-user', STATIC_COLORS.chatUser);
  };

  const ColorPickerModal = ({ type, title, color, onColorChange }: {
    type: string;
    title: string;
    color: string;
    onColorChange: (color: string) => void;
  }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setActiveColorPicker(null)}>
      <div className="bg-background border rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <Label className="text-sm font-medium">{title}</Label>
        </div>
        <HexColorPicker 
          color={color} 
          onChange={onColorChange}
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
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
          Static Color Code Generator
        </CardTitle>
        <CardDescription>
          Development tool to generate color CSS variables and Tailwind config
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Preview */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Current Colors</Label>
          <div className="grid grid-cols-6 gap-2">
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.primary }}
              />
              <Label className="text-xs">Primary</Label>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.primaryHover }}
              />
              <Label className="text-xs">Secondary</Label>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.accent }}
              />
              <Label className="text-xs">Accent</Label>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.ai }}
              />
              <Label className="text-xs">AI</Label>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.chatAi }}
              />
              <Label className="text-xs">Chat AI</Label>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: colors.chatUser }}
              />
              <Label className="text-xs">Chat User</Label>
            </div>
          </div>
        </div>

        {/* CSS Variables Generator */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            CSS Variables (index.css)
          </Label>
          <Textarea
            value={generateCSSCode()}
            readOnly
            rows={10}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => copyToClipboard(generateCSSCode(), "CSS Variables")}
            size="sm"
            className="mt-2"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy CSS Code
          </Button>
        </div>

        {/* Tailwind Config Generator */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Tailwind Config (tailwind.config.ts)
          </Label>
          <Textarea
            value={generateTailwindCode()}
            readOnly
            rows={8}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => copyToClipboard(generateTailwindCode(), "Tailwind Config")}
            size="sm"
            className="mt-2"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Tailwind Code
          </Button>
        </div>

        {/* Color Picker for Live Preview */}
        {activeColorPicker && (
          <ColorPickerModal 
            type={activeColorPicker}
            title={`Choose ${activeColorPicker} Color`}
            color={colors[activeColorPicker as keyof ColorValues]}
            onColorChange={(color) => handleColorChange(activeColorPicker as keyof ColorValues, color)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};