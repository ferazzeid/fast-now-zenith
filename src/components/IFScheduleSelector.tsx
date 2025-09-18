import { useState } from 'react';
import { X, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UniversalModal } from '@/components/ui/universal-modal';
import { cn } from '@/lib/utils';

interface IFScheduleSelectorProps {
  onSelect: (fastingHours: number, eatingHours: number) => void;
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
  const [isCustom, setIsCustom] = useState(false);

  const customEatingHours = 24 - customFastingHours[0];

  const handlePresetSelect = (preset: typeof IF_PRESETS[0]) => {
    setSelectedPreset(preset);
    setIsCustom(false);
  };

  const handleCustomChange = (hours: number[]) => {
    setCustomFastingHours(hours);
    setSelectedPreset(null);
    setIsCustom(true);
  };

  const handleConfirm = () => {
    if (selectedPreset) {
      onSelect(selectedPreset.fastingHours, selectedPreset.eatingHours);
    } else if (isCustom) {
      onSelect(customFastingHours[0], customEatingHours);
    }
  };

  const canConfirm = selectedPreset || isCustom;

  const getSelectedDisplay = () => {
    if (selectedPreset) {
      return selectedPreset.name;
    } else if (isCustom) {
      return `${customFastingHours[0]}:${customEatingHours}`;
    }
    return 'Select Schedule';
  };

  return (
    <UniversalModal isOpen={true} onClose={onClose} title="Select Schedule">
      <div className="relative space-y-6 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Presets</h3>
          <div className="grid grid-cols-3 gap-3">
            {IF_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "text-center p-3 bg-muted rounded border border-border transition-all duration-200",
                  selectedPreset?.name === preset.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-muted-foreground/50 hover:bg-muted/80"
                )}
              >
                <div className="font-bold text-xl mb-1">{preset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {preset.fastingHours}h fast • {preset.eatingHours}h eating
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Schedule - Always Visible */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Custom Schedule</h3>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
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
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12h</span>
                <span>23h</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-background rounded border border-border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Fasting</span>
                </div>
                <div className="text-lg font-bold">{customFastingHours[0]}h</div>
              </div>
              <div className="text-center p-3 bg-background rounded border border-border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Utensils className="w-3 h-3" />
                  <span className="font-medium">Eating</span>
                </div>
                <div className="text-lg font-bold">{customEatingHours}h</div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button - Large */}
        <div className="pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            variant="action-primary"
            size="start-button"
            className="w-full text-lg py-4"
          >
            Start Fast ({getSelectedDisplay()})
          </Button>
        </div>
      </div>
    </UniversalModal>
  );
};