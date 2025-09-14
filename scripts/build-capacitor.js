#!/usr/bin/env node

/**
 * Capacitor Build Script
 * Automates the build process for both development and production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  appId: 'com.fastnow.zenith',
  appName: 'FastNow Zenith',
  platforms: ['android'], // Add 'ios' when ready
  productionUrl: 'https://go.fastnow.app',
  developmentUrl: 'https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com?forceHideBadge=true'
};

function log(message) {
  console.log(`[Capacitor Build] ${message}`);
}

function executeCommand(command, description) {
  log(description);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`);
  } catch (error) {
    log(`❌ ${description} failed`);
    process.exit(1);
  }
}

function updateCapacitorConfig(environment) {
  const configPath = path.join(process.cwd(), 'capacitor.config.ts');
  
  log(`Updating Capacitor config for ${environment}...`);
  
  const serverConfig = environment === 'production' 
    ? `  server: {
    androidScheme: 'https',
  },`
    : `  server: {
    androidScheme: 'https',
    url: '${CONFIG.developmentUrl}',
    cleartext: true
  },`;

  const configContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${CONFIG.appId}',
  appName: '${CONFIG.appName}',
  webDir: 'dist',
${serverConfig}
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: ${environment === 'development'},
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

export default config;`;

  fs.writeFileSync(configPath, configContent);
  log(`✅ Capacitor config updated for ${environment}`);
}

function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--prod') ? 'production' : 'development';
  const platform = args.find(arg => CONFIG.platforms.includes(arg)) || 'android';
  const buildType = args.includes('--aab') ? 'bundle' : 'apk';

  log(`Starting ${environment} build for ${platform}...`);

  // Update configuration
  updateCapacitorConfig(environment);

  // Build web assets
  executeCommand('npm run build', 'Building web assets');

  // Sync Capacitor
  executeCommand('npx cap sync', 'Syncing Capacitor');

  if (environment === 'production') {
    // Production build
    const buildCommand = buildType === 'bundle' 
      ? `npx cap build ${platform} --release --prod`
      : `npx cap build ${platform} --release`;
    
    executeCommand(buildCommand, `Building ${buildType.toUpperCase()} for ${platform}`);
    
    log(`🎉 Production ${buildType.toUpperCase()} build completed!`);
    log(`📱 Upload the ${buildType.toUpperCase()} file to Google Play Console`);
  } else {
    // Development build with live reload
    executeCommand(`npx cap run ${platform} --livereload --external`, `Running ${platform} with live reload`);
  }
}

// Show usage if no valid arguments
if (process.argv.length === 2) {
  console.log(`
Usage: node scripts/build-capacitor.js [options]

Options:
  --prod           Build for production
  --dev            Build for development (default)
  --aab            Build Android App Bundle (production only)
  android          Target Android platform (default)
  ios              Target iOS platform

Examples:
  node scripts/build-capacitor.js                    # Development build
  node scripts/build-capacitor.js --prod android     # Production APK
  node scripts/build-capacitor.js --prod --aab       # Production AAB
  `);
  process.exit(0);
}

main();