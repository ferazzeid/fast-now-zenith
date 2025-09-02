# TWA Setup Instructions

Your bulletproof branding system is now implemented! Here's how to set it up:

## 1. Add Scripts to package.json

Since package.json is read-only in this environment, you'll need to add these scripts manually after exporting to GitHub:

```json
{
  "scripts": {
    "validate-branding": "node scripts/validate-branding.js",
    "sync-twa": "node scripts/sync-twa-config.js",
    "build-twa": "npm run validate-branding && npm run sync-twa && npx bubblewrap build",
    "prebuild": "npm run validate-branding"
  }
}
```

## 2. How to Use

### First Time Setup
```bash
# Install dependencies
npm install

# Validate your admin panel settings
npm run validate-branding

# Sync TWA config from admin panel
npm run sync-twa

# Build TWA APK
npm run build-twa
```

### Daily Development
```bash
# For web/PWA - just work normally
npm run dev

# For TWA updates - sync and rebuild
npm run build-twa
```

## 3. What Changed

### ✅ Dynamic Manifest Enhanced
- Now serves actual image files with `?type=icon&size=X`
- Serves splash screens with `?type=splash`
- Always pulls from your admin panel database

### ✅ Auto-Sync Scripts Created
- `scripts/sync-twa-config.js` - Syncs TWA config from database
- `scripts/validate-branding.js` - Validates all assets work

### ✅ Config Files Auto-Generated
- `twa-manifest.json` and `bubblewrap.config.json` now auto-sync
- Never edit these manually - they'll be overwritten

### ✅ Build Validation
- Every build checks admin panel settings are complete
- Validates all asset URLs are accessible
- Clear error messages if anything is missing

## 4. Troubleshooting

If you get errors, run `npm run validate-branding` to see exactly what needs to be fixed in your admin panel.

## 5. Future-Proof

Your admin panel is now the **single source of truth**. Any branding changes you make there will automatically apply to:
- Web app ✅
- PWA ✅  
- TWA ✅

No more manual config file updates, no more broken logos! 🎉