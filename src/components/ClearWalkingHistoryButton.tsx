import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { ConfirmationModal } from '@/components/ui/universal-modal';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';

export const ClearWalkingHistoryButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { isLoading: isClearing, execute } = useStandardizedLoading();
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useWalkingSession();

  const handleClearHistory = async () => {
    if (!user) return;

    await execute(async () => {
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Trigger refresh of walking history
      console.log('Triggering walking history refresh after clear');
      triggerRefresh();

      toast({
        title: "Success",
        description: "Walking history permanently deleted",
      });
    }, {
      onError: (error) => {
        console.error('Error clearing walking history:', error);
        toast({
          title: "Error",
          description: "Failed to delete walking history",
          variant: "destructive",
        });
      }
    });
    
    setShowConfirm(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Delete All History
      </Button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleClearHistory}
        title="Delete Walking History"
        message="This will permanently delete all your walking session history. This action cannot be undone. Your walking data will be completely removed from our servers."
        confirmText={isClearing ? 'Deleting...' : 'Permanently Delete'}
        variant="destructive"
      />
    </>
  );
};