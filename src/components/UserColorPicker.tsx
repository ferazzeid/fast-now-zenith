import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface UserColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const UserColorPicker = ({ value, onChange, disabled = false }: UserColorPickerProps) => {
  const [localColor, setLocalColor] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Update local color when prop changes
  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    onChange(color);
    
    // Apply color immediately to CSS variables for preview
    document.documentElement.style.setProperty('--primary', `${hexToHsl(color)}`);
  };

  const resetToDefault = () => {
    const defaultColor = '#3b82f6';
    handleColorChange(defaultColor);
    setIsOpen(false);
    toast({
      title: "Color Reset",
      description: "Primary color has been reset to default blue.",
    });
  };

  // Convert hex to HSL for CSS variables
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

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

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-warm-text">Primary Color</div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="bg-ceramic-base"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-border shadow-sm"
                style={{ backgroundColor: localColor }}
              />
              <Palette className="w-3 h-3" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 bg-ceramic-base" align="end">
          <div className="space-y-4">
            <div className="text-center">
              <h5 className="font-medium text-warm-text">Choose Primary Color</h5>
              <p className="text-xs text-muted-foreground mt-1">
                This color will be used throughout the app
              </p>
            </div>
            
            <HexColorPicker 
              color={localColor} 
              onChange={handleColorChange}
              style={{ width: '200px', height: '120px' }}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                {localColor.toUpperCase()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="text-xs"
              >
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[
                '#3b82f6', // Blue
                '#10b981', // Emerald
                '#f59e0b', // Amber
                '#ef4444', // Red
                '#8b5cf6', // Violet
                '#06b6d4', // Cyan
                '#84cc16', // Lime
                '#f97316', // Orange
              ].map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange(presetColor)}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors shadow-sm"
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};