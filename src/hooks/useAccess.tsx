import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AccessData {
  access_level: 'free' | 'trial' | 'premium' | 'admin' | 'free_full' | 'free_food_only';
  premium_expires_at: string | null;
  hasAccess: boolean;
  hasPremiumFeatures: boolean;
  hasFoodAccess: boolean;
  hasAIAccess: boolean;
  isAdmin: boolean;
  originalIsAdmin?: boolean; // CRITICAL: Preserves original admin status during role testing
  isTrial: boolean;
  isPremium: boolean;
  isFree: boolean;
  isFreeFull: boolean;
  isFreeFood: boolean;
  daysRemaining: number | null;
  globalAccessMode: string;
  // Role testing properties
  testRole?: 'admin' | 'paid_user' | 'free_user' | 'free_full' | 'free_food_only' | null;
  setTestRole?: (role: 'admin' | 'paid_user' | 'free_user' | 'free_full' | 'free_food_only' | null) => void;
  isTestingMode?: boolean;
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
      hasAccess: false,
      hasPremiumFeatures: false,
      hasFoodAccess: false,
      hasAIAccess: false,
      isAdmin: false,
      isTrial: false,
      isPremium: false,
      isFree: true,
      isFreeFull: false,
      isFreeFood: false,
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
  
  // Override user access level based on global app mode
  if (globalAccessMode === 'free_full' && effectiveLevel !== 'admin') {
    effectiveLevel = 'free_full';
  } else if (globalAccessMode === 'free_food_only' && effectiveLevel !== 'admin') {
    effectiveLevel = 'free_food_only';
  }
  
  // Calculate days remaining for trial/premium
  const daysRemaining = premium_expires_at ? 
    Math.max(0, Math.ceil((new Date(premium_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;

  // Determine access permissions based on effective level
  const isAdmin = effectiveLevel === 'admin';
  const isPremium = effectiveLevel === 'premium';
  const isTrial = effectiveLevel === 'trial';
  const isFree = effectiveLevel === 'free';
  const isFreeFull = effectiveLevel === 'free_full';
  const isFreeFood = effectiveLevel === 'free_food_only';
  
  // Access logic based on effective level
  const hasPremiumFeatures = isAdmin || isPremium || isTrial || isFreeFull;
  const hasFoodAccess = isAdmin || isPremium || isTrial || isFreeFull || isFreeFood;
  const hasAIAccess = isAdmin || isPremium || isTrial || isFreeFull;
  const hasAccess = hasPremiumFeatures || hasFoodAccess;

  return {
    access_level: effectiveLevel as 'free' | 'trial' | 'premium' | 'admin' | 'free_full' | 'free_food_only',
    premium_expires_at,
    hasAccess,
    hasPremiumFeatures,
    hasFoodAccess,
    hasAIAccess,
    isAdmin,
    isTrial,
    isPremium,
    isFree,
    isFreeFull,
    isFreeFood,
    daysRemaining,
    globalAccessMode
  };
};

export const useAccess = () => {
  const { user } = useAuth();
  
  // Auto-clear role testing on fresh login to prevent persistence issues
  React.useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const hasRoleTesting = localStorage.getItem('admin_role_testing');
      if (hasRoleTesting) {
        console.log('🧹 Auto-clearing role testing on fresh login');
        localStorage.removeItem('admin_role_testing');
      }
    }
  }, [user?.id]); // Clear when user ID changes (fresh login)
  
  // Internal role testing state with localStorage persistence
  const [testRole, setTestRoleState] = useState<'admin' | 'paid_user' | 'free_user' | 'free_full' | 'free_food_only' | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_role_testing');
      return stored ? (stored as 'admin' | 'paid_user' | 'free_user' | 'free_full' | 'free_food_only') : null;
    }
    return null;
  });
  
  const setTestRole = (role: 'admin' | 'paid_user' | 'free_user' | 'free_full' | 'free_food_only' | null) => {
    setTestRoleState(role);
    if (typeof window !== 'undefined') {
      if (role) {
        localStorage.setItem('admin_role_testing', role);
      } else {
        localStorage.removeItem('admin_role_testing');
      }
    }
  };
  
  const isTestingMode = testRole !== null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['access', user?.id],
    queryFn: () => fetchAccessData(user!.id),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute (synchronized with auth timeout)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failures - prevents auth poisoning
    retryOnMount: false, // Don't retry when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    throwOnError: false, // Never throw errors that could poison auth state
  });

  // Default data for unauthenticated users
  const defaultData: AccessData = {
    access_level: 'free',
    premium_expires_at: null,
    hasAccess: false,
    hasPremiumFeatures: false,
    hasFoodAccess: false,
    hasAIAccess: false,
    isAdmin: false,
    isTrial: false,
    isPremium: false,
    isFree: true,
    isFreeFull: false,
    isFreeFood: false,
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

  // Apply role testing override if active
  if (isTestingMode && testRole) {
    const testAccessLevel = testRole === 'admin' ? 'admin' : 
                           testRole === 'paid_user' ? 'premium' : 
                           testRole === 'free_full' ? 'free_full' :
                           testRole === 'free_food_only' ? 'free_food_only' : 'free';
    
    const testHasPremiumFeatures = testRole === 'admin' || testRole === 'paid_user';
    const testHasFoodAccess = testRole !== 'free_user';
    const testHasAIAccess = testRole === 'admin' || testRole === 'paid_user' || testRole === 'free_full';
    
    return {
      ...actualData,
      access_level: testAccessLevel,
      hasAccess: testHasPremiumFeatures || testHasFoodAccess,
      hasPremiumFeatures: testHasPremiumFeatures,
      hasFoodAccess: testHasFoodAccess,
      hasAIAccess: testHasAIAccess,
      isAdmin: testAccessLevel === 'admin',
      originalIsAdmin: actualData.isAdmin, // CRITICAL: Preserve original admin status
      isTrial: false,
      isPremium: testRole === 'paid_user',
      isFree: testRole === 'free_user',
      isFreeFull: testRole === 'free_full',
      isFreeFood: testRole === 'free_food_only',
      // Role testing functions
      setTestRole,
      testRole,
      isTestingMode,
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
  }

  return {
    ...actualData,
    originalIsAdmin: actualData.isAdmin, // CRITICAL: Always preserve original admin status
    // Role testing functions
    setTestRole,
    testRole,
    isTestingMode,
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