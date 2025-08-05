import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionType === 'cancel' ? 'Cancel Fast?' : 'Finish Fast?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {actionType === 'cancel' ? (
              <>
                Are you sure you want to cancel your fast? You've been fasting for {currentDuration || '0:00:00'}.
                <br />
                <span className="font-medium text-muted-foreground">This will remove your fast from history completely.</span>
              </>
            ) : (
              <>
                Are you sure you want to finish your fast? You've been fasting for {currentDuration || '0:00:00'}.
                <br />
                <span className="font-medium text-muted-foreground">This will save your fast progress to history.</span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Fasting</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={actionType === 'cancel' 
              ? "bg-amber-600 text-white hover:bg-amber-700" 
              : "bg-green-600 text-white hover:bg-green-700"
            }
          >
            {actionType === 'cancel' ? 'Cancel Fast' : 'Finish Fast'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};