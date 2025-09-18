import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigationPreferences } from '@/hooks/useNavigationPreferences';
import { useOptimizedProfile } from '@/hooks/optimized/useOptimizedProfile';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Define the priority order for navigation items
const NAVIGATION_PRIORITY = [
  { key: 'fast', path: '/timer', ifPath: '/intermittent-fasting' },
  { key: 'walk', path: '/walking' },
  { key: 'food', path: '/food-tracking' },
  { key: 'goals', path: '/motivator-ideas' }
] as const;

const FALLBACK_PATH = '/settings';

export const SmartHomeRedirect = () => {
  const { preferences, loading } = useNavigationPreferences();
  const { profile, loading: profileLoading } = useOptimizedProfile();

  // Show loading while fetching preferences and profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Find the first enabled navigation item in priority order
  const getRedirectPath = () => {
    for (const item of NAVIGATION_PRIORITY) {
      if (preferences[item.key as keyof typeof preferences]) {
        // For fasting, check user preference for extended vs intermittent
        if (item.key === 'fast') {
          const fastingMode = profile?.fasting_mode || 'extended';
          return fastingMode === 'intermittent' ? item.ifPath : item.path;
        }
        return item.path;
      }
    }
    // If somehow no navigation items are enabled, redirect to settings as fallback
    return FALLBACK_PATH;
  };

  const redirectPath = getRedirectPath();

  return <Navigate to={redirectPath} replace />;
};