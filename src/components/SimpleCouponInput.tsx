import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CouponRedemption {
  id: string;
  redeemed_at: string;
  days_granted: number;
  coupon_code: {
    code: string;
    description?: string;
  }
}

export const SimpleCouponInput: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user's coupon redemption history
  React.useEffect(() => {
    const loadRedemptions = async () => {
      try {
        const { data, error } = await supabase
          .from('user_coupons')
          .select(`
            id,
            redeemed_at,
            days_granted,
            coupon_code:coupon_codes(code, description)
          `)
          .order('redeemed_at', { ascending: false });

        if (error) throw error;
        setRedemptions(data || []);
      } catch (error) {
        console.error('Error loading coupon history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRedemptions();
  }, []);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-coupon', {
        body: { couponCode: couponCode.trim() }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: `${data.message}. You've been granted ${data.daysGranted} days of premium access.`,
        });
        setCouponCode('');
        
        // Reload redemption history
        const { data: newRedemptions } = await supabase
          .from('user_coupons')
          .select(`
            id,
            redeemed_at,
            days_granted,
            coupon_code:coupon_codes(code, description)
          `)
          .order('redeemed_at', { ascending: false });
        
        setRedemptions(newRedemptions || []);
      } else {
        toast({
          title: "Redemption Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      toast({
        title: "Error",
        description: "Failed to redeem coupon code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Simple Coupon Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code..."
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={isRedeeming}
          className="flex-1 text-sm"
        />
        <Button 
          onClick={handleRedeemCoupon}
          disabled={!couponCode.trim() || isRedeeming}
          size="sm"
        >
          {isRedeeming ? "..." : "Redeem"}
        </Button>
      </div>

      {/* Simple Redemption History */}
      {!loading && redemptions.length > 0 && (
        <div className="space-y-2">
          {redemptions.map((redemption) => (
            <div
              key={redemption.id}
              className="flex items-center justify-between p-2 border rounded text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="font-medium">
                  {redemption.coupon_code?.code || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  +{redemption.days_granted}d
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(redemption.redeemed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && redemptions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No coupons redeemed yet
        </p>
      )}
    </div>
  );
};