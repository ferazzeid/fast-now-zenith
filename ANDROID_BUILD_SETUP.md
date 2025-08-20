# Android Build Environment Setup

This document outlines the required files and configuration for building the Android AAB from a fresh repository clone.

## Required Files Checklist

### ✅ Gradle Wrapper Files (Committed to Git)
- `android/gradlew` - Gradle wrapper script (Unix/Linux/macOS)
- `android/gradlew.bat` - Gradle wrapper script (Windows)  
- `android/gradle/wrapper/gradle-wrapper.jar` - Gradle wrapper executable
- `android/gradle/wrapper/gradle-wrapper.properties` - Gradle version config

### ✅ Android Configuration Files (Committed to Git)
- `android/build.gradle` - Root Android build configuration
- `android/settings.gradle` - Project modules configuration
- `android/capacitor.settings.gradle` - Capacitor-specific settings
- `android/app/build.gradle` - App module build configuration
- `android/app/proguard-rules.pro` - ProGuard obfuscation rules
- `android/app/src/main/AndroidManifest.xml` - Android app manifest

### ✅ Dependency Version Alignment
- `package.json` → `@capacitor/android: "^7.4.2"`
- `android/app/build.gradle` → `com.getcapacitor:capacitor-android:7.4.2`

## Files Excluded from Git (.gitignore)
```
android/local.properties
android/.gradle/
android/build/
android/app/build/
android/capacitor-cordova-android-plugins/build/
android/capacitor-android/build/
android/.idea/
```

## Build Process Verification

After committing all required files, anyone should be able to build the AAB with:

```bash
git clone <repository-url>
cd <project-directory>
npm install
npm run build
npx cap sync android
cd android
chmod +x ./gradlew  # Unix/Linux/macOS only
./gradlew bundleRelease
```

## Key Configuration Details

### Capacitor Integration
- `android/capacitor.settings.gradle` includes the Capacitor Android module
- `android/app/build.gradle` includes the Capacitor Android dependency version matching package.json
- `capacitor.build.gradle` is applied automatically for Capacitor-specific configurations

### Version Management
- `versionCode` must be incremented for each Play Store release
- `versionName` should follow semantic versioning
- Both are configured in `android/app/build.gradle`

### Play App Signing
- Project uses Google Play App Signing for production releases
- No local keystore configuration required in build files
- Google handles final signing when AAB is uploaded to Play Console

## Troubleshooting Common Issues

1. **Gradle wrapper not executable**: Run `chmod +x ./gradlew`
2. **Gradle wrapper missing**: Ensure `gradle-wrapper.jar` is committed to git
3. **Capacitor version mismatch**: Ensure versions match between package.json and build.gradle
4. **Missing capacitor.settings.gradle**: Ensure file exists and includes Capacitor module

## Success Indicators

✅ Fresh clone builds successfully without any manual configuration  
✅ All required files are committed to version control  
✅ Dependency versions are aligned across configuration files  
✅ Generated AAB is valid and installable  