# Capacitor Migration Guide

## Migration Status: Phase 1-3 Complete ✅

### Completed:
- ✅ **Phase 1**: Capacitor setup with dependencies and configuration
- ✅ **Phase 2**: Authentication fixes for Capacitor context
- ✅ **Phase 3**: Native features preparation (Google Play Billing)

### Next Steps for Full Migration:

## Phase 4: Build Pipeline & Deployment

### 1. Initialize Capacitor Project
```bash
# Run after git pulling to local machine
npx cap init

# Add platforms
npx cap add android
npx cap add ios

# Sync web assets
npm run build
npx cap sync
```

### 2. Configure Android Build
Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.fastnow.zenith"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 100342
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Production Configuration
For production builds, update `capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastnow.zenith',
  appName: 'FastNow Zenith',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Remove url for production builds
  },
  // ... rest of config
};

export default config;
```

### 4. Build Commands
```bash
# Development build with live reload
npm run build
npx cap sync
npx cap run android

# Production AAD build
npm run build
npx cap sync android
npx cap build android
```

### 5. Google Play Console Setup
1. Upload AAD file instead of APK
2. Configure app signing (Google handles)
3. Test with internal testing track
4. Submit for review

## Phase 5: Google OAuth (Optional)

### If needed, add Google Auth plugin:
```bash
npm install @capacitor-community/google-auth
npx cap sync
```

### Configure OAuth in `capacitor.config.ts`:
```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_SERVER_CLIENT_ID',
    forceCodeForRefreshToken: true,
  },
}
```

## Current Features Ready:
- ✅ Capacitor-aware platform detection
- ✅ Authentication with session persistence
- ✅ Google Play Billing integration (ready for custom bridge)
- ✅ PWA features preserved
- ✅ Offline functionality maintained

## Benefits Achieved:
- 🚀 Native app performance
- 📱 App store distribution
- 💰 Native payment processing
- 🔄 Hot reload in development
- 🌐 Web fallback compatibility
- 🛡️ Enhanced security with app signing

## Next Developer Steps:
1. `git pull` project to local environment
2. Run Phase 4 build pipeline setup
3. Test on physical Android device
4. Configure Google Play Console
5. Deploy to production

Your app is now ready for Capacitor deployment! 🎉