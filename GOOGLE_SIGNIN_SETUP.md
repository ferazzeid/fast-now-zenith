# Google Sign-In SDK Setup Instructions

The Google Sign-In SDK has been successfully implemented! Here's what you need to do to complete the setup:

## ✅ What's Been Implemented

- **Native Google Sign-In Handler**: `GoogleSignInHandler.ts` using `@codetrix-studio/capacitor-google-auth`
- **Updated Authentication Flow**: All components now use the native SDK instead of browser-based OAuth
- **Capacitor Configuration**: Google Auth plugin configured in `capacitor.config.ts`
- **Android Dependencies**: Google Play Services Auth added to `android/app/build.gradle`
- **Fallback Support**: Web platform still uses standard OAuth flow

## 🔧 Required Configuration Steps

### 1. Update Google Cloud Console

You mentioned you already have an Android OAuth client in Google Cloud Console. Make sure it has:

- **Application Type**: Android
- **Package Name**: `com.fastnow.zenith`
- **SHA-1 Certificate Fingerprint**: Your debug/release certificate fingerprints

### 2. Get Your Web Client ID

In Google Cloud Console, you also need a **Web** OAuth client (this is different from your Android client):

1. Go to Google Cloud Console → APIs & Credentials → Credentials
2. Create a new OAuth 2.0 Client ID with type "Web application"
3. Copy the Client ID (it should end with `.apps.googleusercontent.com`)

### 3. Update Configuration Files

Replace the placeholder in these files with your actual Web Client ID:

**In `capacitor.config.ts`:**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com', // ← Update this
  forceCodeForRefreshToken: true,
},
```

**In `src/utils/GoogleSignInHandler.ts`:**
```typescript
await GoogleAuth.initialize({
  clientId: 'YOUR_ACTUAL_WEB_CLIENT_ID', // ← Update this (without .apps.googleusercontent.com)
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});
```

### 4. Sync Changes to Native Platform

After updating the configuration:

1. `git pull` your project from GitHub
2. `npm install` to ensure dependencies are installed  
3. `npx cap sync` to sync changes to the native platform
4. `npx cap run android` to test on Android

## 🎯 How It Works Now

### Native Platform (Android/iOS)
1. User taps Google Sign-In button
2. Native Google Sign-In SDK opens natively (no browser)
3. User authenticates with Google
4. Google returns ID token to the app
5. App exchanges ID token with Supabase using `signInWithIdToken()`
6. User is logged in - session managed by Supabase

### Web Platform  
1. Falls back to standard Supabase OAuth flow
2. Opens Google OAuth in browser tab
3. Redirects back to app after authentication

## 🔍 Benefits of This Implementation

- ✅ **Pure Native Experience**: No browser opening on mobile
- ✅ **No Deep Link Issues**: No custom schemes or redirect handling needed
- ✅ **Faster Authentication**: Direct token exchange with Supabase
- ✅ **Better UX**: Native Google Sign-In UI that users expect
- ✅ **Reliable**: Uses Google's official SDK instead of browser workarounds

## 🐛 Troubleshooting

If you encounter issues:

1. **"GoogleAuth not available"**: Make sure you ran `npx cap sync`
2. **"Invalid client ID"**: Verify the Web client ID is correct in both config files
3. **"SHA-1 mismatch"**: Ensure your Android OAuth client has the correct SHA-1 fingerprints
4. **Build errors**: Run `npx cap clean` then `npx cap sync`

The old `MobileOAuthHandler.ts` can be deleted once you confirm the new implementation works correctly.