-- Fix the is_current_user_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Check if user has admin access level
  SELECT CASE 
    WHEN access_level = 'admin' THEN true
    ELSE false
  END INTO admin_status
  FROM public.profiles 
  WHERE user_id = user_id_val;
  
  -- Return the result (defaults to false if no record found)
  RETURN COALESCE(admin_status, false);
END;
$function$;

-- Create a more robust admin check function that works in edge functions
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_status boolean DEFAULT false;
BEGIN
  -- Check if user has admin access level
  SELECT CASE 
    WHEN access_level = 'admin' THEN true
    ELSE false
  END INTO admin_status
  FROM public.profiles 
  WHERE user_id = check_user_id;
  
  -- Return the result (defaults to false if no record found)
  RETURN COALESCE(admin_status, false);
END;
$function$;