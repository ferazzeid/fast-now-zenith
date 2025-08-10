/**
 * Utility functions for cleaning up auth-related data and preventing stuck states
 */

export const clearAuthData = () => {
  try {
    // Clear auth storage
    localStorage.removeItem('auth-storage');
    
    // Clear Supabase session data
    localStorage.removeItem('supabase.auth.token');
    
    // Clear any other auth-related localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage as well
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Auth data cleared successfully');
    return true;
  } catch (error) {
    console.error('🧹 Failed to clear auth data:', error);
    return false;
  }
};

export const isStuckInAuthLoop = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return false;
    
    const parsed = JSON.parse(authStorage);
    const state = parsed.state;
    
    // Check for indicators of stuck state
    return state && (
      (state.loading && state.initialized) || // Stuck loading after initialization
      (state.session && !state.user) || // Inconsistent session/user state
      (!state.session && state.user) // Inconsistent user/session state
    );
  } catch (error) {
    console.error('🧹 Failed to check auth loop state:', error);
    return false;
  }
};

export const performAuthCleanupIfNeeded = () => {
  if (isStuckInAuthLoop()) {
    console.log('🧹 Stuck auth loop detected, performing cleanup...');
    clearAuthData();
    return true;
  }
  return false;
};

export const handleGoogleAuthRedirectCleanup = () => {
  // Clean up any Google OAuth redirect artifacts
  const url = new URL(window.location.href);
  
  // Remove OAuth-related URL parameters
  const oauthParams = ['code', 'state', 'session_state', 'access_token', 'error'];
  let hasOAuthParams = false;
  
  oauthParams.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasOAuthParams = true;
    }
  });
  
  // If we had OAuth parameters, clean up the URL
  if (hasOAuthParams) {
    console.log('🧹 Cleaning up OAuth redirect parameters');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
};