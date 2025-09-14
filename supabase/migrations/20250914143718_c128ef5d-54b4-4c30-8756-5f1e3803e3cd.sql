-- Fix security warnings for functions by setting explicit search_path

-- Update is_current_user_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  user_id_val uuid;
  admin_status boolean DEFAULT false;
BEGIN
  -- Get the current user ID
  user_id_val := auth.uid();
  
  -- If no user ID, return false
  IF user_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin access_level
  SELECT (access_level::text = 'admin') INTO admin_status
  FROM public.profiles 
  WHERE user_id = user_id_val;
  
  -- Return the result (defaults to false if no record found)
  RETURN COALESCE(admin_status, false);
END;
$$;

-- Update update_user_tier function with proper search_path
CREATE OR REPLACE FUNCTION public.update_user_tier(_user_id uuid)
RETURNS user_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  new_tier public.user_tier;
  in_trial boolean;
BEGIN
  -- Load profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    -- No profile yet; default to free_user
    RETURN 'free_user';
  END IF;

  -- Ensure trial dates exist (safety for older rows)
  IF profile_record.trial_started_at IS NULL THEN
    UPDATE public.profiles
    SET trial_started_at = now()
    WHERE user_id = _user_id;
    profile_record.trial_started_at := now();
  END IF;

  IF profile_record.trial_ends_at IS NULL THEN
    UPDATE public.profiles
    SET trial_ends_at = now() + interval '7 days'
    WHERE user_id = _user_id;
    profile_record.trial_ends_at := now() + interval '7 days';
  END IF;

  -- In-trial if current time is before or at trial end
  in_trial := now() <= profile_record.trial_ends_at;

  -- Paid if in trial OR subscription status is active/trialing
  IF (profile_record.subscription_status IN ('active','trialing')) OR in_trial THEN
    new_tier := 'paid_user';
  ELSE
    new_tier := 'free_user';
  END IF;

  -- Update profile tier + payment method (provider if paid, else null)
  UPDATE public.profiles 
  SET 
    user_tier = new_tier,
    payment_method = CASE 
      WHEN new_tier = 'paid_user' THEN COALESCE(
        profile_record.payment_provider,
        CASE WHEN profile_record.stripe_customer_id IS NOT NULL THEN 'stripe' ELSE NULL END
      )
      ELSE NULL
    END,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN new_tier;
END;
$$;

-- Update user_has_premium_access function with proper search_path  
CREATE OR REPLACE FUNCTION public.user_has_premium_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (user_tier = 'paid_user' OR subscription_tier = 'admin')
  );
END;
$$;