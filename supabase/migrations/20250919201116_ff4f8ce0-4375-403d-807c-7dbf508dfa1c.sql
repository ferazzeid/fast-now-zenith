-- Fix handle_new_user function to work with current schema
-- Remove the obsolete user_roles insertion that was causing failures

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trial_days INTEGER;
BEGIN
  -- Get trial length from settings (default to 7 if not found)
  SELECT COALESCE(
    (SELECT setting_value::INTEGER 
     FROM public.shared_settings 
     WHERE setting_key = 'trial_length_days'), 7
  ) INTO trial_days;
  
  -- Insert profile with trial access
  INSERT INTO public.profiles (
    user_id, 
    display_name,
    access_level,
    premium_expires_at,
    ai_requests_reset_date
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'trial',
    now() + (trial_days || ' days')::INTERVAL,
    now() + (trial_days || ' days')::INTERVAL
  );
  
  -- Note: user_roles table was consolidated into profiles.access_level
  -- No need for separate role insertion anymore
  
  RETURN NEW;
END;
$function$;