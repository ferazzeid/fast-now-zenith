import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';

interface WeightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type WeightUnit = 'kg' | 'lb';

export const EnhancedWeightSelector = ({ value, onChange, className }: WeightSelectorProps) => {
  const { profile, updateProfile } = useProfile();
  const [inputValue, setInputValue] = useState(value);
  const [unit, setUnit] = useState<WeightUnit>('kg'); // Always default to metric

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const convertKgToLb = (kg: number): number => {
    return Math.round(kg * 2.20462 * 10) / 10;
  };

  const convertLbToKg = (lb: number): number => {
    return Math.round(lb / 2.20462 * 10) / 10;
  };

  const handleUnitChange = async (newUnit: WeightUnit) => {
    if (inputValue && !isNaN(Number(inputValue))) {
      const currentValue = Number(inputValue);
      let convertedValue: number;

      if (unit === 'kg' && newUnit === 'lb') {
        convertedValue = convertKgToLb(currentValue);
      } else if (unit === 'lb' && newUnit === 'kg') {
        convertedValue = convertLbToKg(currentValue);
      } else {
        convertedValue = currentValue;
      }

      const newDisplayValue = convertedValue.toString();
      setInputValue(newDisplayValue);
      
      // Always store in kg in the database
      const kgValue = newUnit === 'kg' ? convertedValue : convertLbToKg(convertedValue);
      onChange(kgValue.toString());
    }
    
    // Update profile units preference
    if (profile) {
      const newUnits = newUnit === 'kg' ? 'metric' : 'imperial';
      await updateProfile({ units: newUnits });
    }
    
    setUnit(newUnit);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    if (newValue && !isNaN(Number(newValue))) {
      const numValue = Number(newValue);
      // Always store in kg
      const kgValue = unit === 'kg' ? numValue : convertLbToKg(numValue);
      onChange(kgValue.toString());
    } else if (!newValue) {
      onChange('');
    }
  };

  const getValidationRange = () => {
    if (unit === 'kg') {
      return { min: 30, max: 300, step: 0.1 };
    } else {
      return { min: 66, max: 660, step: 0.1 };
    }
  };

  const { min, max, step } = getValidationRange();

  return (
    <div className={className}>
      <Label htmlFor="weight" className="text-sm font-medium mb-2 block">
        Weight
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="weight"
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="0"
          min={min}
          max={max}
          step={step}
          className="w-24 h-12 text-center text-lg font-medium"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-16 h-12 border bg-muted/30 text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border min-w-16 z-50">
            <SelectItem value="kg" className="text-sm">kg</SelectItem>
            <SelectItem value="lb" className="text-sm">lb</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};