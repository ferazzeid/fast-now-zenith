import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useUnifiedCacheManager } from './useUnifiedCacheManager';

/**
 * Base query hook that provides standardized error handling, loading states, and cache management
 * Supports both async and sync query functions
 */
export const useBaseQuery = <TData = unknown, TError = Error>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData> | TData,
  options: Partial<UseQueryOptions<TData, TError>> = {}
) => {
  const { clearAllCache } = useUnifiedCacheManager();

  // Wrap sync functions to be async
  const asyncQueryFn = useCallback(async (): Promise<TData> => {
    const result = queryFn();
    return result instanceof Promise ? result : Promise.resolve(result);
  }, [queryFn]);

  const standardizedOptions: UseQueryOptions<TData, TError> = {
    queryKey,
    queryFn: asyncQueryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  };

  const query = useQuery(standardizedOptions);

  // Enhanced error handling
  const handleError = useCallback((error: any) => {
    console.error('Query error:', error, 'Query key:', queryKey);
    
    // Handle auth errors
    if (error?.message?.includes('auth') || 
        error?.message?.includes('token') ||
        error?.status === 401) {
      console.warn('⚠️ Auth error detected, clearing cache');
      clearAllCache();
    }
  }, [clearAllCache, queryKey]);

  // Handle errors when they occur
  if (query.error) {
    handleError(query.error);
  }

  return {
    ...query,
    // Standardized loading states
    isInitialLoading: query.isLoading && query.isFetching && !query.data,
    isRefetching: query.isFetching && !query.isLoading,
    isLoadingError: query.isError && query.isLoading,
    // Enhanced error info
    errorMessage: (query.error as any)?.message || 'An unexpected error occurred',
    isAuthError: (query.error as any)?.status === 401 || (query.error as any)?.message?.includes('auth'),
    isNetworkError: (query.error as any)?.name === 'NetworkError' || (query.error as any)?.message?.includes('network'),
  };
};

/**
 * Base mutation hook with standardized error handling
 */
export const useBaseMutation = <TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: any = {}
) => {
  const { clearAllCache } = useUnifiedCacheManager();

  const standardizedOptions = {
    mutationFn,
    retry: 1,
    onError: (error: any) => {
      console.error('Mutation error:', error);
      
      // Handle auth errors in mutations
      if (error?.message?.includes('auth') || 
          error?.message?.includes('token') ||
          error?.status === 401) {
        console.warn('⚠️ Auth error in mutation, clearing cache');
        clearAllCache();
      }
      
      // Call user-provided onError if it exists
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  };

  return standardizedOptions;
};