-- Remove subscription_status parameter from track_usage_event function
CREATE OR REPLACE FUNCTION public.track_usage_event(_user_id uuid, _event_type text, _requests_count integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.usage_analytics (user_id, event_type, requests_count)
  VALUES (_user_id, _event_type, _requests_count);
END;
$function$;