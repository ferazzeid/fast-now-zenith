import { useState } from 'react';
import { X, Clock, Utensils, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UniversalModal } from '@/components/ui/universal-modal';
import { cn } from '@/lib/utils';

interface IFScheduleSelectorProps {
  onSelect: (fastingHours: number, eatingHours: number, customStartTime?: Date) => void;
  onClose: () => void;
}

const IF_PRESETS = [
  { name: '16:8', fastingHours: 16, eatingHours: 8 },
  { name: '18:6', fastingHours: 18, eatingHours: 6 },
  { name: '23:1', fastingHours: 23, eatingHours: 1 }
];

export const IFScheduleSelector = ({
  onSelect,
  onClose
}: IFScheduleSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<typeof IF_PRESETS[0] | null>(null);
  const [customFastingHours, setCustomFastingHours] = useState([16]);
  const [hasCustomSelection, setHasCustomSelection] = useState(false);
  const [sliderTouched, setSliderTouched] = useState(false);
  const [startInPast, setStartInPast] = useState(false);
  const [hoursAgo, setHoursAgo] = useState(6);

  const customEatingHours = 24 - customFastingHours[0];

  const handlePresetSelect = (preset: typeof IF_PRESETS[0]) => {
    setSelectedPreset(preset);
    setHasCustomSelection(false);
    setSliderTouched(false);
  };

  const handleCustomChange = (hours: number[]) => {
    setCustomFastingHours(hours);
    setSelectedPreset(null);
    setHasCustomSelection(true);
    setSliderTouched(true);
  };

  const handleConfirm = () => {
    const customStartTime = startInPast 
      ? new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      : undefined;
      
    if (selectedPreset) {
      onSelect(selectedPreset.fastingHours, selectedPreset.eatingHours, customStartTime);
    } else if (hasCustomSelection && sliderTouched) {
      onSelect(customFastingHours[0], customEatingHours, customStartTime);
    }
  };

  const canConfirm = selectedPreset || (hasCustomSelection && sliderTouched);

  const getSelectedDisplay = () => {
    if (selectedPreset) {
      return selectedPreset.name;
    } else if (hasCustomSelection && sliderTouched) {
      return `${customFastingHours[0]}:${customEatingHours}`;
    }
    return 'Select Schedule';
  };

  return (
    <UniversalModal isOpen={true} onClose={onClose} title="Select Schedule">
      <div className="space-y-4 p-4">

        {/* Quick Presets */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Presets</h3>
          <div className="grid grid-cols-3 gap-2">
            {IF_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "text-center p-2 rounded border transition-all duration-200",
                  selectedPreset?.name === preset.name
                    ? "border-accent bg-accent/20 text-accent-foreground font-medium"
                    : "border-border bg-muted hover:border-muted-foreground/50 hover:bg-muted/80"
                )}
              >
                <div className="font-bold text-lg">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Schedule - Always Visible */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Custom Schedule</h3>
          <div className={cn(
            "space-y-3 p-3 rounded-lg border transition-all duration-200",
            hasCustomSelection && sliderTouched
              ? "border-accent bg-accent/10"
              : "border-border bg-muted/30"
          )}>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Fasting Window: {customFastingHours[0]} hours
              </Label>
              <Slider
                value={customFastingHours}
                onValueChange={handleCustomChange}
                min={12}
                max={23}
                step={1}
                className={cn(
                  "w-full",
                  hasCustomSelection && sliderTouched && "[&_[data-orientation=horizontal]]:bg-accent/20"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12h</span>
                <span>23h</span>
              </div>
            </div>
            
            {/* Only show values when slider has been touched */}
            {sliderTouched && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-background rounded border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium text-xs">Fast</span>
                  </div>
                  <div className="text-lg font-bold">{customFastingHours[0]}h</div>
                </div>
                <div className="text-center p-2 bg-background rounded border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Utensils className="w-3 h-3" />
                    <span className="font-medium text-xs">Eat</span>
                  </div>
                  <div className="text-lg font-bold">{customEatingHours}h</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start Time Options */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={() => setStartInPast(false)}
              variant={!startInPast ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              Now
            </Button>
            <Button
              onClick={() => setStartInPast(true)}
              variant={startInPast ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              Past
            </Button>
          </div>
          
          {startInPast && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Hours Ago: {hoursAgo}h
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setHoursAgo(Math.max(1, hoursAgo - 1))}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    disabled={hoursAgo <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center font-mono text-lg font-bold">
                    {hoursAgo}h
                  </div>
                  <Button
                    onClick={() => setHoursAgo(Math.min(24, hoursAgo + 1))}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    disabled={hoursAgo >= 24}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Start time: {new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Button - Large */}
        <div className="pt-2">
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            variant={canConfirm ? "action-primary" : "outline"}
            size="start-button"
            className={cn(
              "w-full text-lg py-4 transition-all duration-200",
              !canConfirm && "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-muted-foreground/20"
            )}
          >
            {!canConfirm 
              ? "Select Schedule First" 
              : (startInPast ? "Start Past Fast" : "Start Fast")
            }
          </Button>
        </div>
      </div>
    </UniversalModal>
  );
};