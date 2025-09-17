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
  console.log('FastingModeToggle rendered with mode:', currentMode, 'showIF:', showIF);
  
  if (!showIF) {
    return null; // Don't show toggle if IF is not enabled
  }

  return (
    <div className="absolute top-0 right-0">
      <ToggleGroup 
        type="single" 
        value={currentMode} 
        onValueChange={(value) => {
          console.log('ToggleGroup onValueChange called with:', value);
          if (value && (value === 'fasting' || value === 'if')) {
            onModeChange(value);
          }
        }}
        className="bg-muted rounded-md p-0.5"
        size="sm"
      >
        <ToggleGroupItem 
          value="fasting" 
          className="h-6 px-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Extended
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="if" 
          className="h-6 px-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Intermittent
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};