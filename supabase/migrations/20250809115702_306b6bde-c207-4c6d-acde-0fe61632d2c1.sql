
-- 1) Add trial fields to profiles (7-day default trial for new signups)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at   timestamptz DEFAULT (now() + interval '7 days');

-- 2) Simplify tier logic: only free_user and paid_user
-- Treat users as paid_user if they are in trial OR have an active subscription (any provider).
-- Note: We keep the user_tier enum as-is to avoid unsafe enum removals, but we stop assigning
--       'api_user' and 'granted_user'.
CREATE OR REPLACE FUNCTION public.update_user_tier(_user_id uuid)
RETURNS user_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;
