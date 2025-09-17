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
    <div className="absolute top-0 right-0 z-50">
      <div className="bg-muted rounded-md p-0.5 flex">
        <Button
          variant={currentMode === 'fasting' ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🟢 Extended button clicked, switching to fasting');
            console.log('Current mode before switch:', currentMode);
            onModeChange('fasting');
          }}
          className="h-6 px-2 text-xs font-medium pointer-events-auto"
        >
          Extended
        </Button>
        
        <Button
          variant={currentMode === 'if' ? "default" : "ghost"}
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔴 Intermittent button clicked, switching to if');
            console.log('Current mode before switch:', currentMode);
            onModeChange('if');
          }}
          className="h-6 px-2 text-xs font-medium pointer-events-auto"
        >
          Intermittent
        </Button>
      </div>
    </div>
  );
};