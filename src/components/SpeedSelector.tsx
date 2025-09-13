import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge } from 'lucide-react';

interface SpeedSelectorProps {
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

// Simplified speed mappings - just Normal and Fast options
const SPEED_OPTIONS = [
  { displaySpeed: 'normal', storageSpeed: 3.1, label: 'Normal', description: 'Sustainable pace, light-moderate cardio' },
  { displaySpeed: 'fast', storageSpeed: 4.3, label: 'Fast', description: 'Intense pace, higher calorie burn' }
];

export const SpeedSelector = ({ selectedSpeed, onSpeedChange, disabled }: SpeedSelectorProps) => {
  // Find the current display speed by matching the stored speed to the closest mapping
  // Use improved tolerance and fallback logic for better matching
  const findSpeedMapping = (speed: number) => {
    // First try exact match with generous tolerance
    let match = SPEED_OPTIONS.find(option => 
      Math.abs(option.storageSpeed - speed) < 0.5
    );
    
    // If no match, find the closest option
    if (!match) {
      match = SPEED_OPTIONS.reduce((closest, option) => {
        const currentDiff = Math.abs(option.storageSpeed - speed);
        const closestDiff = Math.abs(closest.storageSpeed - speed);
        return currentDiff < closestDiff ? option : closest;
      });
    }
    
    return match;
  };
  
  const currentMapping = findSpeedMapping(selectedSpeed);
  
  // Handle speed change using static mapping
  const handleSpeedChange = (value: string) => {
    const mapping = SPEED_OPTIONS.find(option => option.displaySpeed === value);
    if (mapping) {
      onSpeedChange(mapping.storageSpeed);
    }
  };
  
  // Don't render until we have a valid speed to prevent showing wrong initial state
  if (!selectedSpeed || selectedSpeed === 0) {
    return (
      <div className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Walking Speed</span>
        </div>
        <div className="h-10 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Walking Speed</span>
      </div>
      <Select
        value={currentMapping.displaySpeed}
        onValueChange={handleSpeedChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue>
            <div className="flex flex-col">
              <span className="font-medium">{currentMapping.label}</span>
              <span className="text-xs text-muted-foreground">{currentMapping.description}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          {SPEED_OPTIONS.map((option) => (
            <SelectItem key={option.displaySpeed} value={option.displaySpeed}>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};