import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.de91d618edcf40eb8e117c45904095be',
  appName: 'fast-now-zenith',
  webDir: 'dist',
  server: {
    url: 'https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'default'
    }
  }
};

export default config;