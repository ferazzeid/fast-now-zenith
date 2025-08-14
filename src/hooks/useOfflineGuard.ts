import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export const useOfflineGuard = () => {
  const { isOnline } = useConnectionStore();
  const { toast } = useToast();

  const guardOnlineAction = useCallback((
    action: () => Promise<void> | void,
    options: {
      offlineMessage?: string;
      requireOnline?: boolean;
      fallback?: () => void;
    } = {}
  ) => {
    const {
      offlineMessage = "This action requires an internet connection",
      requireOnline = true,
      fallback
    } = options;

    if (!isOnline && requireOnline) {
      toast({
        title: "Offline",
        description: offlineMessage,
        variant: "destructive"
      });
      
      if (fallback) {
        fallback();
      }
      return;
    }

    return action();
  }, [isOnline, toast]);

  const warnIfOffline = useCallback((message: string = "You're offline. Changes will sync when connected.") => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: message,
        variant: "default"
      });
    }
  }, [isOnline, toast]);

  return {
    isOnline,
    guardOnlineAction,
    warnIfOffline
  };
};