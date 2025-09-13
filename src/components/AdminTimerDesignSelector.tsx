import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTimerDesign, TimerDesign } from '@/hooks/useTimerDesign';
import { Loader2 } from 'lucide-react';

export const AdminTimerDesignSelector: React.FC = () => {
  const { timerDesign, isLoading, updateTimerDesign, isUpdating } = useTimerDesign();

  const handleDesignChange = (value: TimerDesign) => {
    updateTimerDesign(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timer Design</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the visual design style for the fasting timer display.
          </p>
          
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading current design...</span>
            </div>
          ) : (
            <RadioGroup 
              value={timerDesign} 
              onValueChange={handleDesignChange}
              disabled={isUpdating}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ceramic" id="ceramic" />
                <Label htmlFor="ceramic" className="text-sm font-medium">
                  Ceramic Plate Design
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Default - Warm, natural ceramic appearance)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="metaverse" id="metaverse" />
                <Label htmlFor="metaverse" className="text-sm font-medium">
                  Metaverse Design
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Futuristic glass rings with neon accents)
                </span>
              </div>
            </RadioGroup>
          )}
          
          {isUpdating && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating design...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};