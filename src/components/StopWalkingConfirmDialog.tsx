import { UniversalModal } from "@/components/ui/universal-modal";
import { Button } from "@/components/ui/button";

interface StopWalkingConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentDuration?: string;
  calories?: number;
  distance?: number;
  units?: 'metric' | 'imperial';
  actionType?: 'finish' | 'cancel';
}

export const StopWalkingConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  currentDuration,
  calories,
  distance,
  units = 'imperial',
  actionType = 'finish'
}: StopWalkingConfirmDialogProps) => {
  const handleClose = () => onOpenChange(false);

  return (
    <UniversalModal
      isOpen={open}
      onClose={handleClose}
      title={actionType === 'cancel' ? 'Cancel Walking Session?' : 'Finish Walking Session?'}
      size="small"
      showCloseButton={false}
      footer={
        <div className="flex justify-start gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="text-sm"
          >
            Continue Walking
          </Button>
          <Button 
            variant="action-primary"
            size="action-main"
            onClick={onConfirm}
            className="text-sm"
          >
            {actionType === 'cancel' ? 'Cancel Session' : 'Finish Session'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          You've been walking for <span className="font-medium text-foreground">{currentDuration || '0:00:00'}</span>.
        </p>
        
        {calories && distance && (
          <div className="space-y-2 text-xs bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex justify-between">
              <span>Calories:</span>
              <span className="font-medium">{calories}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-medium">{distance} {units === 'metric' ? 'km' : 'miles'}</span>
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground font-medium bg-muted/30 rounded-lg p-3 border border-border">
          {actionType === 'cancel' 
            ? 'This will remove your session from history completely.'
            : 'This will save your walking progress to history.'
          }
        </div>
      </div>
    </UniversalModal>
  );
};