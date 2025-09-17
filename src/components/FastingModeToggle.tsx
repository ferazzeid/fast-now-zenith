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
    <div className="bg-background border-2 border-border/50 rounded-lg p-0.5 flex shadow-sm">
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
        className={`h-8 px-3 text-xs font-semibold transition-all duration-300 ${
          currentMode === 'fasting' 
            ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
            : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
        }`}
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
        className={`h-8 px-3 text-xs font-semibold transition-all duration-300 ${
          currentMode === 'if' 
            ? 'bg-blue-500 text-white shadow-sm scale-105 hover:bg-blue-600' 
            : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
        }`}
      >
        Intermittent
      </Button>
    </div>
  );
};