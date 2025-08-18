import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNativeApp = () => {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    const checkNativeApp = () => {
      const isNative = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform();
      
      setIsNativeApp(isNative);
      setPlatform(currentPlatform);
      
      // Force production environment for native apps
      if (isNative && typeof window !== 'undefined') {
        (window as any).__FORCE_PRODUCTION__ = true;
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