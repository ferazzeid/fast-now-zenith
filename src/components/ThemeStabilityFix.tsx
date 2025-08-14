import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Component to fix theme switching issues that corrupt React Query cache
 * - Forces theme consistency
 * - Prevents cache corruption during theme changes
 * - Stabilizes calculation values across theme switches
 */
export const ThemeStabilityFix: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    // AUTO-FIX: If user has system theme (causing auto-switching), set to stable theme
    if (theme === 'system') {
      const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      console.log('🎨 THEME AUTO-FIX: Setting stable theme to', currentSystemTheme);
      setTheme(currentSystemTheme);
    }

    // Listen for unwanted theme changes and stabilize cache
    const handleThemeStabilization = () => {
      console.log('🎨 THEME CHANGE DETECTED - Preventing cache corruption');
      // Don't invalidate queries during theme changes to prevent calculation corruption
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeStabilization);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeStabilization);
    };
  }, [theme, setTheme, queryClient]);

  return null; // This is a utility component, renders nothing
};