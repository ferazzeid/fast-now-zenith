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

// 🛡️ CORS CONFIGURATION - SIMPLIFIED (NO CLIENT API KEYS)
export const PROTECTED_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

// 🔑 OPENAI API CONFIGURATION - DYNAMIC MODEL SUPPORT
export const PROTECTED_OPENAI_CONFIG = {
  DEFAULT_CHAT_MODEL: 'gpt-4o-mini', // Fallback if no model configured
  BURST_LIMIT: 5,
  BURST_WINDOW_MS: 10_000,
} as const;

// 🧠 MODEL PARAMETER MAPPING
interface ModelConfig {
  supportsTemperature: boolean;
  tokenParam: 'max_tokens' | 'max_completion_tokens';
  maxTokens: number;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-5-2025-08-07': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 16384 },
  'gpt-5-mini-2025-08-07': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 16384 },
  'gpt-5-nano-2025-08-07': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 8192 },
  'o3-2025-04-16': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 16384 },
  'o4-mini-2025-04-16': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 8192 },
  'gpt-4.1-2025-04-14': { supportsTemperature: false, tokenParam: 'max_completion_tokens', maxTokens: 16384 },
  'gpt-4o-mini': { supportsTemperature: true, tokenParam: 'max_tokens', maxTokens: 16384 },
  'gpt-4o': { supportsTemperature: true, tokenParam: 'max_tokens', maxTokens: 4096 }
};

// 🚨 VALIDATION GUARDS
export function validateCorsHeaders(headers: Record<string, string>): boolean {
  const required = Object.keys(PROTECTED_CORS_HEADERS);
  return required.every(key => headers[key] === PROTECTED_CORS_HEADERS[key as keyof typeof PROTECTED_CORS_HEADERS]);
}

export function validateOpenAIConfig(config: Record<string, unknown>): boolean {
  return (
    typeof config.model === 'string' &&
    MODEL_CONFIGS[config.model as string] !== undefined &&
    config.burstLimit === PROTECTED_OPENAI_CONFIG.BURST_LIMIT
  );
}

// 🤖 DYNAMIC MODEL RESOLUTION
export async function resolveOpenAIModel(supabase: any): Promise<string> {
  console.log('🤖 Resolving AI model...');
  
  try {
    const { data } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'ai_model_name')
      .maybeSingle();
    
    if (data?.setting_value && MODEL_CONFIGS[data.setting_value]) {
      console.log(`✅ Using configured model: ${data.setting_value}`);
      return data.setting_value;
    }
  } catch (error) {
    console.error('❌ Failed to fetch model from database:', error);
  }
  
  console.log(`⚠️  Using default model: ${PROTECTED_OPENAI_CONFIG.DEFAULT_CHAT_MODEL}`);
  return PROTECTED_OPENAI_CONFIG.DEFAULT_CHAT_MODEL;
}

// 🧠 MODEL PARAMETER HELPER
export function getModelConfig(modelName: string): ModelConfig & { model: string } {
  const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS[PROTECTED_OPENAI_CONFIG.DEFAULT_CHAT_MODEL];
  return { ...config, model: modelName };
}

// 🔧 API KEY RESOLUTION - SIMPLIFIED (SINGLE SOURCE)
export async function resolveOpenAIApiKey(supabase: any): Promise<string> {
  console.log('🔑 Resolving OpenAI API key...');
  
  // 1. Shared settings (primary and preferred method)
  try {
    const { data: sharedKey } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_api_key')
      .maybeSingle();
    
    if (sharedKey?.setting_value) {
      console.log('✅ Found API key in shared settings (admin-configured)');
      return sharedKey.setting_value;
    }
  } catch (error) {
    console.error('❌ Failed to fetch shared API key from database:', error);
  }
  
  // 2. Environment variable (server fallback only - not recommended)
  const envKey = Deno.env.get('OPENAI_API_KEY');
  if (envKey) {
    console.warn('⚠️  Using environment variable API key (fallback mode)');
    return envKey;
  }
  
  // No key available
  console.error('🚫 No OpenAI API key available');
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