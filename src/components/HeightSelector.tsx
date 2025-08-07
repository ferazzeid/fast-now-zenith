import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

  const units: { value: HeightUnit; label: string; examples: string }[] = [
    { value: 'cm', label: 'cm', examples: '150-200 cm' },
    { value: 'ft', label: 'ft & in', examples: '5\' 8"' }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Unit selector */}
      <div className="flex gap-2">
        {units.map((unit) => (
          <Button
            key={unit.value}
            variant={selectedUnit === unit.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedUnit(unit.value)}
            className="flex-1"
          >
            <div className="text-center">
              <div className="font-medium">{unit.label}</div>
              <div className="text-xs opacity-70">{unit.examples}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Value input */}
      <div className="space-y-2">
        {selectedUnit === 'ft' ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">Feet</label>
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
              <label className="text-sm text-muted-foreground block mb-1">Inches</label>
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
        ) : (
          <ModernNumberPicker
            value={displayValue}
            onChange={handleValueChange}
            min={100}
            max={250}
            step={1}
            suffix="cm"
            className="w-full"
          />
        )}
      </div>
    </div>
  );
};