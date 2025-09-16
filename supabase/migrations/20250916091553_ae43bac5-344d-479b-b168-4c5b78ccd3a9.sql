-- Update handle_new_user function to include ai_requests_reset_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
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
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;