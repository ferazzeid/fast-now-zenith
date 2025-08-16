import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PickerWheelProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export const PickerWheel = ({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  suffix = '',
  className 
}: PickerWheelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const values = [];
  for (let i = min; i <= max; i += step) {
    values.push(i);
  }

  const currentIndex = values.findIndex(v => v === value);
  const visibleCount = 5; // Show 5 items at once
  const itemHeight = 60;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const steps = Math.round(deltaY / itemHeight);
    const newIndex = values.findIndex(v => v === startValue) - steps;
    const clampedIndex = Math.max(0, Math.min(values.length - 1, newIndex));
    
    if (values[clampedIndex] !== value) {
      onChange(values[clampedIndex]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startY, startValue]);

  const handleValueClick = (newValue: number) => {
    onChange(newValue);
  };

  const getVisibleValues = () => {
    const centerIndex = currentIndex;
    const start = Math.max(0, centerIndex - Math.floor(visibleCount / 2));
    const end = Math.min(values.length, start + visibleCount);
    
    return values.slice(start, end).map((val, idx) => ({
      value: val,
      index: start + idx,
      isCenter: start + idx === centerIndex
    }));
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-80 w-32 mx-auto overflow-hidden select-none cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Selection highlight */}
      <div 
        className="absolute inset-x-0 bg-primary/10 border-2 border-primary/20 rounded-lg z-10 pointer-events-none"
        style={{
          top: `${Math.floor(visibleCount / 2) * itemHeight}px`,
          height: `${itemHeight}px`
        }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
      
      {/* Values */}
      <div className="flex flex-col">
        {getVisibleValues().map(({ value: val, isCenter }) => (
          <div
            key={val}
            onClick={() => handleValueClick(val)}
            className={cn(
              "flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105",
              "text-2xl font-medium",
              isCenter 
                ? "text-primary scale-110 font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ height: `${itemHeight}px` }}
          >
            {val}{suffix}
          </div>
        ))}
      </div>
    </div>
  );
};