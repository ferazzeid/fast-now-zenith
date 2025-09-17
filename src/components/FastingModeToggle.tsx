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
  console.log('FastingModeToggle rendered with mode:', currentMode, 'showIF:', showIF);
  
  if (!showIF) {
    return null; // Don't show toggle if IF is not enabled
  }

  return (
    <div className="absolute top-0 right-0">
      <div className="bg-muted rounded-md p-0.5 flex">
        <Button
          variant={currentMode === 'fasting' ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            console.log('Extended button clicked, switching to fasting');
            onModeChange('fasting');
          }}
          className="h-6 px-2 text-xs font-medium"
        >
          Extended
        </Button>
        
        <Button
          variant={currentMode === 'if' ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            console.log('Intermittent button clicked, switching to if');
            onModeChange('if');
          }}
          className="h-6 px-2 text-xs font-medium"
        >
          Intermittent
        </Button>
      </div>
    </div>
  );
};