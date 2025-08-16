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
  const currentMapping = SPEED_OPTIONS.find(option => 
    Math.abs(option.storageSpeed - selectedSpeed) < 0.2
  ) || SPEED_OPTIONS[0]; // Default to normal speed if no match
  
  // Handle speed change using static mapping
  const handleSpeedChange = (value: string) => {
    const mapping = SPEED_OPTIONS.find(option => option.displaySpeed === value);
    if (mapping) {
      onSpeedChange(mapping.storageSpeed);
    }
  };
  
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
          <SelectValue placeholder="Select walking speed" />
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