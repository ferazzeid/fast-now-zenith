import { supabase } from '@/integrations/supabase/client';

/**
 * Authentication Token Debugger
 * Helps diagnose JWT token issues and session synchronization problems
 */

export const debugAuthTokens = async () => {
  console.log('🔍 === AUTHENTICATION TOKEN DEBUG ===');
  
  try {
    // 1. Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('📋 Frontend Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
      tokenType: session?.token_type,
      error: sessionError
    });

    if (!session) {
      console.log('❌ No session found - user needs to sign in');
      return { hasValidSession: false, reason: 'No session' };
    }

    // 2. Test database context with the current session
    console.log('🗄️ Testing database authentication context...');
    
    try {
      const { data: authTest, error: authError } = await supabase.rpc('validate_unified_auth_system');
      console.log('📊 Database Auth Test:', {
        result: authTest,
        error: authError
      });
    } catch (dbError) {
      console.log('⚠️ Database auth test failed:', dbError);
    }

    // 3. Test RLS with a simple query
    console.log('🔒 Testing Row Level Security...');
    
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      console.log('🛡️ RLS Test Result:', {
        success: !rlsError && rlsTest !== null,
        data: rlsTest,
        error: rlsError
      });
    } catch (rlsTestError) {
      console.log('🛡️ RLS Test Error:', rlsTestError);
    }

    // 4. Check if JWT is being sent properly by inspecting the actual request
    console.log('🔐 JWT Token Analysis:');
    
    // Force a refresh to ensure we have the latest token
    const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.log('🔄 Session refresh failed:', refreshError);
      return { hasValidSession: false, reason: 'Session refresh failed' };
    }

    if (refreshResult.session) {
      console.log('✅ Session refreshed successfully');
      console.log('🔑 New token details:', {
        accessToken: refreshResult.session.access_token ? 'Present' : 'Missing',
        userId: refreshResult.session.user?.id,
        expiresAt: new Date(refreshResult.session.expires_at * 1000)
      });
      
      return { 
        hasValidSession: true, 
        session: refreshResult.session,
        reason: 'Session valid and refreshed' 
      };
    }

    return { hasValidSession: false, reason: 'Session refresh returned null' };

  } catch (error) {
    console.log('💥 Auth debug failed:', error);
    return { hasValidSession: false, reason: `Debug failed: ${error}` };
  }
};

/**
 * Force a complete session reset and re-authentication
 */
export const forceSessionReset = async () => {
  console.log('🔄 === FORCING SESSION RESET ===');
  
  try {
    // 1. Sign out completely
    await supabase.auth.signOut();
    
    // 2. Clear all local storage auth data
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // 3. Clear session storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    console.log('✅ Session reset complete - user must sign in again');
    return true;
    
  } catch (error) {
    console.log('❌ Session reset failed:', error);
    return false;
  }
};

/**
 * Validate that JWT tokens are properly included in requests
 */
export const validateJWTInRequests = () => {
  console.log('🕵️ === MONITORING NETWORK REQUESTS FOR JWT ===');
  
  // Override fetch to monitor JWT inclusion
  const originalFetch = window.fetch;
  let requestCount = 0;
  
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (typeof url === 'string' && url.includes('supabase.co')) {
      requestCount++;
      const headers = options?.headers || {};
      
      console.log(`📡 Request #${requestCount}:`, {
        url: url.replace(/https:\/\/[^.]+\.supabase\.co/, '[SUPABASE]'),
        hasAuthHeader: !!(headers as any)?.authorization || !!(headers as any)?.Authorization,
        authHeaderValue: (headers as any)?.authorization || (headers as any)?.Authorization || 'Not found',
        isUserJWT: ((headers as any)?.authorization || (headers as any)?.Authorization || '').includes('eyJ') && 
                   !((headers as any)?.authorization || (headers as any)?.Authorization || '').includes(process.env.VITE_SUPABASE_ANON_KEY || 'anon_key')
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Restore after 30 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('🔚 JWT monitoring stopped');
  }, 30000);
  
  console.log('🎯 JWT monitoring active for 30 seconds...');
};