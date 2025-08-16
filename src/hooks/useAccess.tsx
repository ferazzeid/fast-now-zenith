import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

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
}

const fetchAccessData = async (userId: string): Promise<AccessData> => {
  // Check admin role first
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  const isAdminInDB = !!roleData;

  const { data, error } = await supabase
    .from('profiles')
    .select('access_level, premium_expires_at')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  let access_level = data?.access_level || 'free';
  const premium_expires_at = data?.premium_expires_at;
  
  // Override with admin if found in user_roles
  if (isAdminInDB) {
    access_level = 'admin';
  }
  
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
  const { testRole, isTestingMode } = useRoleTestingContext();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['access', user?.id],
    queryFn: () => fetchAccessData(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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