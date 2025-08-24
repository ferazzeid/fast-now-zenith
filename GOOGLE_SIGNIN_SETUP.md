# Firebase Google Sign-In Setup Guide

This guide configures Google Sign-In using Firebase Authentication for **native Android** and **web/PWA** platforms.

## Overview

The app uses Firebase Authentication as a client-side helper for Google Sign-In:
- **Native Android**: Firebase Auth SDK → Google ID Token → Supabase `signInWithIdToken()`
- **Web/PWA**: Standard OAuth redirect flow through Supabase (no Firebase needed)

Both flows converge to the same Supabase backend, ensuring consistent user sessions and data across platforms.

## Prerequisites

- Google Cloud Platform project with Firebase project
- Android Studio (for SHA-1 fingerprints)  
- Supabase project configured
- `google-services.json` file for Android

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

## Step 3: Firebase Project Configuration

### 3.1 Firebase Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (same as Google Cloud project)
3. Navigate to "Authentication" → "Sign-in method"
4. Enable **Google** provider
5. Use the **Web OAuth Client ID** from Step 1.2
6. Download `google-services.json` and place it in `android/app/`

## Step 4: App Configuration

The app is configured with Firebase Authentication:
- **Firebase Authentication Plugin:** `@capacitor-firebase/authentication`
- **Auto-platform detection:** Uses Firebase SDK on native, Supabase OAuth on web
- **Token exchange:** Firebase ID tokens are exchanged with Supabase backend

## How It Works

### Firebase Native Android Flow
1. User taps "Continue with Google"
2. Firebase Auth SDK opens → User selects account  
3. App receives Firebase ID token
4. Token exchanged with Supabase via `signInWithIdToken()`
5. User signed in (seamless native experience)

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

## Step 5: Build and Test

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

### Firebase Authentication Issues
- **"Firebase not initialized"**: Ensure `google-services.json` is in `android/app/`
- **"Auth domain error"**: Check Firebase project configuration
- **"Invalid client"**: Verify SHA-1 fingerprint and Firebase Auth setup

### Web/PWA Issues
- **Redirect loops**: Check Supabase redirect URLs match exactly
- **"Unauthorized redirect"**: Verify authorized redirect URIs in Google Cloud
- **Callback errors**: Check `/auth/callback` route is accessible

### Debug Commands
```bash
# Run with live reload and console access
npx cap run android --livereload

# Check Firebase and Supabase integration logs
# Detailed logging available in both flows
```

## Testing Checklist

- [ ] Native Android: Tap Google → Firebase Auth → No browser → Signed in
- [ ] Web browser: Click Google → OAuth popup → Redirect → Signed in
- [ ] PWA: Same as web but can install as app  
- [ ] Same user appears in Supabase regardless of login method

Your Firebase Authentication implementation provides native experience on Android while maintaining web compatibility and unified Supabase backend!