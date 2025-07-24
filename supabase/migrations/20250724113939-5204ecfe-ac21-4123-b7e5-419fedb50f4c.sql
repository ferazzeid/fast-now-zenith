-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.track_usage_event(
  _user_id UUID,
  _event_type TEXT,
  _requests_count INTEGER DEFAULT NULL,
  _subscription_status TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.usage_analytics (user_id, event_type, requests_count, subscription_status)
  VALUES (_user_id, _event_type, _requests_count, _subscription_status);
END;
$$;