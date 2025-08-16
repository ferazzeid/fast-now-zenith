-- Fix security warnings by setting proper search_path for functions
DROP FUNCTION IF EXISTS public.ensure_admin_subscription_status();

CREATE OR REPLACE FUNCTION public.ensure_admin_subscription_status()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When a user gets admin role, clean up their subscription status
  IF NEW.role = 'admin'::app_role THEN
    UPDATE public.profiles 
    SET 
      trial_ends_at = null,
      trial_started_at = null,
      subscription_status = 'admin',
      subscription_tier = 'admin',
      user_tier = 'paid_user',
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;