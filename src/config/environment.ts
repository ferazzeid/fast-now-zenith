export type AppEnvironment = 'development' | 'production';

export interface EnvironmentConfig {
  appId: string;
  appName: string;
  displayName: string;
  packageName: string;
  bundleId: string;
  webUrl: string;
  serverUrl?: string;
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
  if (import.meta.env.MODE === 'production' || import.meta.env.PROD) {
    return 'production';
  }
  
  // Check for NODE_ENV override
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
};

export const DEVELOPMENT_CONFIG: EnvironmentConfig = {
  appId: 'app.lovable.de91d618edcf40eb8e117c45904095be',
  appName: 'fast-now-zenith',
  displayName: 'fast now - The No-BS Fat Loss Protocol',
  packageName: 'app.lovable.de91d618edcf40eb8e117c45904095be',
  bundleId: 'app.lovable.de91d618edcf40eb8e117c45904095be',
  webUrl: '',
  serverUrl: 'https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com?forceHideBadge=true',
  colors: {
    primary: '220 15% 50%', // Neutral for development
    primaryHover: '220 15% 45%',
    primaryGlow: '220 15% 60%',
    accent: '140 25% 85%',
    aiColor: '48 96% 53%',
    secondary: '220 15% 45%',
    backgroundLight: '0 0% 96%',
    backgroundDark: '0 0% 11%',
    cardLight: '0 0% 98%',
    cardDark: '0 0% 10%',
  },
  android: {
    colorPrimary: '#6B7280',
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
  colors: {
    primary: '0 72% 56%', // Production red colors
    primaryHover: '0 72% 46%',
    primaryGlow: '0 82% 66%',
    accent: '140 25% 85%',
    aiColor: '48 96% 53%',
    secondary: '0 72% 46%',
    backgroundLight: '0 0% 96%',
    backgroundDark: '0 0% 11%',
    cardLight: '0 0% 98%',
    cardDark: '0 0% 10%',
  },
  android: {
    colorPrimary: '#E53E3E',
    colorPrimaryDark: '#C53030',
    colorAccent: '#E53E3E',
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