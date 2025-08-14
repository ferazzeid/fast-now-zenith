/**
 * Migration helper to gradually move components from old subscription hooks to unified hook
 * This prevents breaking changes while allowing gradual migration
 */

import { useUnifiedSubscription } from './useUnifiedSubscription';
import { useOptimizedSubscription } from './optimized/useOptimizedSubscription';

interface MigrationOptions {
  useUnified?: boolean;
  component?: string;
}

export const useSubscriptionMigration = (options: MigrationOptions = {}) => {
  const { useUnified = false, component } = options;
  
  // Log migration status for debugging
  if (component) {
    console.log(`🔄 Subscription Migration - ${component}: ${useUnified ? 'Unified' : 'Legacy'}`);
  }
  
  if (useUnified) {
    return useUnifiedSubscription();
  } else {
    // Return optimized subscription in legacy format for compatibility
    const optimized = useOptimizedSubscription();
    return {
      ...optimized,
      platform: 'web', // Default for legacy components
      login_method: 'email', // Default for legacy components
    };
  }
};

// Helper to check if a component should use unified subscription
export const shouldUseUnifiedSubscription = (componentName: string): boolean => {
  // List of components that have been migrated to unified subscription
  const migratedComponents = [
    'SettingsSubscription',
    'Settings',
    // Add more components as they get migrated
  ];
  
  return migratedComponents.includes(componentName);
};