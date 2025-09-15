# Android Keystore Setup for Production

## Step 1: Generate Keystore (One Time Only)

```bash
# Navigate to android/app directory (after running npx cap add android)
cd android/app

# Generate a new keystore (replace with your details)
keytool -genkey -v -keystore my-upload-key.keystore \
        -alias my-key-alias \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (remember this!)  
# - Your name, organization, etc.
```

## Step 2: Configure Signing

Create `android/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=my-key-alias
storeFile=my-upload-key.keystore
```

## Step 3: Verify Setup

```bash
# Check if keystore exists
ls -la android/app/my-upload-key.keystore

# Verify keystore info
keytool -list -v -keystore android/app/my-upload-key.keystore
```

## Security Notes:
- ⚠️ **NEVER commit keystore.properties to git**
- ⚠️ **BACKUP your keystore file safely** 
- ⚠️ **Remember your passwords - you can't recover them**
- ✅ Add `keystore.properties` to .gitignore
- ✅ Store keystore and passwords in secure location

## Build Commands After Setup:
```bash
# Production APK
npm run cap:build:apk

# Production AAB (recommended for Play Store)
npm run cap:build:aab
```