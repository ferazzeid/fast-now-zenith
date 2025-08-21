export type AppEnvironment = 'development' | 'production';

export interface EnvironmentConfig {
  appId: string;
  appName: string;
  displayName: string;
  packageName: string;
  bundleId: string;
  webUrl: string;
  serverUrl?: string;
  version: {
    code: number;
    name: string;
  };
  nativeApp: {
    allowNavigation: string[];
    fullscreen: boolean;
    hideLogs: boolean;
    loggingBehavior: string;
    immersiveMode: boolean;
    hardwareAccelerated: boolean;
    usesCleartextTraffic: boolean;
  };
  colors: {
    primary: string;
    primaryHover: string;
    primaryGlow: string;
    accent: string;
    aiColor: string;
    secondary: string;
    backgroundLight: string;
    backgroundDark: string;
    cardLight: string;
    cardDark: string;
  };
  android: {
    colorPrimary: string;
    colorPrimaryDark: string;
    colorAccent: string;
    backgroundLight: string;
    backgroundDark: string;
  };
}

export const getEnvironment = (): AppEnvironment => {
  try {
    // CRITICAL: Enhanced detection for AAB builds
    
    // Method 1: Check build environment first (most reliable)
    if (process.env.NODE_ENV === 'production' || process.env.PROD === 'true') {
      console.log('🔥 PRODUCTION MODE: NODE_ENV detected');
      return 'production';
    }
    
    // Method 2: Check for Capacitor object (native app)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('🔥 NATIVE APP DETECTED: Capacitor object');
      return 'production';
    }
    
    // Method 2b: AAB build detection (critical for production builds)
    if (typeof window !== 'undefined') {
      const isAABBuild = 
        document.documentElement.getAttribute('data-build-type') === 'aab' ||
        window.location.origin.includes('android_asset') ||
        (window as any).AndroidInterface ||
        navigator.userAgent.includes('wv') ||
        window.location.href.includes('android_asset');
      
      if (isAABBuild) {
        console.log('🔥 AAB BUILD DETECTED: Production mode forced');
        return 'production';
      }
    }
    
    // Method 3: Check for force production flag
    if (typeof window !== 'undefined' && (window as any).__FORCE_PRODUCTION__) {
      console.log('🔥 PRODUCTION MODE: force flag');
      return 'production';
    }
    
    // Method 4: Check for capacitor protocol
    if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
      console.log('🔥 NATIVE APP DETECTED: capacitor protocol');
      return 'production';
    }
    
    // Method 5: Check for HTTPS in non-localhost (usually production)
    if (typeof window !== 'undefined' && 
        window.location.protocol === 'https:' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
      console.log('🔥 PRODUCTION MODE: HTTPS non-localhost');
      return 'production';
    }
    
    console.log('🔥 DEVELOPMENT MODE: No production indicators found');
    return 'development';
  } catch (error) {
    console.error('Environment detection failed, defaulting to production:', error);
    return 'production'; // Safer default for AAB builds
  }
};

export const DEVELOPMENT_CONFIG: EnvironmentConfig = {
  appId: 'com.fastnow.zenith.dev',
  appName: 'fast-now-zenith',
  displayName: 'fast now - The No-BS Fat Loss Protocol',
  packageName: 'com.fastnow.zenith.dev',
  bundleId: 'com.fastnow.zenith.dev',
  webUrl: '',
  serverUrl: '',
  version: {
    code: 1,
    name: '1.0.0',
  },
  nativeApp: {
    allowNavigation: ['*'],
    fullscreen: false,
    hideLogs: false,
    loggingBehavior: 'debug',
    immersiveMode: false,
    hardwareAccelerated: true,
    usesCleartextTraffic: true,
  },
  colors: {
    primary: '220 13% 45%', // Neutral gray - emergency fallback only
    primaryHover: '220 13% 40%',
    primaryGlow: '220 13% 55%',
    accent: '220 13% 50%',
    aiColor: '220 13% 50%',
    secondary: '220 13% 40%',
    backgroundLight: '0 0% 96%',
    backgroundDark: '0 0% 11%',
    cardLight: '0 0% 98%',
    cardDark: '0 0% 10%',
  },
  android: {
    colorPrimary: '#6B7280', // Neutral - will be replaced by database colors
    colorPrimaryDark: '#4B5563',
    colorAccent: '#6B7280',
    backgroundLight: '#F5F5F5',
    backgroundDark: '#1C1C1C',
  }
};

export const PRODUCTION_CONFIG: EnvironmentConfig = {
  appId: 'com.fastnow.zenith',
  appName: 'fast-now-zenith',
  displayName: 'fast now - The No-BS Fat Loss Protocol',
  packageName: 'com.fastnow.zenith',
  bundleId: 'com.fastnow.zenith',
  webUrl: '',
  version: {
    code: 23,
    name: '1.22',
  },
  nativeApp: {
    allowNavigation: [
      'https://accounts.google.com/*',
      'https://*.google.com/*',
      'https://oauth2.googleapis.com/*',
      'https://*.googleusercontent.com/*',
      'https://oauth.googleusercontent.com/*',
      'https://appleid.apple.com/*',
      'https://*.supabase.co/*',
      'com.fastnow.zenith://*'
    ],
    fullscreen: false, // Allow navigation bars for OAuth
    hideLogs: false, // Keep logs for OAuth debugging
    loggingBehavior: 'production', // Limited but present
    immersiveMode: true,
    hardwareAccelerated: true,
    usesCleartextTraffic: false,
  },
  colors: {
    primary: '220 13% 45%', // Neutral gray - emergency fallback only
    primaryHover: '220 13% 40%',
    primaryGlow: '220 13% 55%',
    accent: '220 13% 50%',
    aiColor: '220 13% 50%',
    secondary: '220 13% 40%',
    backgroundLight: '0 0% 96%',
    backgroundDark: '0 0% 11%',
    cardLight: '0 0% 98%',
    cardDark: '0 0% 10%',
  },
  android: {
    colorPrimary: '#6B7280', // Neutral - will be replaced by database colors
    colorPrimaryDark: '#4B5563',
    colorAccent: '#6B7280',
    backgroundLight: '#F5F5F5',
    backgroundDark: '#1C1C1C',
  }
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  return env === 'production' ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
};

export const isDevelopment = (): boolean => getEnvironment() === 'development';
export const isProduction = (): boolean => getEnvironment() === 'production';