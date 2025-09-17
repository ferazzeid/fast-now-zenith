import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FastingModeToggleProps {
  currentMode: 'fasting' | 'if';
  onModeChange: (mode: 'fasting' | 'if') => void;
  showIF?: boolean;
}

export const FastingModeToggle: React.FC<FastingModeToggleProps> = ({
  currentMode,
  onModeChange,
  showIF = false,
}) => {
  if (!showIF) {
    return null; // Don't show toggle if IF is not enabled
  }

  return (
    <div className="absolute top-0 right-0 z-10">{/* Added z-10 to prevent overlap issues */}
      <ToggleGroup 
        type="single" 
        value={currentMode} 
        onValueChange={(value) => value && onModeChange(value as 'fasting' | 'if')}
        className="bg-muted rounded-md p-0.5"
        size="sm"
      >
          <ToggleGroupItem 
            value="fasting" 
            className="h-6 px-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            E
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="if" 
            className="h-6 px-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            I
          </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};