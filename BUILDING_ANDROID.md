# Building Android AAB for Zenith

This guide provides step-by-step instructions for building the Android App Bundle (AAB) file for production release.

## Prerequisites

1. **Android Studio** installed with Android SDK
2. **Java 21** installed and configured
3. **Git** for pulling latest changes
4. **Release Keystore** properly configured

## Build Process

### 1. Pull Latest Changes
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Android Platform (First Time Only)
```bash
npx cap add android
```

### 4. Configure Keystore
- Ensure you have a valid `android/keystore.properties` file
- The keystore file should be accessible at the path specified in `storeFile`
- Use `android/keystore.properties.example` as a template

### 5. Update Version (Before Each Release)
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2  // Increment this for each release
    versionName "1.1.0"  // Update semantic version
}
```

### 6. Build Web Assets
```bash
npm run build
```

### 7. Sync Capacitor
```bash
npx cap sync android
```

### 8. Build Release AAB
```bash
cd android
./gradlew bundleRelease
```

### 9. Locate AAB File
The generated AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

### Common Issues

**Build fails with "Duplicate class" errors:**
- Run `./gradlew clean` then retry build

**Keystore not found:**
- Verify `keystore.properties` file exists and paths are correct
- Ensure keystore file is accessible

**Version conflicts:**
- Check that `versionCode` has been incremented
- Ensure all dependencies are up to date

**Gradle wrapper issues:**
- The project includes gradle wrapper files - use `./gradlew` not system gradle

### Clean Build
If you encounter persistent issues:
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

## Release Checklist

- [ ] Git pull latest changes
- [ ] Increment `versionCode` in `android/app/build.gradle`
- [ ] Update `versionName` if needed
- [ ] Run `npm run build`
- [ ] Run `npx cap sync android`
- [ ] Build AAB with `./gradlew bundleRelease`
- [ ] Test AAB on device/emulator before uploading
- [ ] Upload to Google Play Console

## File Structure

```
android/
├── gradlew                    # Gradle wrapper (Unix)
├── gradlew.bat               # Gradle wrapper (Windows)
├── gradle/wrapper/           # Gradle wrapper files
├── settings.gradle           # Project modules configuration
├── build.gradle             # Root build configuration
├── keystore.properties      # Your keystore config (not in repo)
├── keystore.properties.example  # Template for keystore config
└── app/
    ├── build.gradle         # App build configuration
    ├── capacitor.build.gradle  # Capacitor build additions
    └── src/main/
        ├── AndroidManifest.xml  # App manifest
        └── java/com/fastnow/zenith/MainActivity.java
```

## Security Notes

- Never commit `keystore.properties` or keystore files to version control
- Keep keystore and passwords secure - losing them means you can't update your app
- Use strong passwords for keystore and key