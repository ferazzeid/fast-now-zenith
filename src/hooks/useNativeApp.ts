import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNativeApp = () => {

  const [isNativeApp, setIsNativeApp] = useState(false);
  const [platform, setPlatform] = useState<string>('web');
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once to prevent inconsistent values
    if (isInitialized.current) return;
    
    const checkNativeApp = () => {
      try {
        const isNative = Capacitor.isNativePlatform();
        const currentPlatform = Capacitor.getPlatform();
        
        setIsNativeApp(isNative);
        setPlatform(currentPlatform);
        
        // Cache the result globally to ensure consistency
        (window as any).__IS_NATIVE_APP__ = isNative;
        (window as any).__PLATFORM__ = currentPlatform;
        
        // Force production environment for native apps
        if (isNative && typeof window !== 'undefined') {
          (window as any).__FORCE_PRODUCTION__ = true;
        }
        
        isInitialized.current = true;
      } catch (error) {
        console.error('Native app detection failed:', error);
        // Fallback to web
        setIsNativeApp(false);
        setPlatform('web');
        isInitialized.current = true;
      }
    };

    checkNativeApp();
  }, []);

  return {
    isNativeApp,
    platform,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
};