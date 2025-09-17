import { UniversalModal } from "@/components/ui/universal-modal";
import { Button } from "@/components/ui/button";

interface StopFastConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentDuration?: string;
  actionType?: 'finish' | 'cancel';
}

export const StopFastConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  currentDuration,
  actionType = 'finish'
}: StopFastConfirmDialogProps) => {
  const handleClose = () => onOpenChange(false);

  return (
    <UniversalModal
      isOpen={open}
      onClose={handleClose}
      title={actionType === 'cancel' ? 'Cancel Fast?' : 'Finish Fast?'}
      size="sm"
      showCloseButton={false}
      footer={
        <>
          <Button 
            variant="secondary" 
            size="action-main"
            onClick={handleClose}
            className="text-sm w-full border border-subtle"
          >
            Close
          </Button>
          <Button 
            variant="action-primary"
            size="action-main"
            onClick={onConfirm}
            className="text-sm w-full"
          >
            {actionType === 'cancel' ? 'Cancel Fast' : 'Finish Fast'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {actionType === 'cancel' 
            ? <>Are you sure you want to cancel your fast? You've been fasting for <span className="font-medium text-foreground">{currentDuration || '0:00:00'}</span>.</>
            : <>Are you sure you want to finish your fast? You've been fasting for <span className="font-medium text-foreground">{currentDuration || '0:00:00'}</span>.</>
          }
        </p>
        
        <div className="text-xs text-muted-foreground font-medium bg-muted/30 rounded-lg p-3 border-subtle">
          {actionType === 'cancel' 
            ? 'This will remove your fast from history completely.'
            : 'This will save your fast progress to history.'
          }
        </div>
      </div>
    </UniversalModal>
  );
};