import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernNumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export const ModernNumberPicker = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 999, 
  step = 1, 
  suffix = '',
  className 
}: ModernNumberPickerProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString());
    }
  };

  return (
    <div className={cn("flex items-center border rounded-lg bg-background", className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="p-3 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          className="w-full text-center border-0 bg-transparent focus:ring-0 focus:outline-none text-lg font-medium py-3"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="p-3 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  );
};