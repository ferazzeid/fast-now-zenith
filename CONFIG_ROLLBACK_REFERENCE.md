# 🔄 CONFIGURATION ROLLBACK REFERENCE

**Emergency Rollback Guide for Working Configurations**

---

## 🚨 IMMEDIATE ROLLBACK - CORS ISSUES

If CORS is broken and users can't access the app:

### Step 1: Fix Edge Function CORS
Replace CORS headers in **both** functions with this exact code:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

### Step 2: Remove Complex Origin Logic
Remove any `buildCorsHeaders` functions or origin checking logic.

### Step 3: Verify OPTIONS Handler
Ensure both functions have:
```javascript
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

---

## 🔑 IMMEDIATE ROLLBACK - API KEY ISSUES

If OpenAI API calls are failing:

### Step 1: Restore API Key Priority
Use this exact order in both functions:

```javascript
// 1. User's personal key (if enabled)
if (userProfile?.use_own_api_key && userProfile.openai_api_key) {
  return userProfile.openai_api_key;
}

// 2. Shared settings
const { data: sharedKey } = await supabase
  .from('shared_settings')
  .select('setting_value')
  .eq('setting_key', 'shared_api_key')
  .maybeSingle();

if (sharedKey?.setting_value) {
  return sharedKey.setting_value;
}

// 3. Environment variable
const envKey = Deno.env.get('OPENAI_API_KEY');
if (envKey) {
  return envKey;
}

throw new Error('OpenAI API key not available');
```

---

## 📱 IMMEDIATE ROLLBACK - IMAGE GENERATION

If image generation is broken:

### Restore These Exact Settings:
```javascript
{
  model: 'dall-e-2',
  prompt: prompt,
  n: 1,
  size: '512x512',
  response_format: 'b64_json'
}
```

### Storage Upload:
```javascript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('motivator-images')
  .upload(filename, imageBlob, {
    contentType: 'image/png',
    upsert: true
  });
```

---

## 💬 IMMEDIATE ROLLBACK - CHAT COMPLETION

If chat is broken:

### Restore These Settings:
```javascript
{
  model: 'gpt-4o-mini',
  messages: systemMessages,
  tools: [...], // Keep existing tools
  tool_choice: "auto"
}
```

### Burst Limiting:
```javascript
if (!checkBurstLimit(`${userId}:chat-completion`, 5, 10_000)) {
  // Return 429 error
}
```

### Request Limits:
```javascript
const requestLimit = profile.user_tier === 'paid_user' ? 500 : 15;
```

---

## 🔧 WORKING CONFIGURATION TIMESTAMPS

### Last Known Working State:
- **Date:** 2025-01-09
- **CORS:** Wildcard origin working ✅
- **Image Generation:** dall-e-2 with 512x512 working ✅  
- **Chat:** gpt-4o-mini with tools working ✅
- **API Keys:** 3-tier fallback working ✅

### Before Making Changes:
1. Copy current function code to backup files
2. Test changes in development first
3. Have this rollback guide ready
4. Know how to quickly revert

---

## 📋 QUICK DIAGNOSIS

### CORS Issues:
- Users see "CORS error" in browser console
- OPTIONS requests failing (look for 4xx status)
- Different behavior in different browsers

### API Key Issues:
- "API key not found" errors
- 401 Unauthorized from OpenAI
- Users with own keys can't use them

### Function Issues:
- 500 errors in edge function logs
- Timeouts or no response
- Missing environment variables

---

## 🆘 EMERGENCY CONTACTS

If you need to rollback and this guide isn't enough:

1. Check `CRITICAL_CONFIG_LOCK.md` for the protected configurations
2. Look at git history for last working commit
3. Use the protected config constants in `_shared/protected-config.ts`
4. Test with a simple curl command to verify CORS

---

*Generated: 2025-01-09 - Keep this updated when working configurations change*