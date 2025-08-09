
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
  inTrial: boolean;
  trialEndsAt?: string;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_status: 'free',
    subscription_tier: 'free_user',
    requests_used: 0,
    request_limit: 0,
    isPaidUser: false,
    hasPremiumFeatures: false,
    inTrial: false,
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useAdminAwareToast();

  const checkSubscription = async () => {
    if (!user || !session) {
      console.log('UseSubscription: No user or session, setting defaults');
      setSubscriptionData({
        subscribed: false,
        subscription_status: 'free',
        subscription_tier: 'free_user',
        requests_used: 0,
        request_limit: 0,
        isPaidUser: false,
        hasPremiumFeatures: false,
        inTrial: false,
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
          // Update user tier based on current conditions (trial + subscription status)
          const { error: tierError } = await supabase.rpc('update_user_tier', {
            _user_id: user.id
          });

          if (tierError) {
            console.error('Error updating user tier:', tierError);
          }

          // Get updated profile with tier and trial info
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileError) throw profileError;

          const tier = profile?.user_tier || 'free_user';
          const requestsUsed = profile?.monthly_ai_requests || 0;

          // Check if user is in trial
          const trialEndsAt = profile?.trial_ends_at;
          const inTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

          // Check subscription status from any payment provider
          const hasActiveSubscription = profile?.subscription_status === 'active';

          // User is "paid" if they're in trial OR have active subscription
          const isPaidUser = inTrial || hasActiveSubscription;
          const hasPremiumFeatures = isPaidUser;

          // For paid users, requests are unlimited during trial/subscription
          const requestLimit = isPaidUser ? Infinity : 0;

          const subscriptionStatus = hasActiveSubscription ? 'active' : 
                                   inTrial ? 'trial' : 'free';

          return {
            subscribed: hasActiveSubscription,
            subscription_status: subscriptionStatus,
            subscription_tier: tier,
            subscription_end_date: profile?.subscription_end_date,
            requests_used: requestsUsed,
            request_limit: requestLimit,
            isPaidUser,
            hasPremiumFeatures,
            inTrial,
            trialEndsAt: trialEndsAt
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
        inTrial: subscriptionData.inTrial,
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
    const { inTrial, trialEndsAt, subscription_status } = subscriptionData;

    if (subscription_status === 'free' && !inTrial) {
      return {
        level: 'critical',
        message: 'Trial expired. Upgrade to premium to access Food tracking and AI features.',
      };
    } else if (inTrial && trialEndsAt) {
      const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 1) {
        return {
          level: 'warning',
          message: `Trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to keep access to premium features.`,
        };
      } else if (daysLeft <= 3) {
        return {
          level: 'info',
          message: `${daysLeft} days left in your trial. Upgrade anytime to continue access.`,
        };
      }
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
