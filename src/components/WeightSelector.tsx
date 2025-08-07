import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ModernNumberPicker } from '@/components/ModernNumberPicker';
import { cn } from '@/lib/utils';

interface WeightSelectorProps {
  value: number; // Always in kg for consistency
  onChange: (kg: number, detectedUnits: 'metric' | 'imperial') => void;
  className?: string;
}

type WeightUnit = 'kg' | 'lb' | 'st';

export const WeightSelector = ({ value, onChange, className }: WeightSelectorProps) => {
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>('kg');
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [stoneValue, setStoneValue] = useState<number>(8);
  const [poundsValue, setPoundsValue] = useState<number>(0);

  // Convert kg to display value when unit changes
  useEffect(() => {
    switch (selectedUnit) {
      case 'kg':
        setDisplayValue(Math.round(value * 10) / 10);
        break;
      case 'lb':
        setDisplayValue(Math.round(value * 2.20462));
        break;
      case 'st':
        const totalLbs = value * 2.20462;
        const stones = Math.floor(totalLbs / 14);
        const remainingLbs = Math.round(totalLbs % 14);
        setStoneValue(stones);
        setPoundsValue(remainingLbs);
        break;
    }
  }, [value, selectedUnit]);

  const handleValueChange = (newValue: number) => {
    let kg: number;
    let detectedUnits: 'metric' | 'imperial';

    switch (selectedUnit) {
      case 'kg':
        kg = newValue;
        detectedUnits = 'metric';
        setDisplayValue(newValue);
        break;
      case 'lb':
        kg = newValue / 2.20462;
        detectedUnits = 'imperial';
        setDisplayValue(newValue);
        break;
      case 'st':
        // This won't be called for stone since we handle it separately
        kg = value;
        detectedUnits = 'imperial';
        break;
    }

    onChange(kg, detectedUnits);
  };

  const handleStoneChange = (stones: number, pounds: number) => {
    const totalLbs = stones * 14 + pounds;
    const kg = totalLbs / 2.20462;
    setStoneValue(stones);
    setPoundsValue(pounds);
    onChange(kg, 'imperial');
  };

  const units: { value: WeightUnit; label: string; examples: string }[] = [
    { value: 'kg', label: 'kg', examples: '60-90 kg' },
    { value: 'lb', label: 'lbs', examples: '130-200 lbs' },
    { value: 'st', label: 'st & lbs', examples: '9 st 7 lbs' }
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
        {selectedUnit === 'st' ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">Stone</label>
              <ModernNumberPicker
                value={stoneValue}
                onChange={(stones) => handleStoneChange(stones, poundsValue)}
                min={3}
                max={40}
                step={1}
                suffix="st"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">Pounds</label>
              <ModernNumberPicker
                value={poundsValue}
                onChange={(pounds) => handleStoneChange(stoneValue, pounds)}
                min={0}
                max={13}
                step={1}
                suffix="lbs"
              />
            </div>
          </div>
        ) : (
          <ModernNumberPicker
            value={displayValue}
            onChange={handleValueChange}
            min={selectedUnit === 'kg' ? 30 : 66}
            max={selectedUnit === 'kg' ? 300 : 660}
            step={selectedUnit === 'kg' ? 0.1 : 1}
            suffix={selectedUnit}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
};