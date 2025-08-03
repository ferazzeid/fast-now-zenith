import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionCache } from './useSubscriptionCache';
import { debounce } from '@/utils/memoryUtils';
import { detectPlatform } from '@/utils/platformDetection';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  requests_used: number;
  request_limit: number;
  isPaidUser: boolean;
  hasPremiumFeatures: boolean;
  payment_provider: string;
  platform: string;
  subscription_end_date?: string;
}

export const useMultiPlatformSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: 'free',
    requests_used: 0,
    request_limit: 15,
    isPaidUser: false,
    hasPremiumFeatures: false,
    payment_provider: 'stripe',
    platform: 'web'
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuthStore();
  const { toast } = useToast();
  const { getCachedSubscription, setCachedSubscription, clearCache } = useSubscriptionCache();
  const platform = detectPlatform();


  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedSubscription();
    if (cached) {
      setSubscriptionData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, get profile data for basic functionality
      const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_ai_requests, user_tier, use_own_api_key, openai_api_key, payment_provider, subscription_status, subscription_tier, is_paid_user')
        .eq('user_id', user.id)
        .single();

      // If we have profile data, set basic subscription data immediately
      if (profile) {
        const requestsUsed = profile?.monthly_ai_requests || 0;
        const userTier = profile?.user_tier || 'granted_user';
        const hasApiKey = profile?.use_own_api_key && profile?.openai_api_key;
        const isSubscribed = profile?.subscription_status === 'active' || profile?.is_paid_user || false;
        
        let requestLimit = 15; // Default for granted_user
        if (userTier === 'api_user') requestLimit = 1000;
        else if (userTier === 'paid_user') requestLimit = 1000;
        else if (userTier === 'free_user') requestLimit = 15;

        const isPaidUser = Boolean(isSubscribed || hasApiKey);
        const hasPremiumFeatures = Boolean(isPaidUser || (requestsUsed < requestLimit));

        // Set subscription data from profile - this is reliable
        const newData = {
          subscribed: isSubscribed,
          subscription_tier: profile?.subscription_tier || 'free',
          requests_used: requestsUsed,
          request_limit: requestLimit,
          isPaidUser,
          hasPremiumFeatures,
          payment_provider: profile?.payment_provider || 'stripe',
          platform,
          subscription_end_date: undefined
        };
        
        setSubscriptionData(newData);
        setCachedSubscription(newData);
        setLoading(false);
        return;
      }

      // Fallback only if no profile data exists
      const fallbackData = {
        subscribed: false,
        subscription_tier: 'free',
        requests_used: 0,
        request_limit: 15,
        isPaidUser: false,
        hasPremiumFeatures: true, // Allow basic functionality
        payment_provider: 'stripe',
        platform
      };
      
      setSubscriptionData(fallbackData);
      setCachedSubscription(fallbackData);

    } catch (error) {
      console.error('Error checking subscription:', error);
      // Always provide safe fallback data
      const fallbackData = {
        subscribed: false,
        subscription_tier: 'free',
        requests_used: 0,
        request_limit: 15,
        isPaidUser: false,
        hasPremiumFeatures: true, // Allow basic functionality when errors occur
        payment_provider: 'stripe',
        platform
      };
      
      setSubscriptionData(fallbackData);
      setCachedSubscription(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [user, platform, getCachedSubscription, setCachedSubscription]);

  const createSubscription = async () => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      
      const { data, error } = await supabase.functions.invoke('unified-subscription', {
        body: {
          action: 'create_subscription',
          platform: platform
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          origin: window.location.origin
        },
      });

      if (error) throw error;

      if (platform === 'web' && data?.url) {
        // For web (Stripe), open checkout in new tab
        window.open(data.url, '_blank');
      } else if (platform === 'android' || platform === 'ios') {
        // For native apps, return product info for native billing
        return data;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      
      const { data, error } = await supabase.functions.invoke('unified-subscription', {
        body: {
          action: 'cancel_subscription',
          platform: platform
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          origin: window.location.origin
        },
      });

      if (error) throw error;

      if (platform === 'web' && data?.url) {
        // For web (Stripe), open customer portal
        window.open(data.url, '_blank');
      } else if (data?.cancel_url) {
        // For native apps, open platform-specific cancellation URL
        window.open(data.cancel_url, '_blank');
      }

      return data;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  const validateNativeReceipt = async (receiptData: any) => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      let functionName = '';
      
      if (platform === 'android') {
        functionName = 'validate-google-play-receipt';
      } else if (platform === 'ios') {
        functionName = 'validate-apple-receipt';
      } else {
        throw new Error('Receipt validation only available on mobile platforms');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: receiptData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Refresh subscription status after validation
      await checkSubscription();
      
      return data;
    } catch (error) {
      console.error('Error validating receipt:', error);
      throw error;
    }
  };

  const trackUsageEvent = async (eventType: string) => {
    if (!user) return;

    try {
      await supabase.rpc('track_usage_event', {
        _user_id: user.id,
        _event_type: eventType,
        _requests_count: subscriptionData.requests_used,
        _subscription_status: subscriptionData.subscription_tier
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  const getUsageWarning = () => {
    const { requests_used, request_limit, hasPremiumFeatures } = subscriptionData;
    
    if (hasPremiumFeatures) return null;
    
    const percentage = (requests_used / request_limit) * 100;
    
    if (percentage >= 90) {
      return "You've used 90% of your free requests. Consider upgrading to premium.";
    } else if (percentage >= 75) {
      return "You've used 75% of your free requests.";
    }
    
    return null;
  };

  // Debounced subscription check to prevent spam
  const debouncedCheckSubscription = useCallback(
    debounce(checkSubscription, 1000), 
    [checkSubscription]
  );

  // Check subscription when user changes - but debounced
  useEffect(() => {
    if (user) {
      debouncedCheckSubscription();
    }
  }, [user?.id, debouncedCheckSubscription]);

  return {
    ...subscriptionData,
    loading,
    platform,
    checkSubscription,
    createSubscription,
    openCustomerPortal,
    validateNativeReceipt,
    trackUsageEvent,
    getUsageWarning,
    clearSubscriptionCache: clearCache
  };
};