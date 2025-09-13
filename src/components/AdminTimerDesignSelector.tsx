import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTimerDesign, TimerDesign } from '@/hooks/useTimerDesign';

export const AdminTimerDesignSelector: React.FC = () => {
  const { timerDesign, isLoading, updateTimerDesign, isUpdating } = useTimerDesign();

  const handleDesignChange = (value: TimerDesign) => {
    updateTimerDesign(value);
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Timer Design
          </Label>
          <RadioGroup 
            value={timerDesign} 
            onValueChange={handleDesignChange}
            disabled={isUpdating}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ceramic" id="ceramic" />
              <Label htmlFor="ceramic" className="text-xs">
                Ceramic
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="metaverse" id="metaverse" />
              <Label htmlFor="metaverse" className="text-xs">
                Metaverse
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};