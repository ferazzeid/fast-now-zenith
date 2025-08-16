// Remove import to prevent multiple client instances

/**
 * Authentication Token Debugger
 * Helps diagnose JWT token issues and session synchronization problems
 */

export const debugAuthTokens = async () => {
  console.log('🔍 === AUTHENTICATION TOKEN DEBUG ===');
  console.log('Auth debugging temporarily disabled to prevent client conflicts');
  return { hasValidSession: true, reason: 'Debug temporarily disabled' };
};

/**
 * Force a complete session reset and re-authentication
 */
export const forceSessionReset = async () => {
  console.log('🔄 Session reset disabled to prevent conflicts');
  return false;
};

/**
 * Validate that JWT tokens are properly included in requests
 */
export const validateJWTInRequests = () => {
  console.log('🕵️ JWT monitoring disabled to prevent conflicts');
};