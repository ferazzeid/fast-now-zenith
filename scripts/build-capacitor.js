#!/usr/bin/env node

/**
 * Enhanced Capacitor Build Script
 * Supports both development and production builds with proper Android setup
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

function checkAndroidProject() {
  const androidPath = path.join(process.cwd(), 'android');
  if (!fs.existsSync(androidPath)) {
    log('⚠️  Android project not found. Run: npx cap add android');
    return false;
  }
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--prod') ? 'production' : 'development';
  const platform = args.find(arg => CONFIG.platforms.includes(arg)) || 'android';
  const buildType = args.includes('--aab') ? 'bundle' : 'apk';

  log(`Starting ${environment} build for ${platform}...`);

  // Check if Android project exists
  if (!checkAndroidProject()) {
    log('Run the following commands first:');
    log('  npx cap add android');
    log('  npx cap sync android');
    process.exit(1);
  }

  // Build web assets
  executeCommand('npm run build', 'Building web assets');

  // Sync Capacitor
  executeCommand('npx cap sync android', 'Syncing Capacitor');

  if (environment === 'production') {
    // Production build
    const buildCommand = buildType === 'bundle' 
      ? `cd android && ./gradlew bundleRelease`
      : `cd android && ./gradlew assembleRelease`;
    
    executeCommand(buildCommand, `Building ${buildType.toUpperCase()} for ${platform}`);
    
    const outputPath = buildType === 'bundle' 
      ? 'android/app/build/outputs/bundle/release/app-release.aab'
      : 'android/app/build/outputs/apk/release/app-release.apk';
    
    log(`🎉 Production ${buildType.toUpperCase()} build completed!`);
    log(`📱 Output: ${outputPath}`);
    log(`📱 Upload to Google Play Console for distribution`);
  } else {
    // Development build with live reload
    executeCommand(`npx cap run android --livereload --external`, `Running ${platform} with live reload`);
  }
}

// Show usage if no valid arguments
if (process.argv.length === 2) {
  console.log(`
Usage: node scripts/build-capacitor.js [options]

Setup Commands:
  npx cap add android                         # Initialize Android project (run once)
  npx cap sync android                        # Sync web assets to native

Build Options:
  --dev            Build for development with live reload (default)
  --prod           Build for production
  --aab            Build Android App Bundle (production only)
  android          Target Android platform (default)

Examples:
  node scripts/build-capacitor.js                    # Development with live reload
  node scripts/build-capacitor.js --prod android     # Production APK
  node scripts/build-capacitor.js --prod --aab       # Production AAB

Output Locations:
  APK: android/app/build/outputs/apk/release/app-release.apk
  AAB: android/app/build/outputs/bundle/release/app-release.aab
  `);
  process.exit(0);
}

main();