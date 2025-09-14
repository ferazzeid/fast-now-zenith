# Keystore Setup for Android App Bundle Signing

## Overview
This project uses a keystore file for signing Android App Bundles (AAB) for Google Play Store distribution.

## Files
- `keystore/my-upload-key.keystore` - The actual keystore file
- `keystore.properties` - Keystore configuration with passwords
- `keystore.properties.example` - Example configuration file

## Keystore Details
- **Keystore File**: `keystore/my-upload-key.keystore`
- **Keystore Password**: `123456`
- **Key Alias**: `upload`
- **Key Password**: `123456`
- **Certificate Fingerprint (SHA1)**: `30:28:92:05:5E:61:1A:C0:4B:EA:65:93:1E:4E:54:C6:B3:BB:03:D4`

## Usage
The keystore is automatically used when building release AABs with:
```bash
.\gradlew.bat bundleRelease
```

## Security Note
⚠️ **Warning**: This keystore contains the private key used to sign your app. Keep it secure and do not share it publicly.

## Building AAB
1. Ensure keystore files are in place
2. Run: `.\gradlew.bat bundleRelease`
3. AAB will be generated at: `app\build\outputs\bundle\release\app-release.aab`

## Version Information
- Current version: 100334
- Package ID: com.fastnow.zenith
- App Name: FastNow
