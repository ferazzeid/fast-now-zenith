import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale } from 'lucide-react';

interface UnitsSelectorProps {
  selectedUnits: 'metric' | 'imperial';
  onUnitsChange: (units: 'metric' | 'imperial') => void;
  disabled?: boolean;
}

const unitsOptions = [
  { value: 'imperial', label: 'Imperial (lbs, ft/in, miles)', description: 'US units' },
  { value: 'metric', label: 'Metric (kg, cm, km)', description: 'International units' }
];

export const UnitsSelector = ({ selectedUnits, onUnitsChange, disabled }: UnitsSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Unit System</span>
      </div>
      <Select
        value={selectedUnits}
        onValueChange={(value) => onUnitsChange(value as 'metric' | 'imperial')}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select unit system" />
        </SelectTrigger>
        <SelectContent>
          {unitsOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-left">
              <div className="flex flex-col items-start">
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