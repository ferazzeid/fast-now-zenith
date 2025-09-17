import React from "react";
import { Button } from "@/components/ui/button";
import { Timer, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FastingModeToggleProps {
  currentMode: 'fasting' | 'if';
  onModeChange: (mode: 'fasting' | 'if') => void;
  timerStatus: {
    fasting: { isActive: boolean; elapsedTime: number };
    if: { isActive: boolean; elapsedTime: number };
  };
  formatTime: (seconds: number) => string;
  showIF?: boolean;
}

export const FastingModeToggle: React.FC<FastingModeToggleProps> = ({
  currentMode,
  onModeChange,
  timerStatus,
  formatTime,
  showIF = false,
}) => {
  if (!showIF) {
    return null; // Don't show toggle if IF is not enabled
  }

  const activeCount = (timerStatus.fasting.isActive ? 1 : 0) + (timerStatus.if.isActive ? 1 : 0);

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="bg-muted p-1 rounded-lg flex">
        <Button
          variant={currentMode === 'fasting' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('fasting')}
          className="relative px-4 py-2"
        >
          <Timer className="w-4 h-4 mr-2" />
          Extended Fast
          {timerStatus.fasting.isActive && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {formatTime(timerStatus.fasting.elapsedTime)}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={currentMode === 'if' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('if')}
          className="relative px-4 py-2"
        >
          <Zap className="w-4 h-4 mr-2" />
          Intermittent Fast
          {timerStatus.if.isActive && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {formatTime(timerStatus.if.elapsedTime)}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};