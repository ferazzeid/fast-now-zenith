import React, { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface CustomScheduleSliderProps {
  onScheduleSelect: (fastingHours: number, eatingHours: number) => void;
  className?: string;
}

export const CustomScheduleSlider: React.FC<CustomScheduleSliderProps> = ({
  onScheduleSelect,
  className = ""
}) => {
  const [fastingHours, setFastingHours] = useState([16]); // Default to 16:8
  
  const eatingHours = 24 - fastingHours[0];
  
  const handleSliderChange = useCallback((value: number[]) => {
    setFastingHours(value);
  }, []);

  const handleSelectSchedule = () => {
    onScheduleSelect(fastingHours[0], eatingHours);
  };

  const getScheduleName = () => {
    if (fastingHours[0] === 16) return '16:8 (Popular)';
    if (fastingHours[0] === 18) return '18:6 (Moderate)';
    if (fastingHours[0] === 20) return '20:4 (Warrior)';
    if (fastingHours[0] === 23) return '23:1 (OMAD)';
    return `${fastingHours[0]}:${eatingHours} (Custom)`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Custom Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 24-Hour Timeline Visual */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
          
          {/* Visual Timeline */}
          <div className="relative h-8 bg-muted rounded-full overflow-hidden">
            {/* Fasting Period */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary/20 border-l-2 border-r-2 border-primary"
              style={{ 
                width: `${(fastingHours[0] / 24) * 100}%` 
              }}
            />
            {/* Eating Period */}
            <div 
              className="absolute top-0 h-full bg-green-500/20 border-l-2 border-r-2 border-green-500"
              style={{ 
                left: `${(fastingHours[0] / 24) * 100}%`,
                width: `${(eatingHours / 24) * 100}%` 
              }}
            />
            
            {/* Timeline markers */}
            <div className="absolute inset-0 flex justify-between items-center px-1">
              {[0, 6, 12, 18, 24].map((hour, index) => (
                <div 
                  key={hour}
                  className="w-0.5 h-6 bg-border"
                  style={{ opacity: index === 4 ? 0 : 1 }}
                />
              ))}
            </div>
          </div>
          
          {/* Labels */}
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
              <span>Fasting ({fastingHours[0]}h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></div>
              <span>Eating ({eatingHours}h)</span>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{getScheduleName()}</div>
            <div className="text-sm text-muted-foreground">
              Fast for {fastingHours[0]} hours, eat within {eatingHours} hours
            </div>
          </div>
          
          <Slider
            value={fastingHours}
            onValueChange={handleSliderChange}
            min={12}
            max={23}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12h Fast</span>
            <span>23h Fast</span>
          </div>
        </div>

        <Button 
          onClick={handleSelectSchedule}
          className="w-full"
          size="lg"
        >
          Start {fastingHours[0]}:{eatingHours} Schedule
        </Button>
      </CardContent>
    </Card>
  );
};