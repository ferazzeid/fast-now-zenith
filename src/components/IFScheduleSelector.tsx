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
  { name: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular schedule' },
  { name: 'OMAD', fastingHours: 23, eatingHours: 1, description: 'One meal a day' }
];

export const IFScheduleSelector = ({
  onSelect,
  onClose
}: IFScheduleSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<typeof IF_PRESETS[0] | null>(null);
  const [customFastingHours, setCustomFastingHours] = useState([16]);
  const [showCustom, setShowCustom] = useState(false);

  const customEatingHours = 24 - customFastingHours[0];

  const handlePresetSelect = (preset: typeof IF_PRESETS[0]) => {
    setSelectedPreset(preset);
    setShowCustom(false);
  };

  const handleCustomSelect = () => {
    setSelectedPreset(null);
    setShowCustom(true);
  };

  const handleConfirm = () => {
    if (selectedPreset) {
      onSelect(selectedPreset.fastingHours, selectedPreset.eatingHours);
    } else if (showCustom) {
      onSelect(customFastingHours[0], customEatingHours);
    }
  };

  const canConfirm = selectedPreset || showCustom;

  return (
    <UniversalModal isOpen={true} onClose={onClose} title="Select IF Schedule">
      <div className="space-y-6 p-6">
        {/* Preset Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Presets</h3>
          <div className="grid grid-cols-1 gap-3">
            {IF_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200",
                  selectedPreset?.name === preset.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{preset.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {preset.fastingHours}h fast
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      {preset.eatingHours}h eating
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Option */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Custom Schedule</h3>
          <button
            onClick={handleCustomSelect}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
              showCustom
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Custom</h4>
                <p className="text-sm text-muted-foreground">
                  Set your own schedule
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {customFastingHours[0]}h fast
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  {customEatingHours}h eating
                </div>
              </div>
            </div>
          </button>

          {/* Custom Slider */}
          {showCustom && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Fasting Window: {customFastingHours[0]} hours
                </Label>
                <Slider
                  value={customFastingHours}
                  onValueChange={setCustomFastingHours}
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
                <div className="text-center p-2 bg-background rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">Fasting</span>
                  </div>
                  <div className="text-lg font-bold">{customFastingHours[0]}h</div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Utensils className="w-3 h-3" />
                    <span className="font-medium">Eating</span>
                  </div>
                  <div className="text-lg font-bold">{customEatingHours}h</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1"
          >
            Setup Schedule
          </Button>
        </div>
      </div>
    </UniversalModal>
  );
};