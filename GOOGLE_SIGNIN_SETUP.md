# Google Sign-In Setup Instructions (Dual-Flow Implementation)

This guide configures Google Sign-In for both **native Android app** and **web/PWA** platforms using a dual-flow approach.

## Overview

Your app now supports two authentication flows:
- **Native Android**: Google Sign-In SDK → Direct token exchange with Supabase (no browser)
- **Web/PWA**: Standard OAuth flow → Supabase → Redirect back to app

## Prerequisites

- Google Cloud Platform project
- Android Studio (for SHA-1 fingerprints)
- Supabase project configured

## Step 1: Google Cloud Console Configuration

### 1.1 Navigate to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"

### 1.2 Create OAuth 2.0 Client IDs

You need **TWO** OAuth clients for the dual-flow approach:

#### Web OAuth Client (Required for both flows)
1. Click "Create Credentials" > "OAuth client ID"
2. Choose **"Web application"**
3. Name: "FastNow Web OAuth"
4. **Authorized JavaScript origins:**
   ```
   https://texnkijwcygodtywgedm.supabase.co
   https://go.fastnow.app
   https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com
   ```
5. **Authorized redirect URIs:**
   ```
   https://texnkijwcygodtywgedm.supabase.co/auth/v1/callback
   https://go.fastnow.app/auth/callback
   ```
6. Save and copy the **Client ID**

#### Android OAuth Client (For native SDK)
1. Click "Create Credentials" > "OAuth client ID"
2. Choose **"Android"**  
3. Name: "FastNow Android"
4. Package name: `com.fastnow.zenith`
5. **SHA-1 certificate fingerprint:** [Your fingerprint]

### 1.3 Get SHA-1 Fingerprint

**Debug builds:**
```bash
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android
```

**Release builds:**
```bash
keytool -keystore /path/to/your/release.keystore -list -v -alias your_alias
```

## Step 2: Supabase Configuration

### 2.1 Configure Google Provider
1. Supabase Dashboard → Authentication → Providers
2. Enable **Google** provider
3. Add your **Web OAuth Client ID** and **Client Secret** (from Step 1.2)

### 2.2 Configure Redirect URLs
1. Supabase Dashboard → Authentication → URL Configuration
2. **Site URL:** `https://go.fastnow.app`
3. **Redirect URLs:** Add these URLs:
   ```
   https://go.fastnow.app/auth/callback
   https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com/auth/callback
   ```

## Step 3: App Configuration

The app is already configured with:
- **Client ID:** `1037732404902-adkv5gfn2e03vnr5ml3974jpcin776c6.apps.googleusercontent.com`
- **Dual-flow detection:** Automatically uses native SDK on Android, web OAuth on browsers
- **Callback handling:** `/auth/callback` route processes web OAuth returns

## How It Works

### Native Android Flow
1. User taps "Continue with Google"
2. Google Sign-In SDK opens → User selects account
3. App receives ID token directly
4. Token exchanged with Supabase via `signInWithIdToken()`
5. User signed in (no browser involved)

### Web/PWA Flow  
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. After consent, Google → Supabase → Your callback URL
4. `/auth/callback` processes the session
5. User redirected to main app

### Unified Experience
- Same user database across platforms
- Same Supabase sessions and RLS policies
- Web users can install PWA and get native experience

## Step 4: Build and Test

1. **Build project:**
   ```bash
   npm run build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Run on device:**
   ```bash
   npx cap run android
   ```

## Troubleshooting

### Native Android Issues
- **"Invalid client"**: Check SHA-1 fingerprint and package name
- **"Sign in failed"**: Verify Android OAuth client configuration
- **"Network error"**: Ensure Google Play Services updated

### Web/PWA Issues
- **Redirect loops**: Check Supabase redirect URLs match exactly
- **"Unauthorized redirect"**: Verify authorized redirect URIs in Google Cloud
- **Callback errors**: Check `/auth/callback` route is accessible

### Debug Commands
```bash
# Run with live reload and console access
npx cap run android --livereload

# Check console logs for detailed errors
# Both flows have extensive logging
```

## Testing Checklist

- [ ] Native Android: Tap Google → Account picker → No browser → Signed in
- [ ] Web browser: Click Google → OAuth popup → Redirect → Signed in  
- [ ] PWA: Same as web but can install as app
- [ ] Same user appears in Supabase regardless of login method

Your dual-flow implementation gives users the best experience on each platform while maintaining a unified backend!