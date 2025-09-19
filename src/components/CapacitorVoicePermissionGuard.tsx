import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Settings, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isCapacitorApp, getCapacitorPlatform } from '@/utils/capacitorUtils';

interface CapacitorVoicePermissionGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export const CapacitorVoicePermissionGuard: React.FC<CapacitorVoicePermissionGuardProps> = ({
  children,
  fallbackComponent
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (!isCapacitorApp()) {
      setHasPermission(true);
      return;
    }

    setIsChecking(true);
    
    try {
      // Test microphone access directly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Immediately stop the stream since we're just testing
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      
    } catch (error) {
      console.error('🎤 [Permission Guard] Permission check failed:', error);
      setHasPermission(false);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    await checkPermissions();
    
    if (!hasPermission) {
      const platform = getCapacitorPlatform();
      const platformName = platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : 'device';
      
      toast({
        title: "Permission Required",
        description: `Please enable microphone permission in your ${platformName} settings for FastNow Zenith.`,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const openAppSettings = () => {
    const platform = getCapacitorPlatform();
    const instructions = platform === 'android' 
      ? "Go to Settings > Apps > FastNow Zenith > Permissions > Microphone"
      : "Go to Settings > FastNow Zenith > Microphone";
      
    toast({
      title: "Enable Microphone Permission",
      description: instructions,
      duration: 10000,
    });
  };

  if (!isCapacitorApp() || hasPermission) {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Checking microphone access...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-amber-500" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Microphone Permission Required</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Voice input requires microphone access. Please enable permission in your device settings.
          </p>
        </div>
        
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={requestPermission} className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={openAppSettings}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Open Settings
          </Button>
        </div>
        
        {fallbackComponent && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Or use alternative input:</p>
            {fallbackComponent}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};