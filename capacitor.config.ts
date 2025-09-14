import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastnow.zenith',
  appName: 'FastNow Zenith',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development - comment out for production builds
    url: 'https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    appendUserAgent: 'FastNowZenith'
  },
  ios: {
    scheme: 'FastNow Zenith',
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F5F2EA',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#F5F2EA'
    }
  }
};

export default config;