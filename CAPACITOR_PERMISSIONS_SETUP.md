# Capacitor Permissions Setup

This guide explains how to configure microphone permissions for the Capacitor-wrapped mobile app.

## Android Permissions

After exporting your project and running `npx cap add android`, you need to add the following permission to your `android/app/src/main/AndroidManifest.xml` file:

### 1. Add Microphone Permission

Add this line inside the `<manifest>` tag, before the `<application>` tag:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Complete Example:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.fastnow.zenith">

    <!-- Add this line for microphone access -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Other existing permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
        <!-- Your app configuration -->
    </application>
</manifest>
```

## iOS Permissions

For iOS, add the following to your `ios/App/App/Info.plist` file:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to the microphone to record voice input for food logging and other features.</string>
```

## After Making Changes

1. Run `npx cap sync android` (and/or `npx cap sync ios`) to sync the changes
2. Clean and rebuild your project:
   - Android: `cd android && ./gradlew clean && cd ..`
   - iOS: Clean build folder in Xcode
3. Test the microphone functionality on your device

## Troubleshooting

If you're still having permission issues:

1. **Check device settings**: Ensure the app has microphone permission in your device's settings
2. **Reinstall the app**: Sometimes permissions need a fresh install to take effect
3. **Check logs**: Use `npx cap run android --livereload` to see console logs
4. **Test on different devices**: Some devices/Android versions handle permissions differently

## Permission Flow in App

The app will:
1. Check for microphone permissions when voice features are used
2. Request permission if not granted
3. Show appropriate error messages if permission is denied
4. Provide fallback options (manual text input) when voice is unavailable
