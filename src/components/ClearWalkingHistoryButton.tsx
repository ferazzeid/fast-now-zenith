import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const ClearWalkingHistoryButton = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useWalkingSession();

  const handleClearHistory = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('walking_sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (error) throw error;

      // Trigger refresh of walking history
      console.log('Triggering walking history refresh after clear');
      triggerRefresh();

      toast({
        title: "Success",
        description: "Walking history cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing walking history:', error);
      toast({
        title: "Error",
        description: "Failed to clear walking history",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Trash2 className="w-3 h-3 mr-1" />
          Clear History
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Walking History</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your walking session history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearHistory}
            disabled={isClearing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isClearing ? 'Clearing...' : 'Clear History'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};