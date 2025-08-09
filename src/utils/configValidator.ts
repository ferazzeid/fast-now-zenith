/**
 * 🔒 CONFIGURATION VALIDATOR
 * Runtime validation to ensure critical configurations remain intact
 */

interface CriticalConfig {
  corsWildcard: boolean;
  openaiModel: string;
  burstLimit: number;
  requestLimits: {
    free: number;
    paid: number;
  };
}

const EXPECTED_CONFIG: CriticalConfig = {
  corsWildcard: true,
  openaiModel: 'gpt-4o-mini',
  burstLimit: 5,
  requestLimits: {
    free: 15,
    paid: 500
  }
};

/**
 * Validates that critical configurations match expected values
 */
export function validateCriticalConfig(config: CriticalConfig): {
  isValid: boolean;
  violations: string[];
  warnings: string[];
} {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Check CORS configuration
  if (!config.corsWildcard) {
    violations.push('CORS is not using wildcard origin - this may cause cross-origin issues');
  }

  // Check OpenAI model
  if (config.openaiModel !== EXPECTED_CONFIG.openaiModel) {
    warnings.push(`OpenAI model changed from ${EXPECTED_CONFIG.openaiModel} to ${config.openaiModel}`);
  }

  // Check burst limits
  if (config.burstLimit !== EXPECTED_CONFIG.burstLimit) {
    warnings.push(`Burst limit changed from ${EXPECTED_CONFIG.burstLimit} to ${config.burstLimit}`);
  }

  // Check request limits
  if (config.requestLimits.free !== EXPECTED_CONFIG.requestLimits.free) {
    warnings.push(`Free request limit changed from ${EXPECTED_CONFIG.requestLimits.free} to ${config.requestLimits.free}`);
  }

  if (config.requestLimits.paid !== EXPECTED_CONFIG.requestLimits.paid) {
    warnings.push(`Paid request limit changed from ${EXPECTED_CONFIG.requestLimits.paid} to ${config.requestLimits.paid}`);
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings
  };
}

/**
 * Logs configuration validation results
 */
export function logConfigValidation(config: CriticalConfig): void {
  const result = validateCriticalConfig(config);
  
  console.log('🔒 Configuration Validation:', {
    timestamp: new Date().toISOString(),
    isValid: result.isValid,
    violations: result.violations.length,
    warnings: result.warnings.length
  });

  if (result.violations.length > 0) {
    console.error('🚨 CONFIGURATION VIOLATIONS:', result.violations);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ CONFIGURATION WARNINGS:', result.warnings);
  }
}

/**
 * Creates a configuration backup that can be used for rollback
 */
export function createConfigBackup(): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    config: EXPECTED_CONFIG,
    note: 'This is the working configuration. Use for rollback if needed.'
  }, null, 2);
}

/**
 * Validates edge function responses contain proper CORS headers
 */
export function validateCorsResponse(response: Response): boolean {
  const origin = response.headers.get('Access-Control-Allow-Origin');
  const headers = response.headers.get('Access-Control-Allow-Headers');
  
  return origin === '*' && 
         headers?.includes('authorization') &&
         headers?.includes('content-type');
}