import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PWAManagementCard = () => {
  const { toast } = useToast();

  const refreshPWACache = async () => {
    try {
      // Clear existing PWA caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      // Update service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.update();
          // Send message to service worker if it has an active worker
          if (registration.active) {
            registration.active.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      // Force reload to get fresh assets
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      toast({
        title: "PWA Cache Refreshed",
        description: "Your app will reload with the latest assets. Changes to icons may take effect after reinstalling the app.",
      });
    } catch (error) {
      console.error('Error refreshing PWA cache:', error);
      toast({
        title: "Error",
        description: "Failed to refresh PWA cache. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          PWA Management
        </CardTitle>
        <CardDescription>
          Update your app's home screen icon and manifest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">After updating your logo or app settings:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Click "Refresh PWA Cache" below</li>
            <li>Remove the app from your home screen (if already installed)</li>
            <li>Add the app to home screen again to see the new icon</li>
          </ol>
        </div>
        
        <Button 
          onClick={refreshPWACache}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh PWA Cache
        </Button>
      </CardContent>
    </Card>
  );
};