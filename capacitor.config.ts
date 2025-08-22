import type { CapacitorConfig } from '@capacitor/cli';
import { getEnvironmentConfig, isDevelopment } from './src/config/environment';

const envConfig = getEnvironmentConfig();

const config: CapacitorConfig = {
  appId: envConfig.appId,
  appName: envConfig.appName,
  webDir: 'dist',
  // Removed server config to make this a native app with local assets
  plugins: {
    App: {
      appUrlOpen: {
        iosCustomScheme: 'com.fastnow.zenith',
        androidCustomScheme: 'com.fastnow.zenith'
      }
    },
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
    },
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    }
  },
  // Configure deep linking for OAuth callbacks
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDevelopment(),
    appendUserAgent: 'FastNowApp/1.0',
    overrideUserAgent: 'FastNowApp/1.0 Native Android',
    backgroundColor: envConfig.android.backgroundLight,
    useLegacyBridge: false,
    flavor: 'main',
    allowNavigation: envConfig.nativeApp.allowNavigation,
    mixedContentMode: 'never',
    fullscreen: envConfig.nativeApp.fullscreen,
    hardwareAccelerated: envConfig.nativeApp.hardwareAccelerated,
    usesCleartextTraffic: envConfig.nativeApp.usesCleartextTraffic,
    versionCode: envConfig.version.code,
    versionName: envConfig.version.name,
    minWebViewVersion: 70,
    loggingBehavior: isDevelopment() ? 'debug' : 'none',
    hideLogs: !isDevelopment(),
    webContentsDebuggingEnabled: isDevelopment(),
    enableBridgeLogging: isDevelopment()
  },
  ios: {
    backgroundColor: envConfig.android.backgroundLight,
    overrideUserAgent: 'FastNowApp/1.0 Native iOS',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    allowsInlineMediaPlayback: true,
    suppressesIncrementalRendering: false
  }
};

export default config;