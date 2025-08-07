import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HeightSelectorProps {
  value: string;
  units: 'metric' | 'imperial';
  onChange: (value: string) => void;
  className?: string;
}

export const HeightSelector = ({ value, units, onChange, className }: HeightSelectorProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  if (units === 'metric') {
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
  }

  // Imperial - feet and inches
  const heightInInches = parseInt(value) || 0;
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;

  const handleFeetChange = (newFeet: string) => {
    const feetNum = parseInt(newFeet) || 0;
    const totalInches = feetNum * 12 + inches;
    onChange(totalInches.toString());
  };

  const handleInchesChange = (newInches: string) => {
    const inchesNum = parseInt(newInches) || 0;
    const totalInches = feet * 12 + inchesNum;
    onChange(totalInches.toString());
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">
        Height
      </Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={feet.toString()}
            onChange={(e) => handleFeetChange(e.target.value)}
            placeholder="Feet"
            min="3"
            max="8"
          />
        </div>
        <div className="flex-1">
          <Input
            type="number"
            value={inches.toString()}
            onChange={(e) => handleInchesChange(e.target.value)}
            placeholder="Inches"
            min="0"
            max="11"
          />
        </div>
      </div>
    </div>
  );
};