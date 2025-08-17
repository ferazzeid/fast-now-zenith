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
  // Check build environment
  if (process.env.NODE_ENV === 'production' || process.env.PROD === 'true') {
    return 'production';
  }
  
  // Check for NODE_ENV override
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
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
    allowNavigation: [],
    fullscreen: true,
    hideLogs: true,
    loggingBehavior: 'none',
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