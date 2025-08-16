import { supabase } from '@/integrations/supabase/client';

export const debugAuthState = async () => {
  console.log('🔍 Auth Debug - Starting session validation...');
  
  try {
    // 1. Check frontend session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('📱 Frontend Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : 'Unknown',
      error: sessionError
    });

    // 2. Test database context auth.uid()
    const { data: dbAuthData, error: dbError } = await supabase
      .rpc('validate_unified_auth_system');
    
    console.log('🗄️ Database Auth Context:', {
      dbAuthData,
      dbError
    });

    // 3. Test a simple RLS-protected query
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, access_level')
      .limit(1);
      
    console.log('🔐 RLS Test Query:', {
      profileData,
      profileError,
      message: profileError ? 'RLS blocking query - auth.uid() likely NULL' : 'RLS working correctly'
    });

    // 4. Test direct auth.uid() call
    const { data: authUidData, error: authUidError } = await supabase
      .rpc('test_auth_uid');
      
    console.log('🎯 Direct auth.uid() test:', {
      authUidData,
      authUidError
    });

    return {
      frontendSession: !!session,
      databaseAuth: !dbError,
      rlsWorking: !profileError,
      recommendedFix: profileError ? 'JWT token not being passed to database queries' : 'Auth working correctly'
    };
    
  } catch (error) {
    console.error('❌ Auth Debug Error:', error);
    return {
      frontendSession: false,
      databaseAuth: false,
      rlsWorking: false,
      error: error
    };
  }
};

// Helper function to test auth.uid() directly
export const testAuthUid = async () => {
  const { data, error } = await supabase
    .rpc('test_auth_uid');
  
  return { data, error };
};