import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useState } from 'react';

export interface AccessData {
  access_level: 'free' | 'trial' | 'premium' | 'admin';
  premium_expires_at: string | null;
  hasAccess: boolean;
  hasPremiumFeatures: boolean;
  isAdmin: boolean;
  isTrial: boolean;
  isPremium: boolean;
  isFree: boolean;
  daysRemaining: number | null;
  // Role testing properties
  testRole?: 'admin' | 'paid_user' | 'free_user' | null;
  setTestRole?: (role: 'admin' | 'paid_user' | 'free_user' | null) => void;
  isTestingMode?: boolean;
}

const fetchAccessData = async (userId: string): Promise<AccessData> => {
  // UNIFIED SYSTEM: Only check profiles.access_level (no more user_roles checking)
  const { data, error } = await supabase
    .from('profiles')
    .select('access_level, premium_expires_at')
    .eq('user_id', userId)
    .single();

  // Handle RLS failures gracefully - return safe defaults instead of throwing
  if (error) {
    console.log('🔒 RLS blocked profiles query (likely auth.uid() is null) - returning safe defaults');
    return {
      access_level: 'free',
      premium_expires_at: null,
      hasAccess: false,
      hasPremiumFeatures: false,
      isAdmin: false,
      isTrial: false,
      isPremium: false,
      isFree: true,
      daysRemaining: null
    };
  }

  const access_level = data?.access_level || 'free';
  const premium_expires_at = data?.premium_expires_at;
  
  // Check if premium access is expired
  const isExpired = premium_expires_at ? new Date(premium_expires_at) < new Date() : false;
  const effectiveLevel = isExpired && access_level !== 'admin' ? 'free' : access_level;
  
  // Calculate days remaining for trial/premium
  const daysRemaining = premium_expires_at ? 
    Math.max(0, Math.ceil((new Date(premium_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;

  return {
    access_level: effectiveLevel as 'free' | 'trial' | 'premium' | 'admin',
    premium_expires_at,
    hasAccess: effectiveLevel !== 'free',
    hasPremiumFeatures: effectiveLevel !== 'free',
    isAdmin: effectiveLevel === 'admin',
    isTrial: effectiveLevel === 'trial',
    isPremium: effectiveLevel === 'premium',
    isFree: effectiveLevel === 'free',
    daysRemaining
  };
};

export const useAccess = () => {
  const { user } = useAuth();
  
  // Internal role testing state with localStorage persistence
  const [testRole, setTestRoleState] = useState<'admin' | 'paid_user' | 'free_user' | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_role_testing');
      return stored ? (stored as 'admin' | 'paid_user' | 'free_user') : null;
    }
    return null;
  });
  
  const setTestRole = (role: 'admin' | 'paid_user' | 'free_user' | null) => {
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
    isAdmin: false,
    isTrial: false,
    isPremium: false,
    isFree: true,
    daysRemaining: null
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
                           testRole === 'paid_user' ? 'premium' : 'free';
    
    return {
      ...actualData,
      access_level: testAccessLevel,
      hasAccess: testAccessLevel !== 'free',
      hasPremiumFeatures: testAccessLevel !== 'free',
      isAdmin: testAccessLevel === 'admin',
      isTrial: false,
      isPremium: testAccessLevel === 'premium',
      isFree: testAccessLevel === 'free',
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