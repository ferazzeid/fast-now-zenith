
import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { detectPlatform } from '@/utils/platformDetection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useMultiPlatformSubscription = () => {
  const baseSubscription = useSubscription();
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web');
  const { user, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
  }, []);

  // Create subscription based on platform
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
        // Use Stripe for web
        return await baseSubscription.createSubscription();
      } else {
        // For mobile platforms, show instructions
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
    }
  }, [platform, user, session, baseSubscription, toast]);

  // Submit receipt for mobile platforms
  const submitReceipt = useCallback(async (receiptData: any, productId: string, transactionId?: string, purchaseToken?: string) => {
    if (!user || !session) return;

    try {
      const functionName = platform === 'ios' ? 'validate-apple-receipt' : 'validate-google-play-receipt';
      const payload = platform === 'ios' 
        ? { receipt_data: receiptData, product_id: productId, transaction_id: transactionId }
        : { receipt_data: receiptData, product_id: productId, purchase_token: purchaseToken };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Purchase Verified",
          description: "Your premium subscription has been activated!",
        });
        // Refresh subscription data
        await baseSubscription.checkSubscription();
        return { success: true };
      } else {
        throw new Error(data?.error || 'Receipt validation failed');
      }
    } catch (error) {
      console.error('Receipt validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Could not verify your purchase. Please try again.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [platform, user, session, baseSubscription, toast]);

  return {
    ...baseSubscription,
    platform,
    createSubscription,
    submitReceipt,
  };
};
