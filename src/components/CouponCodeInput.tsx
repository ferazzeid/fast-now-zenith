import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
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

export const CouponCodeInput: React.FC = () => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Coupon Codes
        </CardTitle>
        <CardDescription>
          Redeem coupon codes to extend your premium access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coupon Code Input */}
        <div className="space-y-3">
          <Label htmlFor="couponCode">Enter Coupon Code</Label>
          <div className="flex gap-2">
            <Input
              id="couponCode"
              placeholder="Enter your coupon code..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={isRedeeming}
              className="flex-1"
            />
            <Button 
              onClick={handleRedeemCoupon}
              disabled={!couponCode.trim() || isRedeeming}
              className="shrink-0"
            >
              {isRedeeming ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
        </div>

        {/* Redemption History */}
        {!loading && redemptions.length > 0 && (
          <div className="space-y-3">
            <Label>Your Redeemed Coupons</Label>
            <div className="space-y-2">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {redemption.coupon_code?.code || 'Unknown Code'}
                      </p>
                      {redemption.coupon_code?.description && (
                        <p className="text-xs text-muted-foreground">
                          {redemption.coupon_code.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      +{redemption.days_granted} days
                    </Badge>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(redemption.redeemed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && redemptions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No coupon codes redeemed yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};