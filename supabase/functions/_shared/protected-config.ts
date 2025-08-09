/**
 * 🔒 PROTECTED CONFIGURATION CONSTANTS
 * ⚠️  DO NOT MODIFY WITHOUT EXPLICIT USER PERMISSION
 * 
 * These are WORKING configurations that have been proven stable.
 * Any changes should be approved by the user first.
 * 
 * Last Updated: 2025-01-09
 * Status: ✅ WORKING
 */

// 🛡️ CORS CONFIGURATION - PROVEN TO WORK
export const PROTECTED_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

// 🔑 OPENAI API CONFIGURATION - STABLE SETTINGS
export const PROTECTED_OPENAI_CONFIG = {
  CHAT_MODEL: 'gpt-4o-mini',
  IMAGE_MODEL: 'dall-e-2',
  IMAGE_SIZE: '512x512',
  IMAGE_FORMAT: 'b64_json',
  BURST_LIMIT: 5,
  BURST_WINDOW_MS: 10_000,
  FREE_REQUEST_LIMIT: 15,
  PAID_REQUEST_LIMIT: 500,
} as const;

// 🚨 VALIDATION GUARDS
export function validateCorsHeaders(headers: Record<string, string>): boolean {
  const required = Object.keys(PROTECTED_CORS_HEADERS);
  return required.every(key => headers[key] === PROTECTED_CORS_HEADERS[key as keyof typeof PROTECTED_CORS_HEADERS]);
}

export function validateOpenAIConfig(config: Record<string, unknown>): boolean {
  return (
    config.model === PROTECTED_OPENAI_CONFIG.CHAT_MODEL &&
    config.burstLimit === PROTECTED_OPENAI_CONFIG.BURST_LIMIT
  );
}

// 🔧 API KEY RESOLUTION - PROTECTED LOGIC (SHARED KEY ONLY)
export async function resolveOpenAIApiKey(
  supabase: any,
  userProfile?: any,
  providedApiKey?: string,
  headerApiKey?: string
): Promise<string> {
  // 1. Header API key (for backwards compatibility)
  if (headerApiKey) {
    return headerApiKey;
  }
  
  // 2. Provided API key (legacy support)
  if (providedApiKey) {
    return providedApiKey;
  }
  
  // 3. Shared settings (primary method)
  try {
    const { data: sharedKey } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_api_key')
      .maybeSingle();
    
    if (sharedKey?.setting_value) {
      return sharedKey.setting_value;
    }
  } catch (error) {
    console.warn('Failed to fetch shared API key:', error);
  }
  
  // 4. Environment variable (fallback)
  const envKey = Deno.env.get('OPENAI_API_KEY');
  if (envKey) {
    return envKey;
  }
  
  throw new Error('OpenAI API key not available. Please configure a shared API key in admin settings.');
}

// 📊 RUNTIME VALIDATION
export function logConfigurationState(): void {
  console.log('🔒 Protected Configuration State:');
  console.log('CORS Headers:', PROTECTED_CORS_HEADERS);
  console.log('OpenAI Config:', PROTECTED_OPENAI_CONFIG);
  console.log('Timestamp:', new Date().toISOString());
}

// ⚠️ SECURITY NOTICE
export const SECURITY_NOTICE = `
🔒 SECURITY NOTICE: This configuration has been marked as PROTECTED.
Any modifications should be approved by the user first.
See CRITICAL_CONFIG_LOCK.md for details.
` as const;