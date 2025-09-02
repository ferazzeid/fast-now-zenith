#!/usr/bin/env node

/**
 * TWA Config Sync Script
 * 
 * Ensures TWA configuration files are always in sync with admin panel database.
 * This is the single source of truth for all branding across web, PWA, and TWA.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://texnkijwcygodtywgedm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncTWAConfig() {
  try {
    console.log('🔄 Syncing TWA configuration with admin panel...');

    // Fetch all branding settings from admin panel
    const { data: settingsData, error } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'pwa_app_name', 
        'pwa_short_name', 
        'pwa_description',
        'app_logo',
        'app_icon_url',
        'app_favicon'
      ]);

    if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    const settings = {};
    settingsData?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    // Validate required settings
    const requiredSettings = ['pwa_app_name', 'pwa_short_name'];
    const missingSettings = requiredSettings.filter(key => !settings[key]);
    
    if (missingSettings.length > 0) {
      throw new Error(`Missing required admin panel settings: ${missingSettings.join(', ')}`);
    }

    // Use database values or fallbacks
    const appName = settings.pwa_app_name || 'fast now - The No-BS Fat Loss Protocol';
    const shortName = settings.pwa_short_name || 'fast now';
    const description = settings.pwa_description || 'The No-BS Fat Loss Protocol';
    
    // Dynamic manifest URLs that serve actual images
    const iconUrl = 'https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=icon&size=192';
    const maskableIconUrl = 'https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=icon&size=512';
    const splashUrl = 'https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=splash';
    const manifestUrl = 'https://go.fastnow.app/supabase/functions/v1/dynamic-manifest';

    // Update twa-manifest.json
    const twaManifest = {
      packageId: "com.fastnow.zenith",
      host: "go.fastnow.app",
      name: appName,
      launcherName: shortName,
      display: "standalone",
      themeColor: "#8B7355",
      themeColorDark: "#000000",
      navigationColor: "#000000",
      navigationColorDark: "#000000",
      navigationDividerColor: "#000000",
      navigationDividerColorDark: "#000000",
      backgroundColor: "#F5F2EA",
      enableNotifications: true,
      startUrl: "https://go.fastnow.app/",
      iconUrl: iconUrl,
      maskableIconUrl: maskableIconUrl,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: "C:\\Users\\socia\\Desktop\\fastnownonative\\android.keystore",
        alias: "android"
      },
      appVersionName: "100216",
      appVersionCode: 100216,
      shortcuts: [],
      generatorApp: "bubblewrap-cli",
      webManifestUrl: manifestUrl,
      fallbackType: "customtabs",
      features: {},
      alphaDependencies: {
        enabled: false
      },
      enableSiteSettingsShortcut: true,
      isChromeOSOnly: false,
      isMetaQuest: false,
      fullScopeUrl: "https://go.fastnow.app/",
      minSdkVersion: 21,
      orientation: "portrait-primary",
      fingerprints: [],
      additionalTrustedOrigins: [],
      retainedBundles: [],
      protocolHandlers: [],
      fileHandlers: [],
      launchHandlerClientMode: "",
      appVersion: "100216"
    };

    // Update bubblewrap.config.json
    const bubblewrapConfig = {
      host: {
        url: "https://go.fastnow.app/"
      },
      androidPackage: {
        applicationId: "com.fastnow.zenith",
        packageId: "com.fastnow.zenith",
        versionCode: 100216,
        versionName: "100216"
      },
      jdkPath: "/usr/lib/jvm/java-17-openjdk",
      androidSdkPath: "~/Android/Sdk",
      enableSiteSettingsShortcut: false,
      enableNotifications: true,
      enableWebapp: true,
      disableFirstRunActivity: true,
      enableUrlBarHiding: true,
      signing: {
        scheme: "HTTPS"
      },
      splashScreen: {
        backgroundColor: "#F5F2EA",
        image: splashUrl
      },
      shortcuts: []
    };

    // Write updated config files
    writeFileSync('twa-manifest.json', JSON.stringify(twaManifest, null, 2));
    writeFileSync('bubblewrap.config.json', JSON.stringify(bubblewrapConfig, null, 2));

    console.log('✅ TWA configuration synced successfully!');
    console.log(`   App Name: ${appName}`);
    console.log(`   Short Name: ${shortName}`);
    console.log(`   Description: ${description}`);
    console.log(`   Icon URL: ${iconUrl}`);
    console.log(`   Splash URL: ${splashUrl}`);
    console.log('');
    console.log('📱 Ready to build TWA with: npx bubblewrap build');

  } catch (error) {
    console.error('❌ Failed to sync TWA configuration:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncTWAConfig();