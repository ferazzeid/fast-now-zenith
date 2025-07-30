import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  const { toast } = useToast();

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
      console.log('UseSubscription: Checking subscription for user:', user.id);
      
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
      
      // Request limits by tier
      const requestLimit = tier === 'api_user' ? Infinity : 
                          tier === 'paid_user' ? 500 : 
                          tier === 'granted_user' ? 15 : 0;

      setSubscriptionData({
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
      });

      console.log('UseSubscription: Final status:', { 
        tier,
        isPaidUser, 
        hasPremiumFeatures,
        requestLimit
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error checking subscription",
        description: "Please try again later",
        variant: "destructive",
      });
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