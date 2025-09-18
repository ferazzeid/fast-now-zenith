import { useState } from 'react';
import { X, Clock, Utensils, Calendar, Check } from 'lucide-react';
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
  const [hoursAgo, setHoursAgo] = useState(6);

  const handleConfirm = () => {
    if (startInPast) {
      const startDateTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const displayTime = startDateTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      onSelect(duration * 3600, startDateTime, displayTime);
    } else {
      onSelect(duration * 3600);
    }
  };

  const isValidDateTime = () => {
    if (!startInPast) return true;
    return hoursAgo >= 1 && hoursAgo <= 72;
  };

  const getPreviewDateTime = () => {
    if (!startInPast) return '';
    const startDateTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const now = new Date();
    const isToday = startDateTime.toDateString() === now.toDateString();
    const isYesterday = startDateTime.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    let dayText = '';
    if (isToday) {
      dayText = 'Today';
    } else if (isYesterday) {
      dayText = 'Yesterday';
    } else {
      dayText = startDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    
    const timeText = startDateTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    return `Started: ${dayText} at ${timeText}`;
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
      size="sm"
      showCloseButton={true}
      contentClassName="px-4 sm:px-6 py-3 sm:py-4 max-h-[85vh] sm:max-h-[90vh]"
      footer={
        <>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-10"
            size="default"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValidDateTime()}
            className="flex-1 h-10"
            size="default"
          >
            {startInPast ? 'Start Past Fasting' : 'Start Fasting'}
          </Button>
        </>
      }
    >



        {/* Presets */}
        <div className="space-y-4 mb-6">
          <Label className="text-warm-text font-medium">Quick Presets</Label>
          <div className="grid gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant={duration === preset.hours ? "default" : "outline"}
                onClick={() => setDuration(preset.hours)}
                className={duration === preset.hours 
                  ? "justify-start bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/20" 
                  : "justify-start bg-ceramic-base border border-subtle hover:bg-ceramic-rim"
                }
              >
                <span className="font-medium">{preset.name}</span>
                {duration === preset.hours && (
                  <Check className="ml-2 w-4 h-4 text-primary-foreground" />
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
        <div className="space-y-4 p-3 sm:p-4 rounded-lg bg-ceramic-base/30 border-subtle/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-foreground" />
              <Label className="text-warm-text font-medium text-sm sm:text-base">Start fast in the past</Label>
            </div>
            <Switch
              checked={startInPast}
              onCheckedChange={setStartInPast}
            />
          </div>
          
          {startInPast && (
            <div className="space-y-4 pt-2">
              {/* Hours Ago Slider */}
              <div className="space-y-3">
                <Label className="text-warm-text text-xs sm:text-sm">
                  Hours Ago: {hoursAgo}h
                </Label>
                <Slider
                  value={[hoursAgo]}
                  onValueChange={(value) => setHoursAgo(value[0])}
                  max={72}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-foreground" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    {getPreviewDateTime()}
                  </span>
                </div>
              </div>

              {!isValidDateTime() && (
                <p className="text-red-500 text-xs">Please enter a valid number of hours (1-72)</p>
              )}
            </div>
          )}
        </div>


    </UniversalModal>
  );
};