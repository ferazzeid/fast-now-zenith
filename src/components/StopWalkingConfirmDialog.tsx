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
}

export const StopWalkingConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  currentDuration,
  calories,
  distance
}: StopWalkingConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop Walking Session?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to stop your walking session? You've been walking for {currentDuration || '0:00:00'}.
            {calories && distance && (
              <div className="mt-2 text-sm">
                <div>Calories burned: <span className="font-medium">{calories}</span></div>
                <div>Distance: <span className="font-medium">{distance} miles</span></div>
              </div>
            )}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Walking</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Stop Walking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};