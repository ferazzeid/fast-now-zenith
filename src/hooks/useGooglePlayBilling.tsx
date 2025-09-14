import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { detectPlatform, getPaymentProviderForPlatform } from '@/utils/platformDetection';
import { isCapacitorApp, shouldUseNativeFeatures } from '@/utils/capacitorUtils';

export interface GooglePlayPurchase {
  productId: string;
  purchaseToken: string;
  orderId: string;
  purchaseTime: number;
  purchaseState: number;
  acknowledged: boolean;
}

export const useGooglePlayBilling = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const { toast } = useToast();

  const checkBillingAvailability = useCallback(async () => {
    try {
      const platform = detectPlatform();
      if (platform !== 'android') {
        setIsAvailable(false);
        return false;
      }

      // For Capacitor native Android, check for custom billing interface
      if (isCapacitorApp() && shouldUseNativeFeatures()) {
        // Check if custom Google Play Billing bridge is available
        if (typeof window !== 'undefined' && 'CapacitorGooglePlayBilling' in window) {
          const billing = (window as any).CapacitorGooglePlayBilling;
          try {
            const { isReady } = await billing.isReady();
            setIsAvailable(isReady);
            return isReady;
          } catch (error) {
            console.log('Custom billing bridge not ready, falling back to web billing');
          }
        }
      }

      // For TWA or web fallback
      const { data: { session } } = await supabase.auth.getSession();
      const available = !!session;
      setIsAvailable(available);
      return available;
    } catch (error) {
      console.error('Error checking Google Play Billing availability:', error);
      setIsAvailable(false);
      return false;
    }
  }, []);

  const purchaseSubscription = useCallback(async (productId: string = 'premium_subscription_monthly') => {
    if (!isAvailable) {
      toast({
        title: "Billing Not Available",
        description: "Google Play Billing is not available on this device.",
        variant: "destructive"
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const platform = detectPlatform();
      
      // For Capacitor native Android
      if (isCapacitorApp() && shouldUseNativeFeatures() && platform === 'android') {
        // Check for custom Google Play Billing bridge
        if (typeof window !== 'undefined' && 'CapacitorGooglePlayBilling' in window) {
          try {
            const billing = (window as any).CapacitorGooglePlayBilling;
            
            // Start purchase flow
            const { purchase } = await billing.purchaseSubscription({
              productId,
              offerToken: undefined // Use default offer
            });

            if (purchase) {
              // Validate purchase with our backend
              return await validatePurchase(purchase);
            }
          } catch (error) {
            console.log('Custom billing bridge failed, falling back to web billing:', error);
          }
        }
      }

      // Fallback to web/TWA billing
      const { data, error } = await supabase.functions.invoke('unified-subscription', {
        body: {
          action: 'create_subscription',
          platform: 'android',
          product_id: productId
        }
      });

      if (error) throw error;

      toast({
        title: "Install Android App",
        description: "To purchase subscriptions, please install our Android app from Google Play Store.",
      });
      
      return data;
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isAvailable, toast]);

  const validatePurchase = useCallback(async (purchase: GooglePlayPurchase) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-google-play-receipt', {
        body: {
          receipt_data: purchase,
          product_id: purchase.productId,
          purchase_token: purchase.purchaseToken
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Purchase Successful!",
          description: "Your premium subscription is now active.",
        });
      } else {
        throw new Error('Purchase validation failed');
      }

      return data;
    } catch (error: any) {
      console.error('Purchase validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Purchase completed but validation failed. Please contact support.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-subscription', {
        body: {
          action: 'check_subscription',
          platform: detectPlatform()
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return null;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!isAvailable) {
      toast({
        title: "Restore Not Available",
        description: "Purchase restoration is only available on Android devices.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // For Capacitor native Android
      if (isCapacitorApp() && shouldUseNativeFeatures()) {
        // Check for custom Google Play Billing bridge
        if (typeof window !== 'undefined' && 'CapacitorGooglePlayBilling' in window) {
          try {
            const billing = (window as any).CapacitorGooglePlayBilling;
            
            // Get purchase history
            const { purchases } = await billing.queryPurchases({
              type: 'subscription'
            });

            if (purchases && purchases.length > 0) {
              // Validate the most recent purchase
              const latestPurchase = purchases[0];
              await validatePurchase(latestPurchase);
            } else {
              toast({
                title: "No Purchases Found",
                description: "No previous purchases found to restore.",
              });
            }
            return;
          } catch (error) {
            console.log('Custom billing bridge restore failed:', error);
          }
        }
      }

      // No fallback for restore on web/TWA
      toast({
        title: "Restore Not Available",
        description: "Purchase restoration requires the native Android app.",
      });
    } catch (error: any) {
      console.error('Restore purchases error:', error);
      toast({
        title: "Restore Failed",
        description: error.message || "Unable to restore purchases. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isAvailable, validatePurchase, toast]);

  return {
    isProcessing,
    isAvailable,
    checkBillingAvailability,
    purchaseSubscription,
    checkSubscriptionStatus,
    restorePurchases
  };
};