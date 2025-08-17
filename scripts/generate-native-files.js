#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import environment configuration
const { getEnvironmentConfig, isProduction } = require('../src/config/environment.ts');

const envConfig = getEnvironmentConfig();

// Only generate native files for production builds
if (!isProduction()) {
  console.log('Development mode: Skipping native file generation');
  process.exit(0);
}

// Ensure android directory structure exists
const androidMainPath = 'android/app/src/main';
const javaPath = `${androidMainPath}/java/com/fastnow/zenith`;
const manifestPath = `${androidMainPath}/AndroidManifest.xml`;

// Create directories if they don't exist
if (!fs.existsSync(javaPath)) {
  fs.mkdirSync(javaPath, { recursive: true });
}

// Generate MainActivity.java
const mainActivityContent = `package com.fastnow.zenith;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUI();
        configureWebView();
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void configureWebView() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Enable local asset access - CRITICAL for app functionality
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            
            // UI hardening while preserving functionality
            webView.getSettings().setBuiltInZoomControls(false);
            webView.getSettings().setDisplayZoomControls(false);
            webView.setOnLongClickListener(v -> true);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setLongClickable(false);
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }
}`;

// Write MainActivity.java
fs.writeFileSync(`${javaPath}/MainActivity.java`, mainActivityContent);
console.log('✓ Generated MainActivity.java with native app behavior');

// Generate enhanced AndroidManifest.xml template
const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${envConfig.packageName}">

    <!-- Support for all device form factors -->
    <supports-screens 
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true"
        android:resizeable="true" />

    <!-- Essential features -->
    <uses-feature
        android:name="android.software.webview"
        android:required="true" />
    
    <!-- Optional features for maximum device compatibility -->
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.type.automotive"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.type.television"
        android:required="false" />
    <uses-feature
        android:name="android.software.app_widgets"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="${envConfig.nativeApp.hardwareAccelerated}"
        android:largeHeap="true"
        android:usesCleartextTraffic="${envConfig.nativeApp.usesCleartextTraffic}"
        android:banner="@mipmap/ic_launcher">

        <!-- Main Activity with comprehensive device support -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density|layoutDirection|colorMode">

            <!-- Combined launcher intent for all device types -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${envConfig.packageName}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

</manifest>`;

// Write AndroidManifest.xml template
fs.writeFileSync(`${androidMainPath}/AndroidManifest.xml.template`, manifestContent);
console.log('✓ Generated AndroidManifest.xml template with security enhancements');

console.log('✓ Native app files generated successfully for production build');