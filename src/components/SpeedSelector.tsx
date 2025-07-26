import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge } from 'lucide-react';

interface SpeedSelectorProps {
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

const speedOptions = [
  { value: 2, label: 'Slow (2 mph)', description: 'Leisurely stroll' },
  { value: 3, label: 'Average (3 mph)', description: 'Comfortable pace' },
  { value: 4, label: 'Brisk (4 mph)', description: 'Energetic walk' },
  { value: 5, label: 'Fast (5 mph)', description: 'Power walking' }
];

export const SpeedSelector = ({ selectedSpeed, onSpeedChange, disabled }: SpeedSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Walking Speed</span>
      </div>
      <Select
        value={selectedSpeed.toString()}
        onValueChange={(value) => onSpeedChange(Number(value))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select walking speed" />
        </SelectTrigger>
        <SelectContent>
          {speedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
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