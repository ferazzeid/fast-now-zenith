import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeightSelectorProps {
  value: string;
  units: 'metric' | 'imperial';
  onChange: (value: string) => void;
  className?: string;
}

export const WeightSelector = ({ value, units, onChange, className }: WeightSelectorProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const label = units === 'metric' ? 'Weight (kg)' : 'Weight (lbs)';
  const placeholder = units === 'metric' ? 'Enter weight in kg' : 'Enter weight in lbs';

  return (
    <div className={className}>
      <Label htmlFor="weight" className="text-sm font-medium mb-2 block">
        {label}
      </Label>
      <Input
        id="weight"
        type="number"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        min="1"
        max={units === 'metric' ? "300" : "660"}
        step="0.1"
      />
    </div>
  );
};