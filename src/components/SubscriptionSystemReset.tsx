import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedCacheManager } from '@/hooks/useUnifiedCacheManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const SubscriptionSystemReset: React.FC = () => {
  const { clearAllCache } = useUnifiedCacheManager();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCompleteReset = async () => {
    toast({
      title: "Resetting Subscription System",
      description: "Clearing all caches and refreshing data...",
    });

    try {
      await clearAllCache();
      
      toast({
        title: "System Reset Complete",
        description: "All subscription data has been refreshed.",
      });
    } catch (error) {
      console.error('Complete reset failed:', error);
      toast({
        title: "Reset Failed",
        description: "There was an error resetting the system. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found to delete",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
    );

    if (!confirmed) return;

    setIsDeleting(true);
    
    try {
      console.log('🗑️ Starting account deletion process...');
      
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('❌ Account deletion error:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      console.log('✅ Account deletion response:', data);

      if (data?.scheduled) {
        toast({
          title: "Account Deletion Scheduled",
          description: data.message,
          duration: 10000
        });
      } else {
        toast({
          title: "Account Deleted",
          description: data?.message || "Your account has been successfully deleted.",
          duration: 5000
        });
        
        // Sign out and redirect
        setTimeout(async () => {
          await signOut();
          window.location.href = '/';
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ Delete account failed:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Subscription Issues Detected
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            If you're experiencing subscription inconsistencies, use this button to completely reset and refresh all subscription data.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleCompleteReset}
              variant="outline"
              size="sm"
              className="bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Complete System Reset
            </Button>
            
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};