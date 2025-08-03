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
}

export const StopWalkingConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  currentDuration,
  calories,
  distance,
  units = 'imperial'
}: StopWalkingConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg">Stop Walking Session?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            You've been walking for <span className="font-medium">{currentDuration || '0:00:00'}</span>.
            {calories && distance && (
              <div className="mt-3 space-y-1 text-xs bg-muted/50 rounded-lg p-2">
                <div>Calories: <span className="font-medium">{calories}</span></div>
                <div>Distance: <span className="font-medium">{distance} {units === 'metric' ? 'km' : 'miles'}</span></div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="text-sm">Continue</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
          >
            Stop
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};