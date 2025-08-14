import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HeightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const HeightSelector = ({ value, onChange, className }: HeightSelectorProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={className}>
      <Label htmlFor="height" className="text-sm font-medium mb-2 block">
        Height (cm)
      </Label>
      <Input
        id="height"
        type="number"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Enter height in cm"
        min="100"
        max="250"
        step="1"
      />
    </div>
  );
};