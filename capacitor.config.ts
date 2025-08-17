import type { CapacitorConfig } from '@capacitor/cli';
import { getEnvironmentConfig, isDevelopment } from './src/config/environment';

const envConfig = getEnvironmentConfig();

const config: CapacitorConfig = {
  appId: envConfig.appId,
  appName: envConfig.appName,
  webDir: 'dist',
  // Only include server config in development mode
  ...(isDevelopment() && envConfig.serverUrl ? {
    server: {
      url: envConfig.serverUrl,
      cleartext: true
    }
  } : {}),
  // Production-only native app behavior
  ...(!isDevelopment() ? {
    allowNavigation: envConfig.nativeApp.allowNavigation,
    hideLogs: envConfig.nativeApp.hideLogs,
    loggingBehavior: envConfig.nativeApp.loggingBehavior,
  } : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#F5F5F5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#F5F5F5'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDevelopment(),
    appendUserAgent: 'FastNowApp/1.0',
    overrideUserAgent: 'FastNowApp/1.0 Android',
    backgroundColor: '#F5F5F5',
    useLegacyBridge: false,
    flavor: 'main',
    // Production native behavior
    fullscreen: envConfig.nativeApp.fullscreen,
    hardwareAccelerated: envConfig.nativeApp.hardwareAccelerated,
    usesCleartextTraffic: envConfig.nativeApp.usesCleartextTraffic
  },
  ios: {
    backgroundColor: '#F5F5F5',
    overrideUserAgent: 'FastNowApp/1.0 iOS',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;