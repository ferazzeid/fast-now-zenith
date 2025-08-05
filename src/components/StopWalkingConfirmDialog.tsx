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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg">
            {actionType === 'cancel' ? 'Cancel Walking Session?' : 'Finish Walking Session?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            You've been walking for <span className="font-medium">{currentDuration || '0:00:00'}</span>.
            {calories && distance && (
              <div className="mt-3 space-y-1 text-xs bg-muted/50 rounded-lg p-2">
                <div>Calories: <span className="font-medium">{calories}</span></div>
                <div>Distance: <span className="font-medium">{distance} {units === 'metric' ? 'km' : 'miles'}</span></div>
              </div>
            )}
            {actionType === 'cancel' && (
              <div className="mt-3 text-muted-foreground font-medium text-xs">
                This will remove your session from history completely.
              </div>
            )}
            {actionType === 'finish' && (
              <div className="mt-3 text-muted-foreground font-medium text-xs">
                This will save your walking progress to history.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="text-sm">Continue Walking</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={`text-sm ${
              actionType === 'cancel' 
                ? "bg-amber-600 text-white hover:bg-amber-700" 
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {actionType === 'cancel' ? 'Cancel Session' : 'Finish Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};