import { useUnifiedSession } from './useUnifiedSession';
import { useAccess } from './useAccess';

/**
 * Simple auth hook that provides immediate access to user status
 * without waiting for complex database readiness checks.
 */
export const useSimpleAuth = () => {
  const { user, session, isReady } = useUnifiedSession();
  const { isAdmin, access_level, hasAccess } = useAccess();
  
  return {
    user,
    session,
    isReady,
    isAuthenticated: !!user,
    isAdmin,
    accessLevel: access_level,
    hasAccess
  };
};