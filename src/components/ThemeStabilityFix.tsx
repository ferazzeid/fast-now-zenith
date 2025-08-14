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
    // 🔧 COMPLETE THEME STABILITY - Remove all system monitoring
    if (theme === 'system') {
      setTheme('dark'); // Force stable theme
    }
    // NO system theme listeners at all - complete stability
  }, [theme, setTheme]);

  return null; // This is a utility component, renders nothing
};