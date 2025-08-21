import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSupabaseOAuthDeepLink } from './useSupabaseOAuthDeepLink';
import { toast } from 'sonner';

/**
 * Enhanced auth hook that combines auth store functionality with OAuth deep link handling.
 * Provides comprehensive mobile OAuth support with session polling fallback.
 */
export function useAuthWithOAuth() {
  const authStore = useAuthStore();
  
  // Set up OAuth deep link handling with enhanced error management
  const { initializeOAuth } = useSupabaseOAuthDeepLink((result) => {
    if (result.success) {
      console.log('✅ OAuth completed successfully via deep link');
    } else if (result.timeout) {
      console.log('⏰ OAuth timed out - user may need to try again');
    } else {
      console.error('❌ OAuth failed:', result.error);
    }
  });

  // Connect the OAuth initialization function to the auth store
  useEffect(() => {
    // Inject the OAuth initializer into the auth store
    useAuthStore.setState({ initializeOAuth });
  }, [initializeOAuth]);

  return {
    ...authStore,
    // Enhanced signInWithGoogle that includes OAuth setup
    signInWithGoogle: authStore.signInWithGoogle,
  };
}