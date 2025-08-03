import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminAwareToast } from './useAdminErrorFilter';
import { cacheSubscription, getCachedSubscription, deduplicateRequest } from '@/utils/offlineStorage';

interface SubscriptionData {
  subscribed: boolean;
  subscription_status: string;
  subscription_tier: string;
  subscription_end_date?: string;
  requests_used: number;
  request_limit: number;
  isPaidUser: boolean;
  hasPremiumFeatures: boolean;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_status: 'granted_user',
    subscription_tier: 'granted_user',
    requests_used: 0,
    request_limit: 15,
    isPaidUser: false,
    hasPremiumFeatures: false,
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useAdminAwareToast();

  const checkSubscription = async () => {
    if (!user || !session) {
      console.log('UseSubscription: No user or session, setting defaults');
      setSubscriptionData({
        subscribed: false,
        subscription_status: 'granted_user',
        subscription_tier: 'granted_user',
        requests_used: 0,
        request_limit: 15,
        isPaidUser: false,
        hasPremiumFeatures: false,
      });
      setLoading(false);
      return;
    }

    try {
      // Check cache first - 24 hour TTL for subscription data
      const cached = getCachedSubscription(user.id);
      if (cached) {
        console.log('UseSubscription: Using cached data');
        setSubscriptionData(cached);
        setLoading(false);
        return;
      }

      console.log('UseSubscription: Fetching fresh subscription data for user:', user.id);
      
      // Use request deduplication to prevent multiple simultaneous checks
      const subscriptionData = await deduplicateRequest(
        `subscription_${user.id}`,
        async () => {
          // Update user tier based on current conditions
          const { error: tierError } = await supabase.rpc('update_user_tier', {
            _user_id: user.id
          });

          if (tierError) {
            console.error('Error updating user tier:', tierError);
          }

          // Get updated profile with tier
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileError) throw profileError;

          const tier = profile?.user_tier || 'granted_user';
          const requestsUsed = profile?.monthly_ai_requests || 0;

          // Check Stripe subscription for paid users only
          let stripeSubscriptionData = null;
          if (tier === 'paid_user') {
            try {
              const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
              if (stripeError) {
                console.error('Error checking subscription:', stripeError);
              } else {
                stripeSubscriptionData = stripeData;
              }
            } catch (error) {
              console.error('Error calling check-subscription function:', error);
            }
          }

          // Determine subscription status and limits based on tier
          const subscribed = tier !== 'free_user';
          const isPaidUser = tier === 'paid_user' || tier === 'api_user';
          const hasPremiumFeatures = tier !== 'free_user';
          
          // Fetch admin-configured request limits
          const { data: limitsData } = await supabase
            .from('shared_settings')
            .select('setting_key, setting_value')
            .in('setting_key', ['monthly_request_limit', 'free_request_limit']);

          const limitsMap = limitsData?.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>) || {};

          const paidUserLimit = parseInt(limitsMap.monthly_request_limit || '1000');
          const freeUserLimit = parseInt(limitsMap.free_request_limit || '15');

          // Request limits by tier
          const requestLimit = tier === 'api_user' ? Infinity : 
                              tier === 'paid_user' ? paidUserLimit : 
                              tier === 'granted_user' ? freeUserLimit : 0;

          return {
            subscribed,
            subscription_status: tier === 'api_user' ? 'api_key' : 
                               tier === 'paid_user' ? (stripeSubscriptionData?.subscription_status || 'active') :
                               tier === 'granted_user' ? 'granted' : 'free',
            subscription_tier: tier,
            subscription_end_date: stripeSubscriptionData?.subscription_end_date,
            requests_used: requestsUsed,
            request_limit: requestLimit,
            isPaidUser,
            hasPremiumFeatures
          };
        },
        30 // 30 minute cache for request deduplication
      );

      // Cache the result for 24 hours
      cacheSubscription(user.id, subscriptionData);
      setSubscriptionData(subscriptionData);

      console.log('UseSubscription: Final status:', { 
        tier: subscriptionData.subscription_tier,
        isPaidUser: subscriptionData.isPaidUser, 
        hasPremiumFeatures: subscriptionData.hasPremiumFeatures,
        requestLimit: subscriptionData.request_limit
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Silent fail for subscription checks - don't show error to users
      // Admin users will see the error via useAdminAwareToast
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!user || !session) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error starting subscription",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !session) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      // Open Stripe customer portal in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error opening billing portal",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const trackUsageEvent = async (eventType: string) => {
    if (!user) return;

    try {
      await supabase.rpc('track_usage_event', {
        _user_id: user.id,
        _event_type: eventType,
        _requests_count: subscriptionData.requests_used,
        _subscription_status: subscriptionData.subscription_status,
      });
    } catch (error) {
      console.error('Error tracking usage event:', error);
    }
  };

  const getUsageWarning = () => {
    const { requests_used, request_limit, subscribed } = subscriptionData;
    const percentage = (requests_used / request_limit) * 100;

    if (percentage >= 100) {
      return {
        level: 'critical',
        message: subscribed 
          ? 'Monthly limit reached. Upgrade limits in admin panel or use your own API key.'
          : 'Free requests used up. Upgrade to premium for 1,000 monthly requests.',
      };
    } else if (percentage >= 90) {
      return {
        level: 'warning',
        message: `You've used ${requests_used} of ${request_limit} requests this month.`,
      };
    } else if (percentage >= 80) {
      return {
        level: 'info',
        message: `You've used ${requests_used} of ${request_limit} requests this month.`,
      };
    }
    return null;
  };

  useEffect(() => {
    checkSubscription();
  }, [user, session]);

  return {
    ...subscriptionData,
    loading,
    checkSubscription,
    createSubscription,
    openCustomerPortal,
    trackUsageEvent,
    getUsageWarning,
  };
};