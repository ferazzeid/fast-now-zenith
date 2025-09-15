#!/usr/bin/env node

/**
 * Production Setup Script for Capacitor Android
 * Sets up signing configuration and validates build environment
 */

const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} ${message}`);
}

function checkAndroidProject() {
  const androidPath = path.join(process.cwd(), 'android');
  if (!fs.existsSync(androidPath)) {
    log('Android project not found. Run: npx cap add android', 'error');
    return false;
  }
  log('Android project found');
  return true;
}

function checkKeystoreConfig() {
  const keystorePath = path.join(process.cwd(), 'android', 'keystore.properties');
  if (!fs.existsSync(keystorePath)) {
    log('keystore.properties not found', 'warn');
    log('Copy android/keystore.properties.template to android/keystore.properties', 'warn');
    return false;
  }
  log('keystore.properties found');
  
  // Check if template values are still in use
  const content = fs.readFileSync(keystorePath, 'utf8');
  if (content.includes('YOUR_KEYSTORE_PASSWORD_HERE')) {
    log('keystore.properties contains template values - update with real values', 'warn');
    return false;
  }
  log('keystore.properties configured');
  return true;
}

function checkKeystore() {
  const keystorePath = path.join(process.cwd(), 'android', 'app', 'my-upload-key.keystore');
  if (!fs.existsSync(keystorePath)) {
    log('Keystore file not found at android/app/my-upload-key.keystore', 'warn');
    log('Generate keystore with: keytool -genkey -v -keystore android/app/my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000', 'warn');
    return false;
  }
  log('Keystore file found');
  return true;
}

function checkGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('keystore.properties')) {
      log('Adding keystore.properties to .gitignore', 'warn');
      fs.appendFileSync(gitignorePath, '\n# Android keystore\nandroid/keystore.properties\nandroid/app/*.keystore\n');
    }
  }
  log('.gitignore configured for Android secrets');
}

function updateBuildGradle() {
  const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    log('build.gradle not found - will be created after npx cap add android', 'warn');
    return;
  }

  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if signing config is already added
  if (content.includes('signingConfigs')) {
    log('build.gradle already configured for signing');
    return;
  }

  // Add keystore properties loading
  const keystoreConfig = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

  // Add signing config
  const signingConfig = `
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
`;

  // Add to buildTypes
  const buildTypeConfig = `
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
`;

  // Insert configurations
  content = keystoreConfig + content;
  content = content.replace(/android\s*{/, `android {\n${signingConfig}`);
  content = content.replace(/buildTypes\s*{[^}]*}/, match => {
    if (match.includes('signingConfig')) return match;
    return match.replace(/}$/, `    ${buildTypeConfig.trim()}\n    }`);
  });

  fs.writeFileSync(buildGradlePath, content);
  log('build.gradle updated with signing configuration');
}

function main() {
  log('🚀 Setting up Capacitor Android for production...\n');

  if (!checkAndroidProject()) {
    log('\n📋 Next steps:');
    log('1. Run: npx cap add android');
    log('2. Run this script again');
    return;
  }

  checkGitignore();
  const hasKeystore = checkKeystore();
  const hasKeystoreConfig = checkKeystoreConfig();

  updateBuildGradle();

  log('\n📋 Production setup status:');
  log(`Android project: ✅`);
  log(`Keystore file: ${hasKeystore ? '✅' : '❌'}`);
  log(`Keystore config: ${hasKeystoreConfig ? '✅' : '❌'}`);

  if (!hasKeystore || !hasKeystoreConfig) {
    log('\n🔑 To complete setup:');
    if (!hasKeystore) {
      log('1. Generate keystore:');
      log('   keytool -genkey -v -keystore android/app/my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000');
    }
    if (!hasKeystoreConfig) {
      log('2. Configure signing:');
      log('   cp android/keystore.properties.template android/keystore.properties');
      log('   # Edit android/keystore.properties with your keystore details');
    }
  } else {
    log('\n🎉 Production setup complete! You can now build:');
    log('   node scripts/build-capacitor.js --prod --aab  # For Play Store');
    log('   node scripts/build-capacitor.js --prod android # For APK');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };