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

  const handleModeChange = (value: string | undefined) => {
    // More robust handling - ensure we have a valid value
    if (value === 'fasting' || value === 'if') {
      onModeChange(value);
    }
  };

  return (
    <ToggleGroup 
      type="single" 
      value={currentMode} 
      onValueChange={handleModeChange}
      className="bg-muted rounded-md p-0.5 shadow-sm"
      size="sm"
    >
      <ToggleGroupItem 
        value="fasting" 
        className="h-7 px-3 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm w-[32px] cursor-pointer flex items-center justify-center"
        aria-label="Extended Fasting Mode"
      >
        E
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="if" 
        className="h-7 px-3 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm w-[32px] cursor-pointer flex items-center justify-center"
        aria-label="Intermittent Fasting Mode"
      >
        I
      </ToggleGroupItem>
    </ToggleGroup>
  );
};