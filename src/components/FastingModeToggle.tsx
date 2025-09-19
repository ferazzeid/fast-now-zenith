import React from "react";
import { Lock } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FastingModeToggleProps {
  currentMode: 'fasting' | 'if';
  onModeChange: (mode: 'fasting' | 'if') => void;
  showIF?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export const FastingModeToggle: React.FC<FastingModeToggleProps> = ({
  currentMode,
  onModeChange,
  showIF = false,
  disabled = false,
  disabledReason = "You already have a fast running. Please finish it before starting a different type."
}) => {
  if (!showIF) {
    return null; // Don't show toggle if IF is not enabled
  }

  const handleModeChange = (value: string | undefined) => {
    // Prevent mode change if disabled
    if (disabled) return;
    
    // More robust handling - ensure we have a valid value
    if (value === 'fasting' || value === 'if') {
      onModeChange(value);
    }
  };

  const toggleContent = (
    <ToggleGroup 
      type="single" 
      value={currentMode} 
      onValueChange={handleModeChange}
      className={`bg-muted rounded-md p-0.5 shadow-sm shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      size="sm"
      disabled={disabled}
    >
      <ToggleGroupItem 
        value="fasting" 
        className={`h-5 px-2 text-xs font-medium w-[24px] cursor-pointer flex items-center justify-center ${
          disabled ? 'cursor-not-allowed opacity-75' : 'data-[state=on]:bg-background data-[state=on]:shadow-sm'
        }`}
        aria-label="Extended Fasting Mode"
        disabled={disabled}
      >
        {disabled && <Lock className="w-3 h-3" />}
        {!disabled && 'E'}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="if" 
        className={`h-5 px-2 text-xs font-medium w-[24px] cursor-pointer flex items-center justify-center ${
          disabled ? 'cursor-not-allowed opacity-75' : 'data-[state=on]:bg-background data-[state=on]:shadow-sm'
        }`}
        aria-label="Intermittent Fasting Mode"
        disabled={disabled}
      >
        {disabled && <Lock className="w-3 h-3" />}
        {!disabled && 'I'}
      </ToggleGroupItem>
    </ToggleGroup>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {toggleContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm max-w-48">{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return toggleContent;
};