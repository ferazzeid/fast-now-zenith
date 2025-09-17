import React from "react";
import { Button } from "@/components/ui/button";

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
    <div className="absolute top-0 right-0">
      <div className="bg-muted p-0.5 rounded-md flex text-xs">
        <Button
          variant={currentMode === 'fasting' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('fasting')}
          className="h-6 px-2 text-xs font-medium"
        >
          Extended
        </Button>
        
        <Button
          variant={currentMode === 'if' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('if')}
          className="h-6 px-2 text-xs font-medium"
        >
          Intermittent
        </Button>
      </div>
    </div>
  );
};