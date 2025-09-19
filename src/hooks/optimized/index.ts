/**
 * Optimized hooks with React Query caching
 * 
 * These hooks provide better performance through:
 * - Intelligent caching with stale times
 * - Real-time updates for active sessions
 * - Optimistic UI updates
 * - Background sync and recovery
 * - Consistent error handling
 */

export { useFastingSessionQuery } from './useFastingSessionQuery';
export { useOptimizedWalkingSession } from './useOptimizedWalkingSession';
export { useFoodEntriesQuery } from './useFoodEntriesQuery';
export { useOptimizedProfile } from './useOptimizedProfile';
export { useDailyDeficitQuery } from './useDailyDeficitQuery';
export { useFastingHoursQuery } from './useFastingHoursQuery';
export { useOptimizedManualCalorieBurns } from './useOptimizedManualCalorieBurns';

// Type exports
export type { FastingSession } from './useFastingSessionQuery';
export type { WalkingSession } from './useOptimizedWalkingSession';