#!/usr/bin/env node

/**
 * Branding Validation Script
 * 
 * Validates that all required branding assets exist and are accessible
 * before building TWA or deploying the application.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://texnkijwcygodtywgedm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function validateUrl(url, name) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      console.log(`✅ ${name}: ${url}`);
      return true;
    } else {
      console.log(`❌ ${name}: ${url} (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${url} (Error: ${error.message})`);
    return false;
  }
}

async function validateBranding() {
  try {
    console.log('🔍 Validating branding configuration...\n');

    // Fetch all branding settings
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

    console.log('📊 Current Branding Settings:');
    console.log(`   App Name: ${settings.pwa_app_name || 'NOT SET'}`);
    console.log(`   Short Name: ${settings.pwa_short_name || 'NOT SET'}`);
    console.log(`   Description: ${settings.pwa_description || 'NOT SET'}`);
    console.log(`   App Logo: ${settings.app_logo || 'NOT SET'}`);
    console.log(`   App Icon: ${settings.app_icon_url || 'NOT SET'}`);
    console.log(`   Favicon: ${settings.app_favicon || 'NOT SET'}`);
    console.log('');

    // Validate required settings
    const required = ['pwa_app_name', 'pwa_short_name'];
    const missing = required.filter(key => !settings[key]);
    
    if (missing.length > 0) {
      console.log(`❌ Missing required settings: ${missing.join(', ')}\n`);
      console.log('   Please configure these in Admin → Branding → App Identity Settings');
      return false;
    }

    // Validate URLs are accessible
    console.log('🌐 Validating asset URLs:');
    
    const urlChecks = [];
    
    if (settings.app_logo) {
      urlChecks.push(validateUrl(settings.app_logo, 'App Logo'));
    }
    
    if (settings.app_icon_url) {
      urlChecks.push(validateUrl(settings.app_icon_url, 'App Icon'));
    }
    
    if (settings.app_favicon) {
      urlChecks.push(validateUrl(settings.app_favicon, 'Favicon'));
    }

    // Check dynamic manifest endpoints
    urlChecks.push(validateUrl('https://go.fastnow.app/supabase/functions/v1/dynamic-manifest', 'Manifest JSON'));
    urlChecks.push(validateUrl('https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=icon&size=192', 'Dynamic Icon 192px'));
    urlChecks.push(validateUrl('https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=icon&size=512', 'Dynamic Icon 512px'));
    urlChecks.push(validateUrl('https://go.fastnow.app/supabase/functions/v1/dynamic-manifest?type=splash', 'Dynamic Splash'));

    const results = await Promise.all(urlChecks);
    const allValid = results.every(result => result);

    console.log('');
    
    if (allValid) {
      console.log('✅ All branding assets validated successfully!');
      console.log('🚀 Ready to build TWA or deploy application');
      return true;
    } else {
      console.log('❌ Some branding assets failed validation');
      console.log('   Please check the URLs in Admin → Branding');
      return false;
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation
validateBranding().then(success => {
  process.exit(success ? 0 : 1);
});