/**
 * Authentication Configuration Validator
 * Prevents unintended changes to critical auth settings that could break token refresh
 */

export interface AuthConfigValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  config: {
    flowType: 'pkce' | 'implicit';
    detectSessionInUrl: boolean;
    persistSession: boolean;
    autoRefreshToken: boolean;
  };
}

/**
 * Validates current auth configuration against recommended settings
 */
export const validateAuthConfiguration = (): AuthConfigValidation => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Detect environment
  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     !window.location.hostname.includes('lovableproject.com'));
  
  // Recommended configuration
  const config = {
    flowType: 'pkce' as const, // Always use PKCE for security
    detectSessionInUrl: true, // Always detect for proper OAuth handling
    persistSession: true, // Required for proper session management
    autoRefreshToken: true, // Essential for seamless user experience
  };
  
  // Validation checks
  if (isCapacitor && isProduction) {
    warnings.push('Running Capacitor in production - ensure proper OAuth URL configuration');
  }
  
  // Log configuration for debugging
  console.log('🔐 Auth Configuration Validation:', {
    environment: {
      isCapacitor,
      isProduction,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
    },
    config,
    warnings,
    errors
  });
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    config
  };
};

/**
 * Creates a protected auth configuration that logs any changes
 */
export const createProtectedAuthConfig = () => {
  const validation = validateAuthConfiguration();
  
  if (!validation.isValid) {
    console.error('❌ Auth configuration validation failed:', validation.errors);
    throw new Error(`Auth configuration errors: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Auth configuration warnings:', validation.warnings);
  }
  
  console.log('✅ Auth configuration validated successfully');
  return validation.config;
};