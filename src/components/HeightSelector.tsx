import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernNumberPicker } from '@/components/ModernNumberPicker';
import { cn } from '@/lib/utils';

interface HeightSelectorProps {
  value: number; // Always in cm for consistency
  onChange: (cm: number, detectedUnits: 'metric' | 'imperial') => void;
  className?: string;
}

type HeightUnit = 'cm' | 'ft';

export const HeightSelector = ({ value, onChange, className }: HeightSelectorProps) => {
  const [selectedUnit, setSelectedUnit] = useState<HeightUnit>('cm');
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [feetValue, setFeetValue] = useState<number>(5);
  const [inchesValue, setInchesValue] = useState<number>(8);

  // Convert cm to display value when unit changes
  useEffect(() => {
    switch (selectedUnit) {
      case 'cm':
        setDisplayValue(Math.round(value));
        break;
      case 'ft':
        const totalInches = value / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setFeetValue(feet);
        setInchesValue(inches);
        break;
    }
  }, [value, selectedUnit]);

  const handleValueChange = (newValue: number) => {
    let cm: number;
    let detectedUnits: 'metric' | 'imperial';

    switch (selectedUnit) {
      case 'cm':
        cm = newValue;
        detectedUnits = 'metric';
        setDisplayValue(newValue);
        break;
      case 'ft':
        // This won't be called for feet since we handle it separately
        cm = value;
        detectedUnits = 'imperial';
        break;
    }

    onChange(cm, detectedUnits);
  };

  const handleFeetChange = (feet: number, inches: number) => {
    const totalInches = feet * 12 + inches;
    const cm = totalInches * 2.54;
    setFeetValue(feet);
    setInchesValue(inches);
    onChange(cm, 'imperial');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {selectedUnit === 'ft' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <ModernNumberPicker
                value={feetValue}
                onChange={(feet) => handleFeetChange(feet, inchesValue)}
                min={3}
                max={8}
                step={1}
                suffix="ft"
              />
            </div>
            <div className="flex-1">
              <ModernNumberPicker
                value={inchesValue}
                onChange={(inches) => handleFeetChange(feetValue, inches)}
                min={0}
                max={11}
                step={1}
                suffix="in"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <ModernNumberPicker
              value={displayValue}
              onChange={handleValueChange}
              min={100}
              max={250}
              step={1}
            />
          </div>
          <div className="w-24">
            <Select value={selectedUnit} onValueChange={(value: HeightUnit) => setSelectedUnit(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="ft">ft/in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};