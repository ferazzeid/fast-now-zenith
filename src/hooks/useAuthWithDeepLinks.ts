import { useEffect } from 'react';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { useOAuthDeepLink } from '@/hooks/useOAuthDeepLink';

/**
 * Combined hook that manages both authentication and OAuth deep links
 * This should be used at the app root level
 */
export function useAuthWithDeepLinks() {
  const { handleOAuthCallback } = useOAuthDeepLink();
  
  // Set up deep link handling for OAuth callbacks
  useDeepLinks(handleOAuthCallback);
}