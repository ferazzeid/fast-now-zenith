import { useState } from 'react';
import { X, Clock, Utensils, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UniversalModal } from '@/components/ui/universal-modal';

interface FastSelectorProps {
  currentDuration: number;
  onSelect: (duration: number, startDateTime?: Date, displayTime?: string) => void;
  onClose: () => void;
}

export const FastSelector = ({
  currentDuration,
  onSelect,
  onClose
}: FastSelectorProps) => {
  const [duration, setDuration] = useState(() => {
    return Math.floor(currentDuration / 3600) || 60;
  });
  const [startInPast, setStartInPast] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('12:00');

  const handleConfirm = () => {
    if (startInPast) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      onSelect(duration * 3600, startDateTime, startTime);
    } else {
      onSelect(duration * 3600);
    }
  };

  const isValidDateTime = () => {
    if (!startInPast) return true;
    const selectedDateTime = new Date(`${startDate}T${startTime}`);
    return selectedDateTime < new Date();
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  const presets = [
    { name: '24 Hour Fast', hours: 24 },
    { name: '48 Hour Fast', hours: 48 },
    { name: '60 Hour Fast', hours: 60, recommended: true },
    { name: '72 Hour Fast', hours: 72 },
  ];

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="Configure Fast"
      variant="standard"
      size="md"
      showCloseButton={true}
      contentClassName="px-4 sm:px-6 py-3 sm:py-4 max-h-[85vh] sm:max-h-[90vh]"
      footer={
        <div className="flex gap-3 w-full px-4 sm:px-6 py-3 sm:py-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValidDateTime()}
            className="flex-1"
          >
            {startInPast ? 'Start Past Fasting' : 'Start Fasting'}
          </Button>
        </div>
      }
    >



        {/* Presets */}
        <div className="space-y-4 mb-6">
          <Label className="text-warm-text font-medium">Quick Presets</Label>
          <div className="grid gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant={preset.recommended ? "default" : "outline"}
                onClick={() => setDuration(preset.hours)}
                className={preset.recommended 
                  ? "justify-start bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/20" 
                  : "justify-start bg-ceramic-base border-ceramic-rim hover:bg-ceramic-rim"
                }
              >
                <span className="font-medium">{preset.name}</span>
                {preset.recommended && (
                  <span className="ml-2 text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
                <span className="ml-auto text-muted-foreground text-sm">
                  {preset.hours} hours
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="space-y-4 mb-6">
          <div className="space-y-3">
            <Label className="text-warm-text font-medium">
              Fast Duration: {duration}h
            </Label>
            <Slider
              value={[duration]}
              onValueChange={(value) => handleDurationChange(value[0])}
              max={168}
              min={24}
              step={1}
              defaultValue={[60]}
              className="w-full"
            />
          </div>
        </div>

        {/* Start in Past Section */}
        <div className="space-y-4 mb-2 p-3 sm:p-4 rounded-lg bg-ceramic-base/30 border border-ceramic-rim/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Label className="text-warm-text font-medium text-sm sm:text-base">Start fast in the past</Label>
            </div>
            <Switch
              checked={startInPast}
              onCheckedChange={setStartInPast}
            />
          </div>
          
          {startInPast && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-2">
                  <Label className="text-warm-text text-xs sm:text-sm">Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-warm-text text-xs sm:text-sm">Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
              {!isValidDateTime() && (
                <p className="text-red-500 text-xs">Please select a date and time in the past</p>
              )}
            </div>
          )}
        </div>


    </UniversalModal>
  );
};