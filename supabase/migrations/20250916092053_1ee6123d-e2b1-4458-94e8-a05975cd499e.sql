-- Remove legacy subscription fields from profiles table
-- This completes the transition to the unified access system

-- Remove legacy subscription fields
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS is_paid_user;

-- Remove subscription_status from usage_analytics table 
ALTER TABLE public.usage_analytics
DROP COLUMN IF EXISTS subscription_status;

-- Update track_usage_event function to not use subscription_status
CREATE OR REPLACE FUNCTION public.track_usage_event(
  _user_id uuid, 
  _event_type text, 
  _requests_count integer DEFAULT NULL, 
  _subscription_status text DEFAULT NULL  -- Keep parameter for backwards compatibility but ignore it
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.usage_analytics (user_id, event_type, requests_count)
  VALUES (_user_id, _event_type, _requests_count);
END;
$$;