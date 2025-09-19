import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBaseQuery } from './useBaseQuery';

export interface AccessData {
  access_level: 'free' | 'trial' | 'premium' | 'admin';
  premium_expires_at: string | null;
  hasAccess: boolean;
  hasPremiumFeatures: boolean;
  hasFoodAccess: boolean;
  hasAIAccess: boolean;
  isAdmin: boolean;
  isTrial: boolean;
  isPremium: boolean;
  isFree: boolean;
  daysRemaining: number | null;
  globalAccessMode: string;
}

const fetchAccessData = async (userId: string): Promise<AccessData> => {
  // Fetch both user access level and global app mode
  const [profileResult, appModeResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('access_level, premium_expires_at')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('app_mode_settings')
      .select('setting_value')
      .eq('setting_key', 'global_access_mode')
      .single()
  ]);

  const globalAccessMode = appModeResult.data?.setting_value || 'trial_premium';

  // Handle RLS failures gracefully - return safe defaults instead of throwing
  if (profileResult.error) {
    console.log('🔒 RLS blocked profiles query (likely auth.uid() is null) - returning safe defaults');
    return {
      access_level: 'free',
      premium_expires_at: null,
      hasAccess: true, // Now includes food access
      hasPremiumFeatures: false,
      hasFoodAccess: true, // All users can access food page
      hasAIAccess: false,
      isAdmin: false,
      isTrial: false,
      isPremium: false,
      isFree: true,
      daysRemaining: null,
      globalAccessMode
    };
  }

  const data = profileResult.data;
  const access_level = data?.access_level || 'free';
  const premium_expires_at = data?.premium_expires_at;
  
  // Check if premium access is expired
  const isExpired = premium_expires_at ? new Date(premium_expires_at) < new Date() : false;
  let effectiveLevel = isExpired && access_level !== 'admin' ? 'free' : access_level;
  
  // Global access mode is now simplified to trial_premium only
  // No overrides needed since we only have trial_premium mode
  
  // Calculate days remaining for trial/premium
  const daysRemaining = premium_expires_at ? 
    Math.max(0, Math.ceil((new Date(premium_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;

  // Determine access permissions based on effective level
  const isAdmin = effectiveLevel === 'admin';
  const isPremium = effectiveLevel === 'premium';
  const isTrial = effectiveLevel === 'trial';
  const isFree = effectiveLevel === 'free';
  
  // Access logic based on effective level
  const hasPremiumFeatures = isAdmin || isPremium || isTrial;
  const hasFoodAccess = true; // All users can access food page (manual entry available)
  const hasAIAccess = isAdmin || isPremium || isTrial; // AI features remain premium
  const hasAccess = hasPremiumFeatures || hasFoodAccess;

  return {
    access_level: effectiveLevel as 'free' | 'trial' | 'premium' | 'admin',
    premium_expires_at,
    hasAccess,
    hasPremiumFeatures,
    hasFoodAccess,
    hasAIAccess,
    isAdmin,
    isTrial,
    isPremium,
    isFree,
    daysRemaining,
    globalAccessMode
  };
};

export const useAccess = () => {
  const { user } = useAuth();
  
  // Clean up any existing role testing data from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasRoleTesting = localStorage.getItem('admin_role_testing');
      if (hasRoleTesting) {
        console.log('🧹 Cleaning up role testing from localStorage');
        localStorage.removeItem('admin_role_testing');
      }
    }
  }, []);

  const { data, isLoading, error, refetch, isInitialLoading, isRefetching, errorMessage } = useBaseQuery(
    ['access', user?.id],
    () => fetchAccessData(user!.id),
    {
      enabled: !!user?.id,
      staleTime: 30 * 1000, // 30 seconds - faster refresh for better UX
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Allow one retry for network issues
      retryDelay: 1000, // Quick retry after 1 second
      refetchOnWindowFocus: false, // Don't refetch on window focus
      networkMode: 'offlineFirst', // Use cached data when offline
    }
  );

  // Default data for unauthenticated users
  const defaultData: AccessData = {
    access_level: 'free',
    premium_expires_at: null,
    hasAccess: true, // Now includes food access
    hasPremiumFeatures: false,
    hasFoodAccess: true, // All users can access food page
    hasAIAccess: false,
    isAdmin: false,
    isTrial: false,
    isPremium: false,
    isFree: true,
    daysRemaining: null,
    globalAccessMode: 'trial_premium'
  };

  // Merge with actual data
  const actualData = {
    ...defaultData,
    ...data,
    loading: isLoading,
    error,
    refetch
  };

  return {
    ...actualData,
    // Helper functions
    createSubscription: async () => {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      if (data?.url) {
        window.open(data.url, '_blank');
      }
      return { data, error };
    },
    openCustomerPortal: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (data?.url) {
        window.open(data.url, '_blank');
      }
      return { data, error };
    }
  };
};