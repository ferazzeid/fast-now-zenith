-- Fix the search path for the new trigger function
CREATE OR REPLACE FUNCTION public.set_profile_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set default calorie goal to 1500 if not provided
  IF NEW.daily_calorie_goal IS NULL THEN
    NEW.daily_calorie_goal := 1500;
  END IF;
  
  -- Set default carb goal to 30 if not provided
  IF NEW.daily_carb_goal IS NULL THEN
    NEW.daily_carb_goal := 30;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search path for the update_shared_settings_updated_at function
CREATE OR REPLACE FUNCTION public.update_shared_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;