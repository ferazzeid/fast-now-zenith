import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationPreferences } from '@/hooks/useNavigationPreferences';

// Map routes to navigation preference keys
const ROUTE_TO_PREFERENCE_MAP: Record<string, keyof ReturnType<typeof useNavigationPreferences>['preferences']> = {
  '/timer': 'fast',
  '/walking': 'walk', 
  '/food-tracking': 'food',
  '/add-food': 'food',
  '/my-foods': 'food',
  '/food-history': 'food',
  '/motivator-ideas': 'goals',
  '/motivators': 'goals'
};

const FALLBACK_ROUTES = ['/timer', '/walking', '/food-tracking', '/motivator-ideas', '/settings'];

export const NavigationGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, loading } = useNavigationPreferences();

  useEffect(() => {
    // Don't redirect while loading preferences
    if (loading) return;

    const currentPath = location.pathname;
    const preferenceKey = ROUTE_TO_PREFERENCE_MAP[currentPath];
    
    // If this route is tied to a navigation preference and that preference is disabled
    if (preferenceKey && !preferences[preferenceKey]) {
      // Find the first enabled fallback route
      for (const fallbackRoute of FALLBACK_ROUTES) {
        const fallbackKey = ROUTE_TO_PREFERENCE_MAP[fallbackRoute];
        if (!fallbackKey || preferences[fallbackKey]) {
          navigate(fallbackRoute, { replace: true });
          return;
        }
      }
      
      // If no enabled routes found, go to settings as ultimate fallback
      navigate('/settings', { replace: true });
    }
  }, [location.pathname, preferences, loading, navigate]);

  return <>{children}</>;
};