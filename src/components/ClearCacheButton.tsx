import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';

export const ClearCacheButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  const handleClearCache = async () => {
    const result = await execute(async () => {
      console.log('🧹 Starting aggressive cache clear...');
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      }
      
      // Clear service worker cache and force update
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }

      // Force service worker to update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            // Send skip waiting message to new service worker
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            return registration.unregister();
          })
        );
        
        // Re-register service worker
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (regError) {
          console.log('Service worker registration after clear:', regError);
        }
      }

      return true;
    }, {
      onSuccess: () => {
        toast({
          title: "Cache Cleared",
          description: "All cached data has been cleared. The page will reload to get the latest version.",
        });

        // Navigate to home page after clearing cache instead of reload
        setTimeout(() => {
          window.location.href = window.location.origin;
        }, 1000);
        
        setIsModalOpen(false);
      },
      onError: (error) => {
        console.error('Error clearing cache:', error);
        toast({
          title: "Error",
          description: "Failed to clear cache completely. Please try refreshing the page manually.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-ceramic-base border-ceramic-rim justify-start"
        onClick={() => setIsModalOpen(true)}
      >
        Clear Cache
      </Button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleClearCache}
        title="Clear App Cache?"
        description="This will clear all cached data and reload the app to ensure you have the latest version. You may need to sign in again."
        confirmText="Clear Cache"
        isLoading={isLoading}
      />
    </>
  );
};