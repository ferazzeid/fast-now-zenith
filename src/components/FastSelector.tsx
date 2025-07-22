import { useState } from 'react';
import { X, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface FastSelectorProps {
  currentType: 'intermittent' | 'longterm';
  currentDuration: number;
  currentEatingWindow: number;
  onSelect: (type: 'intermittent' | 'longterm', duration: number, eatingWindow: number) => void;
  onClose: () => void;
}

export const FastSelector = ({
  currentType,
  currentDuration,
  currentEatingWindow,
  onSelect,
  onClose
}: FastSelectorProps) => {
  const [selectedType, setSelectedType] = useState<'intermittent' | 'longterm'>(currentType);
  const [duration, setDuration] = useState(Math.floor(currentDuration / 3600));
  const [eatingWindow, setEatingWindow] = useState(Math.floor(currentEatingWindow / 3600));

  const handleConfirm = () => {
    onSelect(selectedType, duration * 3600, eatingWindow * 3600);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (selectedType === 'intermittent') {
      // For intermittent fasting, ensure duration + eating window = 24 hours
      setEatingWindow(24 - newDuration);
    }
  };

  const handleEatingWindowChange = (newEatingWindow: number) => {
    setEatingWindow(newEatingWindow);
    if (selectedType === 'intermittent') {
      // For intermittent fasting, ensure duration + eating window = 24 hours
      setDuration(24 - newEatingWindow);
    }
  };

  const presets = {
    intermittent: [
      { name: '16:8 Fast', fast: 16, eating: 8 },
      { name: 'OMAD (23:1)', fast: 23, eating: 1 },
    ],
    longterm: [
      { name: '24 Hour Fast', hours: 24 },
      { name: '48 Hour Fast', hours: 48 },
      { name: '72 Hour Fast', hours: 72 },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl p-6 w-full max-w-md border border-ceramic-rim shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-warm-text">Select Fast Type</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Fast Type Selection */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedType === 'intermittent' ? 'default' : 'outline'}
              onClick={() => setSelectedType('intermittent')}
              className={`h-20 flex-col space-y-2 ${
                selectedType === 'intermittent' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-ceramic-base border-ceramic-rim'
              }`}
            >
              <Utensils className="w-5 h-5" />
              <span className="text-sm font-medium">Intermittent</span>
            </Button>
            
            <Button
              variant={selectedType === 'longterm' ? 'default' : 'outline'}
              onClick={() => setSelectedType('longterm')}
              className={`h-20 flex-col space-y-2 ${
                selectedType === 'longterm' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-ceramic-base border-ceramic-rim'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Extended</span>
            </Button>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-4 mb-6">
          <Label className="text-warm-text font-medium">Quick Presets</Label>
          <div className="grid gap-2">
            {selectedType === 'intermittent' ? (
              presets.intermittent.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  onClick={() => {
                    setDuration(preset.fast);
                    setEatingWindow(preset.eating);
                  }}
                  className="justify-start bg-ceramic-base border-ceramic-rim hover:bg-ceramic-rim"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="ml-auto text-muted-foreground text-sm">
                    {preset.fast}h fast / {preset.eating}h eating
                  </span>
                </Button>
              ))
            ) : (
              presets.longterm.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  onClick={() => setDuration(preset.hours)}
                  className="justify-start bg-ceramic-base border-ceramic-rim hover:bg-ceramic-rim"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="ml-auto text-muted-foreground text-sm">
                    {preset.hours} hours
                  </span>
                </Button>
              ))
            )}
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
              max={selectedType === 'intermittent' ? 23 : 168}
              min={selectedType === 'intermittent' ? 1 : 24}
              step={1}
              className="w-full"
            />
          </div>

          {selectedType === 'intermittent' && (
            <div className="space-y-3">
              <Label className="text-warm-text font-medium">
                Eating Window: {eatingWindow}h
              </Label>
              <Slider
                value={[eatingWindow]}
                onValueChange={(value) => handleEatingWindowChange(value[0])}
                max={23}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Start Fast
          </Button>
        </div>
      </div>
    </div>
  );
};