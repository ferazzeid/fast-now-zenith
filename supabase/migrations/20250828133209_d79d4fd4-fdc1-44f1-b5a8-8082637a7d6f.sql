-- Create coupon management system for subscription management

-- Table for storing coupon codes that can extend premium access
CREATE TABLE public.coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table for tracking coupon redemptions by users
CREATE TABLE public.user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_code_id UUID NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  days_granted INTEGER NOT NULL,
  UNIQUE(user_id, coupon_code_id)
);

-- Enable RLS
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_codes
CREATE POLICY "Admins can manage coupon codes" ON public.coupon_codes
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Active coupons are viewable by authenticated users" ON public.coupon_codes
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Policies for user_coupons  
CREATE POLICY "Users can view their own coupon redemptions" ON public.user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem coupons" ON public.user_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon redemptions" ON public.user_coupons
  FOR ALL USING (is_current_user_admin());

-- Trigger to update updated_at column
CREATE TRIGGER update_coupon_codes_updated_at
  BEFORE UPDATE ON public.coupon_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to redeem a coupon code
CREATE OR REPLACE FUNCTION public.redeem_coupon_code(coupon_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, days_granted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record RECORD;
  user_id_val UUID;
  granted_days INTEGER;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN QUERY SELECT false, 'Authentication required'::TEXT, 0;
    RETURN;
  END IF;

  -- Find and validate coupon
  SELECT * INTO coupon_record
  FROM public.coupon_codes
  WHERE code = coupon_code 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR used_count < usage_limit);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or expired coupon code'::TEXT, 0;
    RETURN;
  END IF;

  -- Check if user already redeemed this coupon
  IF EXISTS (
    SELECT 1 FROM public.user_coupons 
    WHERE user_id = user_id_val AND coupon_code_id = coupon_record.id
  ) THEN
    RETURN QUERY SELECT false, 'Coupon already redeemed'::TEXT, 0;
    RETURN;
  END IF;

  granted_days := coupon_record.duration_days;

  -- Insert redemption record
  INSERT INTO public.user_coupons (user_id, coupon_code_id, days_granted)
  VALUES (user_id_val, coupon_record.id, granted_days);

  -- Update coupon usage count
  UPDATE public.coupon_codes 
  SET used_count = used_count + 1, updated_at = now()
  WHERE id = coupon_record.id;

  -- Extend user's premium access
  UPDATE public.profiles
  SET 
    trial_ends_at = CASE 
      WHEN trial_ends_at > now() THEN trial_ends_at + (granted_days || ' days')::INTERVAL
      ELSE now() + (granted_days || ' days')::INTERVAL
    END,
    updated_at = now()
  WHERE user_id = user_id_val;

  RETURN QUERY SELECT true, 'Coupon redeemed successfully'::TEXT, granted_days;
END;
$$;