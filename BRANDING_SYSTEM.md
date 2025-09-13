# Bulletproof Branding System

This system ensures your admin panel is the **single source of truth** for all branding across web, PWA, and TWA (Trusted Web Activity).

## How It Works

### 1. Admin Panel is Source of Truth
All branding is configured in **Admin → Branding**:
- App name, short name, description
- App logo, icon, favicon
- Colors and themes

### 2. Dynamic Manifest System
The `/supabase/functions/v1/dynamic-manifest` endpoint:
- Serves PWA manifest JSON by default
- Serves actual image files with `?type=icon&size=X` parameters
- Serves splash screen images with `?type=splash`
- Always pulls from your database settings

### 3. TWA Config Sync
Before building TWA, configuration files are automatically synced:
```bash
npm run sync-twa    # Syncs config from database
npm run build-twa   # Full build with validation and sync
```

### 4. Build-Time Validation
Every build validates that:
- Required settings are configured in admin panel
- All asset URLs are accessible
- Dynamic manifest endpoints work correctly

## Usage

### For Web/PWA Development
Just work normally - everything pulls from your admin panel automatically.

### For TWA Development
```bash
# Validate everything is configured correctly
npm run validate-branding

# Sync TWA config from admin panel and build
npm run build-twa

# Or manually sync and build
npm run sync-twa
npx bubblewrap build
```

## Troubleshooting

### "Missing required settings" Error
1. Go to **Admin → Branding → App Identity Settings**
2. Fill in all required fields (app name, short name, etc.)
3. Run `npm run validate-branding` to verify

### "Asset URL not accessible" Error
1. Go to **Admin → Branding → Brand Assets Manager**
2. Re-upload any broken images
3. Ensure URLs are public and accessible
4. Run `npm run validate-branding` to verify

### TWA Shows Default Icons
1. Run `npm run sync-twa` to update config files
2. Rebuild TWA with `npx bubblewrap build`
3. Install new APK on device

## Files Managed Automatically

These files are now auto-generated from your admin panel:
- `twa-manifest.json` - TWA configuration
- `bubblewrap.config.json` - Bubblewrap build config

**Never edit these files manually** - they'll be overwritten on next sync.

## Benefits

✅ **Single Source of Truth** - Admin panel controls everything  
✅ **No Config Drift** - TWA configs always match admin panel  
✅ **Build-Time Validation** - Catch issues before deployment  
✅ **Future-Proof** - New branding changes apply everywhere automatically  
✅ **Developer Friendly** - Clear error messages and validation  

Your branding will now stay consistent across all platforms forever! 🎉