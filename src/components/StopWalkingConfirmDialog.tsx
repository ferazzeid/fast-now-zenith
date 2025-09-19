import { UniversalModal } from "@/components/ui/universal-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { formatDistance } from '@/utils/unitConversions';

interface StopWalkingConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onManualDurationConfirm?: (durationMinutes: number) => void;
  currentDuration?: string;
  durationMinutes?: number;
  calories?: number;
  distance?: number;
  units?: 'metric' | 'imperial';
  actionType?: 'finish' | 'cancel';
}

export const StopWalkingConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  onManualDurationConfirm,
  currentDuration,
  durationMinutes = 0,
  calories,
  distance,
  units = 'imperial',
  actionType = 'finish'
}: StopWalkingConfirmDialogProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  
  const handleClose = () => {
    onOpenChange(false);
    setShowManualInput(false);
    setManualDuration('');
  };

  const handleManualConfirm = () => {
    const minutes = parseInt(manualDuration);
    if (minutes > 0 && onManualDurationConfirm) {
      onManualDurationConfirm(minutes);
      handleClose();
    }
  };

  // Detect long sessions (2+ hours)
  const isLongSession = durationMinutes >= 120;
  const showLongSessionWarning = actionType === 'finish' && isLongSession && !showManualInput;

  return (
    <UniversalModal
      isOpen={open}
      onClose={handleClose}
      title={
        showManualInput 
          ? 'Correct Walking Duration' 
          : actionType === 'cancel' 
            ? 'Cancel Walking Session?' 
            : 'Finish Walking Session?'
      }
      size="sm"
      showCloseButton={true}
      footer={
        showManualInput ? (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => setShowManualInput(false)}
              className="flex-1 min-h-[44px] px-2"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              variant="action-primary"
              onClick={handleManualConfirm}
              disabled={!manualDuration || parseInt(manualDuration) <= 0}
              className="flex-[2] min-h-[44px] px-4 text-sm font-medium"
            >
              Save Duration
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 min-h-[44px] px-2"
            >
              <X className="w-4 h-4" />
            </Button>
            {showLongSessionWarning && (
              <Button 
                variant="outline"
                onClick={() => setShowManualInput(true)}
                className="flex-1 min-h-[44px] px-3 text-sm"
              >
                Edit
              </Button>
            )}
            <Button 
              variant="action-primary"
              onClick={onConfirm}
              className={`min-h-[44px] px-3 text-sm font-medium ${showLongSessionWarning ? 'flex-1' : 'flex-[2]'}`}
            >
              {showLongSessionWarning ? 'Finish' : (actionType === 'cancel' ? 'Cancel Session' : 'Finish Session')}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {showManualInput ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Manual duration correction</p>
                <p>Enter how long you actually walked. Calculated data (calories, distance, steps) will be removed.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-duration">Walking Duration (minutes)</Label>
              <Input
                id="manual-duration"
                type="number"
                placeholder="e.g., 30"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                min="1"
                max="1440"
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You've been walking for <span className="font-medium text-foreground">{currentDuration || '0:00:00'}</span>.
            </p>
            
            {showLongSessionWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Long session detected</p>
                  <p>Did you forget to stop the timer? You can edit the duration if needed.</p>
                </div>
              </div>
            )}
            
            {calories && distance && (
              <Card className="space-y-2 text-xs bg-muted/50 p-3">
                <div className="flex justify-between">
                  <span>Calories:</span>
                  <span className="font-medium">{calories}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{formatDistance(distance, units)}</span>
                </div>
              </Card>
            )}
            
            <Card className="text-xs text-muted-foreground font-medium bg-muted/30 p-3">
              {actionType === 'cancel' 
                ? 'This will remove your session from history completely.'
                : 'This will save your walking progress to history.'
              }
            </Card>
          </>
        )}
      </div>
    </UniversalModal>
  );
};