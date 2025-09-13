import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, CheckCircle } from 'lucide-react';

interface SpeedSelectionModalProps {
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
  children: React.ReactNode;
}

const SPEED_OPTIONS = [
  { 
    storageSpeed: 3.1, 
    label: 'Normal', 
    description: 'Sustainable pace, light-moderate cardio',
    icon: Zap
  },
  { 
    storageSpeed: 4.3, 
    label: 'Fast', 
    description: 'Intense pace, higher calorie burn',
    icon: Zap
  }
];

export const SpeedSelectionModal = ({ selectedSpeed, onSpeedChange, children }: SpeedSelectionModalProps) => {
  const handleSpeedSelect = (speed: number) => {
    onSpeedChange(speed);
  };

  const getCurrentSpeedOption = () => {
    return SPEED_OPTIONS.find(option => 
      Math.abs(option.storageSpeed - selectedSpeed) < 0.3
    ) || SPEED_OPTIONS[0];
  };

  const currentOption = getCurrentSpeedOption();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Walking Speed</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {SPEED_OPTIONS.map((option) => {
            const isSelected = Math.abs(option.storageSpeed - selectedSpeed) < 0.3;
            const Icon = option.icon;
            
            return (
              <Card 
                key={option.storageSpeed}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-primary bg-primary/10 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSpeedSelect(option.storageSpeed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};