import { useAuth } from './useAuth';
import { useAccess } from './useAccess';

/**
 * Simple auth hook that provides immediate access to user status
 * without waiting for complex database readiness checks.
 */
export const useSimpleAuth = () => {
  const { user, session, loading } = useAuth();
  const { isAdmin, access_level, hasAccess } = useAccess();
  
  return {
    user,
    session,
    isReady: !loading,
    isAuthenticated: !!user,
    isAdmin,
    accessLevel: access_level,
    hasAccess
  };
};