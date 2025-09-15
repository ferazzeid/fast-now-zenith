#!/usr/bin/env node

/**
 * Dedicated AAB Builder for Google Play Store
 * Builds production-ready Android App Bundle
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
  console.log(`[AAB Builder] ${prefix} ${message}`);
}

function executeCommand(command, description) {
  log(description);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`${description} completed`);
    return true;
  } catch (error) {
    log(`${description} failed`, 'error');
    return false;
  }
}

function checkPrerequisites() {
  const androidPath = path.join(process.cwd(), 'android');
  const keystorePath = path.join(androidPath, 'keystore.properties');
  const keystoreFile = path.join(androidPath, 'app', 'my-upload-key.keystore');

  if (!fs.existsSync(androidPath)) {
    log('Android project not found. Run: npx cap add android', 'error');
    return false;
  }

  if (!fs.existsSync(keystorePath)) {
    log('keystore.properties not found. Run: node scripts/setup-production.js', 'error');
    return false;
  }

  if (!fs.existsSync(keystoreFile)) {
    log('Keystore file not found. Generate keystore first.', 'error');
    return false;
  }

  // Check if keystore.properties has real values
  const content = fs.readFileSync(keystorePath, 'utf8');
  if (content.includes('YOUR_KEYSTORE_PASSWORD_HERE')) {
    log('keystore.properties contains template values. Update with real values.', 'error');
    return false;
  }

  log('All prerequisites met');
  return true;
}

function buildAAB() {
  log('🚀 Building Android App Bundle for Google Play Store...\n');

  if (!checkPrerequisites()) {
    log('\n📋 Setup required. Run: node scripts/setup-production.js');
    return false;
  }

  // Build steps
  const steps = [
    { cmd: 'npm run build', desc: 'Building web assets' },
    { cmd: 'npx cap sync android', desc: 'Syncing Capacitor' },
    { cmd: 'cd android && ./gradlew clean', desc: 'Cleaning previous build' },
    { cmd: 'cd android && ./gradlew bundleRelease', desc: 'Building signed AAB' }
  ];

  for (const step of steps) {
    if (!executeCommand(step.cmd, step.desc)) {
      return false;
    }
  }

  // Check output
  const aabPath = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`\n🎉 AAB build successful!`);
    log(`📱 Output: android/app/build/outputs/bundle/release/app-release.aab`);
    log(`📊 Size: ${sizeInMB} MB`);
    log(`📋 Next: Upload to Google Play Console`);
    
    return true;
  } else {
    log('AAB file not found after build', 'error');
    return false;
  }
}

function main() {
  const success = buildAAB();
  
  if (success) {
    log('\n🚀 Ready for Play Store:');
    log('1. Go to Google Play Console');
    log('2. Upload android/app/build/outputs/bundle/release/app-release.aab');
    log('3. Complete store listing and submit for review');
  } else {
    log('\n❌ Build failed. Check errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildAAB };