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
  free_requests_limit: number;
  can_use_own_api_key: boolean;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_status: 'free',
    subscription_tier: 'free',
    requests_used: 0,
    request_limit: 1000,
    free_requests_limit: 15,
    can_use_own_api_key: true,
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!user || !session) {
      setLoading(false);
      return;
    }

    try {
      // Check subscription status
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      if (subError) throw subError;

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('monthly_ai_requests, use_own_api_key, subscription_status, subscription_tier')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get shared settings for limits
      const { data: settings, error: settingsError } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['monthly_request_limit', 'free_request_limit']);

      if (settingsError) throw settingsError;

      const monthlyLimit = parseInt(settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000');
      const freeLimit = parseInt(settings?.find(s => s.setting_key === 'free_request_limit')?.setting_value || '15');

      const requestsUsed = profile?.monthly_ai_requests || 0;
      const isPremium = subData?.subscribed || false;
      const currentLimit = isPremium ? monthlyLimit : freeLimit;
      
      // Can use own API key if: premium user OR haven't exceeded free limit
      const canUseOwnApiKey = isPremium || requestsUsed < freeLimit;

      setSubscriptionData({
        subscribed: isPremium,
        subscription_status: subData?.subscription_status || 'free',
        subscription_tier: subData?.subscription_tier || 'free',
        subscription_end_date: subData?.subscription_end_date,
        requests_used: requestsUsed,
        request_limit: currentLimit,
        free_requests_limit: freeLimit,
        can_use_own_api_key: canUseOwnApiKey,
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