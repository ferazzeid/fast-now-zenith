import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const WeightSelector = ({ value, onChange, className }: WeightSelectorProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={className}>
      <Label htmlFor="weight" className="text-sm font-medium mb-2 block">
        Weight (kg)
      </Label>
      <Input
        id="weight"
        type="number"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Enter weight in kg"
        min="30"
        max="300"
        step="0.1"
      />
    </div>
  );
};