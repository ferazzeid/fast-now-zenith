import { useEffect, useState, useRef } from 'react';

export const useNativeApp = () => {

  const [isNativeApp, setIsNativeApp] = useState(false);
  const [platform, setPlatform] = useState<string>('web');
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once to prevent inconsistent values
    if (isInitialized.current) return;
    
    const checkNativeApp = () => {
      try {
        // For TWA deployment, we're always in web context
        // TWA runs the web app in Chrome, not as a native app
        const isNative = false;
        const currentPlatform = 'web';
        
        setIsNativeApp(isNative);
        setPlatform(currentPlatform);
        
        // Cache the result globally to ensure consistency
        (window as any).__IS_NATIVE_APP__ = isNative;
        (window as any).__PLATFORM__ = currentPlatform;
        
        isInitialized.current = true;
      } catch (error) {
        console.error('Platform detection failed:', error);
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