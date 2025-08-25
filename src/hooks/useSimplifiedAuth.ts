import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Simplified auth hook that provides basic auth operations
 * This replaces the complex useMobileOAuth hook
 */
export function useSimplifiedAuth() {
  const { signInWithGoogle, loading } = useAuthContext();

  return {
    signInWithGoogle,
    isLoading: loading,
  };
}