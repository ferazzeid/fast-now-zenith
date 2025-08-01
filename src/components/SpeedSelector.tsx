import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge } from 'lucide-react';

interface SpeedSelectorProps {
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  units?: 'metric' | 'imperial';
}

// Static speed mappings - direct mapping between display options and MPH storage values
const SPEED_MAPPINGS = {
  metric: [
    { displaySpeed: 3, storageSpeed: 1.9, label: 'Slow (3 km/h)', description: 'Leisurely stroll' },
    { displaySpeed: 5, storageSpeed: 3.1, label: 'Average (5 km/h)', description: 'Comfortable pace' },
    { displaySpeed: 6, storageSpeed: 3.7, label: 'Brisk (6 km/h)', description: 'Energetic walk' },
    { displaySpeed: 8, storageSpeed: 5.0, label: 'Fast (8 km/h)', description: 'Power walking' }
  ],
  imperial: [
    { displaySpeed: 2, storageSpeed: 2.0, label: 'Slow (2 mph)', description: 'Leisurely stroll' },
    { displaySpeed: 3, storageSpeed: 3.0, label: 'Average (3 mph)', description: 'Comfortable pace' },
    { displaySpeed: 4, storageSpeed: 4.0, label: 'Brisk (4 mph)', description: 'Energetic walk' },
    { displaySpeed: 5, storageSpeed: 5.0, label: 'Fast (5 mph)', description: 'Power walking' }
  ]
};

const getSpeedOptions = (units: 'metric' | 'imperial') => {
  return SPEED_MAPPINGS[units];
};

export const SpeedSelector = ({ selectedSpeed, onSpeedChange, disabled, units = 'imperial' }: SpeedSelectorProps) => {
  const speedOptions = getSpeedOptions(units);
  
  // Find the current display speed by matching the stored speed to the closest mapping
  const currentMapping = speedOptions.find(option => 
    Math.abs(option.storageSpeed - selectedSpeed) < 0.1
  ) || speedOptions[1]; // Default to average speed if no match
  
  console.log('SpeedSelector render:', { selectedSpeed, currentMapping, units });
  
  // Handle speed change using static mapping
  const handleSpeedChange = (value: string) => {
    const displaySpeedValue = Number(value);
    const mapping = speedOptions.find(option => option.displaySpeed === displaySpeedValue);
    if (mapping) {
      onSpeedChange(mapping.storageSpeed);
    }
  };
  
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Walking Speed {units === 'metric' ? '(km/h)' : '(mph)'}</span>
      </div>
      <Select
        key={`${selectedSpeed}-${units}`} // Force re-render when speed or units change
        value={currentMapping.displaySpeed.toString()}
        onValueChange={handleSpeedChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Select walking speed" />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          {speedOptions.map((option) => (
            <SelectItem key={option.displaySpeed} value={option.displaySpeed.toString()}>
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