-- Fix security issue: Set search_path for coupon redemption function
CREATE OR REPLACE FUNCTION public.redeem_coupon_code(coupon_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, days_granted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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