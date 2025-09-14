import { detectPlatform } from './platformDetection';

/**
 * Capacitor-specific utility functions
 */

export const isCapacitorApp = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
};

export const getCapacitorPlatform = (): string | null => {
  if (!isCapacitorApp()) return null;
  
  const capacitor = (window as any).Capacitor;
  return capacitor.getPlatform ? capacitor.getPlatform() : null;
};

export const isCapacitorNative = (): boolean => {
  const platform = getCapacitorPlatform();
  return platform === 'android' || platform === 'ios';
};

export const shouldUseNativeFeatures = (): boolean => {
  const platform = detectPlatform();
  return isCapacitorNative() && (platform === 'android' || platform === 'ios');
};

export const getAppInfo = async () => {
  if (!isCapacitorApp()) {
    return {
      name: 'FastNow Zenith',
      id: 'com.fastnow.zenith',
      version: '1.0.0',
      build: '1'
    };
  }

  try {
    const { App } = await import('@capacitor/app');
    return await App.getInfo();
  } catch (error) {
    console.warn('Failed to get app info:', error);
    return {
      name: 'FastNow Zenith',
      id: 'com.fastnow.zenith', 
      version: '1.0.0',
      build: '1'
    };
  }
};