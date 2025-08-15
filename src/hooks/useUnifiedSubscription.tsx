/**
 * Unified Subscription Hook - Single source of truth for subscription status
 * This replaces the inconsistent usage of multiple subscription hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { detectPlatform, getPaymentProviderForPlatform } from '@/utils/platformDetection';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

export interface UnifiedSubscriptionData {
  // Core subscription info
  subscribed: boolean;
  subscription_status: string;
  subscription_tier: string;
  subscription_end_date?: string;
  
  // Trial info
  inTrial: boolean;
  trialEndsAt?: string;
  
  // Request limits
  requests_used: number;
  request_limit: number;
  
  // Computed fields
  isPaidUser: boolean;
  hasPremiumFeatures: boolean;
  
  // Platform info
  platform: 'web' | 'android' | 'ios';
  payment_provider: string;
  
  // Auth info
  login_method?: string;
  
  // Debug info
  debug?: {
    source: string;
    cached: boolean;
    timestamp: number;
    platform_detection: any;
  };
}

// Trial helper functions
export const getTrialDaysRemaining = (trialEndsAt?: string): number => {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const timeDiff = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
};

export const getTrialUrgencyLevel = (daysRemaining: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (daysRemaining <= 1) return 'critical';
  if (daysRemaining <= 3) return 'high';
  if (daysRemaining <= 7) return 'medium';
  return 'low';
};

const DEFAULT_SUBSCRIPTION: UnifiedSubscriptionData = {
  subscribed: false,
  subscription_status: 'free',
  subscription_tier: 'free_user',
  requests_used: 0,
  request_limit: 0,
  isPaidUser: false,
  hasPremiumFeatures: false,
  inTrial: false,
  platform: 'web',
  payment_provider: 'stripe',
};

// Centralized subscription fetcher
const fetchUnifiedSubscriptionData = async (userId: string, sessionToken?: string): Promise<UnifiedSubscriptionData> => {
  const startTime = Date.now();
  const platform = detectPlatform();
  const payment_provider = getPaymentProviderForPlatform(platform);
  
  console.log('🔄 Unified Subscription Fetch:', {
    userId,
    platform,
    payment_provider,
    timestamp: new Date().toISOString()
  });

  try {
    // Get profile data including subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        subscription_tier,
        subscription_status,
        subscription_end_date,
        trial_ends_at,
        stripe_customer_id,
        google_play_purchase_token,
        apple_transaction_id,
        user_tier,
        created_at
      `)
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    // Get request limits from settings
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'free_tier_request_limit')
      .single();

    const freeLimit = settings?.setting_value ? parseInt(settings.setting_value) : 5;

    // Determine subscription status
    const now = new Date();
    const subscriptionEndDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null;
    const trialEndDate = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;

    // Check if in trial - be more explicit about trial detection
    const inTrial = trialEndDate ? trialEndDate > now : false;
    
    // Removed noisy trial detection debug logging
    
    // Check if subscribed (active subscription or platform-specific)
    let subscribed = false;
    let subscription_status = 'free';
    
    // Priority: Active subscription > Trial > Free
    if (profile?.subscription_status === 'active' && subscriptionEndDate && subscriptionEndDate > now) {
      subscribed = true;
      subscription_status = 'active';
    } else if (inTrial) {
      subscription_status = 'trial'; // Force trial status when in trial period
    } else {
      subscription_status = 'free';
    }

    // Platform-specific subscription check
    const hasValidPlatformSubscription = 
      (platform === 'android' && profile?.google_play_purchase_token) ||
      (platform === 'ios' && profile?.apple_transaction_id) ||
      (platform === 'web' && profile?.stripe_customer_id && subscribed);

    // Fix: Use user_tier from database as source of truth, not subscription_tier
    const userTier = profile?.user_tier || 'free_user';
    const dbSubscriptionTier = profile?.subscription_tier || 'free';
    
    // User is paid if they have active subscription OR in trial OR user_tier is paid_user
    // BUT: When testing roles, trial status should still show (trials are tied to actual account)
    const isPaidUser = subscribed || inTrial || userTier === 'paid_user';
    const hasPremiumFeatures = isPaidUser;
    
    // Return the database subscription_tier but use user_tier for paid status
    // For role testing: Keep trial info visible even when testing as free_user
    const displayTier = isPaidUser ? 'paid' : 'free';

    // Get auth provider info
    const { data: { user } } = await supabase.auth.getUser();
    const login_method = user?.app_metadata?.provider || 'email';

    const result: UnifiedSubscriptionData = {
      subscribed: subscribed || !!hasValidPlatformSubscription,
      subscription_status,
      subscription_tier: displayTier,
      subscription_end_date: profile?.subscription_end_date,
      inTrial,
      trialEndsAt: profile?.trial_ends_at,
      requests_used: 0, // Will be fetched separately if needed
      request_limit: isPaidUser ? 1000 : freeLimit,
      isPaidUser,
      hasPremiumFeatures,
      platform,
      payment_provider,
      login_method,
      debug: {
        source: 'unified_fetch',
        cached: false,
        timestamp: Date.now(),
        platform_detection: {
          detected_platform: platform,
          user_agent: navigator.userAgent,
          capacitor: !!(window as any).Capacitor,
          subscription_sources: {
            stripe: !!profile?.stripe_customer_id,
            google_play: !!profile?.google_play_purchase_token,
            apple: !!profile?.apple_transaction_id,
          }
        }
      }
    };

    console.log('✅ Unified Subscription Result:', {
      ...result,
      fetchDuration: Date.now() - startTime + 'ms'
    });

    return result;
  } catch (error) {
    console.error('❌ Unified subscription fetch error:', error);
    return {
      ...DEFAULT_SUBSCRIPTION,
      platform,
      payment_provider,
      debug: {
        source: 'error_fallback',
        cached: false,
        timestamp: Date.now(),
        platform_detection: { error: error.message }
      }
    };
  }
};

export const useUnifiedSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [platform] = useState(() => detectPlatform());
  
  // Import role testing context
  const { testRole, isTestingMode } = useRoleTestingContext();

  const {
    data: subscriptionData = DEFAULT_SUBSCRIPTION,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['unified-subscription', user?.id],
    queryFn: () => fetchUnifiedSubscriptionData(user!.id, session?.access_token),
    enabled: !!user?.id,
    staleTime: 0, // Force fresh data
    gcTime: 1 * 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true, // Refresh when focus
    refetchOnMount: true, // Always refresh on mount
    retry: 2,
  });

  // Force cache clear on mount for debugging
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Force invalidating subscription cache on mount');
      queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
    }
  }, [user?.id, queryClient]);

  // Enhanced debug logging
  useEffect(() => {
    if (subscriptionData && user?.id) {
      console.log('🔍 SUBSCRIPTION STATE DEBUG:', {
        userId: user.id,
        subscribed: subscriptionData.subscribed,
        subscription_status: subscriptionData.subscription_status,
        inTrial: subscriptionData.inTrial,
        trialEndsAt: subscriptionData.trialEndsAt,
        subscription_tier: subscriptionData.subscription_tier,
        isPaidUser: subscriptionData.isPaidUser,
        platform: subscriptionData.platform,
        debug: subscriptionData.debug,
        timestamp: new Date().toISOString()
      });
    }
  }, [subscriptionData, user?.id]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    console.log('🔄 Manual subscription cache invalidation');
    queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
    queryClient.refetchQueries({ queryKey: ['unified-subscription'] });
  }, [queryClient]);

  // Create subscription
  const createSubscription = useCallback(async () => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade to premium",
        variant: "destructive"
      });
      return;
    }

    try {
      if (platform === 'web') {
        const { data, error } = await supabase.functions.invoke('create-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
          return { success: true };
        }
      } else {
        const platformName = platform === 'ios' ? 'App Store' : 'Google Play Store';
        toast({
          title: `${platformName} Purchase Required`,
          description: `To upgrade to premium, please use the ${platformName} billing system.`,
        });
        return { platform, requiresNativePurchase: true };
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  }, [platform, user, session, toast]);

  // Open customer portal
  const openCustomerPortal = useCallback(async () => {
    if (!user || !session) return;

    try {
      if (platform === 'web') {
        const { data, error } = await supabase.functions.invoke('customer-portal', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } else {
        const manageUrl = platform === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions';
        window.open(manageUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive"
      });
    }
  }, [platform, user, session, toast]);

  // Apply test role overrides
  const finalData = isTestingMode && testRole ? {
    ...subscriptionData,
    // Override values based on test role
    ...(testRole === 'trial_user' && {
      subscription_status: 'trial',
      subscription_tier: 'paid',
      inTrial: true,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      isPaidUser: false, // Still false because it's a trial, not paid
      hasPremiumFeatures: true, // Has access during trial
      request_limit: 1000,
    }),
    ...(testRole === 'free_user' && {
      subscription_status: 'free',
      subscription_tier: 'free',
      inTrial: false,
      trialEndsAt: undefined,
      isPaidUser: false,
      hasPremiumFeatures: false,
      request_limit: 5,
    }),
    ...(testRole === 'paid_user' && {
      subscription_status: 'active',
      subscription_tier: 'paid',
      inTrial: false,
      isPaidUser: true,
      hasPremiumFeatures: true,
      request_limit: 1000,
    })
  } : subscriptionData;

  return {
    ...finalData,
    loading,
    error,
    refetch,
    invalidate,
    createSubscription,
    openCustomerPortal,
  };
};