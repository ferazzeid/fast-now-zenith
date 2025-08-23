import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type HeightUnit = 'cm' | 'ft' | 'in';

export const EnhancedHeightSelector = ({ value, onChange, className }: HeightSelectorProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [unit, setUnit] = useState<HeightUnit>('cm');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const convertCmToFeet = (cm: number): string => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}.${inches.toString().padStart(2, '0')}`;
  };

  const convertCmToInches = (cm: number): number => {
    return Math.round(cm / 2.54 * 10) / 10;
  };

  const convertFeetToCm = (feetString: string): number => {
    const [feet, inches] = feetString.split('.').map(Number);
    const totalInches = (feet || 0) * 12 + (inches || 0);
    return Math.round(totalInches * 2.54);
  };

  const convertInchesToCm = (inches: number): number => {
    return Math.round(inches * 2.54);
  };

  const handleUnitChange = (newUnit: HeightUnit) => {
    if (inputValue && !isNaN(Number(inputValue.replace('.', '')))) {
      let convertedValue: string;
      const currentCmValue = unit === 'cm' 
        ? Number(inputValue)
        : unit === 'ft'
          ? convertFeetToCm(inputValue)
          : convertInchesToCm(Number(inputValue));

      if (newUnit === 'cm') {
        convertedValue = currentCmValue.toString();
      } else if (newUnit === 'ft') {
        convertedValue = convertCmToFeet(currentCmValue);
      } else { // 'in'
        convertedValue = convertCmToInches(currentCmValue).toString();
      }

      setInputValue(convertedValue);
      // Always store in cm
      onChange(currentCmValue.toString());
    }
    setUnit(newUnit);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    if (newValue) {
      let cmValue: number;
      
      if (unit === 'cm' && !isNaN(Number(newValue))) {
        cmValue = Number(newValue);
      } else if (unit === 'ft' && /^\d+\.\d*$/.test(newValue)) {
        cmValue = convertFeetToCm(newValue);
      } else if (unit === 'in' && !isNaN(Number(newValue))) {
        cmValue = convertInchesToCm(Number(newValue));
      } else if (!newValue) {
        onChange('');
        return;
      } else {
        return; // Invalid input for current unit
      }
      
      onChange(cmValue.toString());
    } else {
      onChange('');
    }
  };

  const getValidationProps = () => {
    if (unit === 'cm') {
      return { 
        min: 100, 
        max: 250, 
        step: 1,
        placeholder: "Enter height in cm" 
      };
    } else if (unit === 'ft') {
      return { 
        min: 3.03, 
        max: 8.02, 
        step: 0.01,
        placeholder: "e.g. 5.08 (5'8\")" 
      };
    } else {
      return { 
        min: 39, 
        max: 98, 
        step: 0.1,
        placeholder: "Enter height in inches" 
      };
    }
  };

  const { min, max, step, placeholder } = getValidationProps();

  return (
    <div className={className}>
      <Label htmlFor="height" className="text-sm font-medium mb-2 block">
        Height
      </Label>
      <div className="relative">
        <Input
          id="height"
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="pr-20"
        />
        <div className="absolute right-1 top-1 bottom-1">
          <Select value={unit} onValueChange={handleUnitChange}>
            <SelectTrigger className="w-16 h-8 border-0 bg-muted/30 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border min-w-16">
              <SelectItem value="cm" className="text-xs">cm</SelectItem>
              <SelectItem value="ft" className="text-xs">ft</SelectItem>
              <SelectItem value="in" className="text-xs">in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};