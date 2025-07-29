import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  className?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ children, feature, className = "", showUpgrade = true }: PremiumGateProps) => {
  const { toast } = useToast();
  
  // AI-centric state management
  const [subscriptionData, setSubscriptionData] = useState({
    subscribed: false,
    can_use_own_api_key: true,
    requests_used: 0,
    request_limit: 15,
    loading: true
  });

  // AI-powered subscription check
  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscriptionData(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Check my subscription status for premium features",
          action: "check_premium_access"
        }
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData(prev => ({ ...prev, loading: false }));
        return;
      }

      setSubscriptionData({
        subscribed: data.subscribed || false,
        can_use_own_api_key: data.can_use_own_api_key || false,
        requests_used: data.requests_used || 0,
        request_limit: data.request_limit || 15,
        loading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // AI-powered subscription creation
  const createSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Create a premium subscription for me",
          action: "create_subscription"
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Check if user has access to the feature
  const hasAccess = subscriptionData.subscribed || 
                   subscriptionData.can_use_own_api_key || 
                   (subscriptionData.requests_used < subscriptionData.request_limit);

  const handleUpgrade = async () => {
    try {
      await createSubscription();
      toast({
        title: "Redirecting to checkout",
        description: "Opening payment page..."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show loading state while checking subscription
  if (subscriptionData.loading) {
    return <div className="animate-pulse opacity-50">{children}</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Grayed out content */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4 max-w-xs">
          <div className="flex justify-center mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Premium Feature</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {feature} requires a premium subscription or your own API key.
          </p>
          {showUpgrade && (
            <div className="space-y-2">
              <Button 
                size="sm" 
                onClick={handleUpgrade}
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade to Premium
              </Button>
              <div className="text-xs text-muted-foreground">
                Or add your OpenAI API key in Settings
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};