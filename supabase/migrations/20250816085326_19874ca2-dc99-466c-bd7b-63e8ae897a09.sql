-- Create a simple test function to check auth.uid()
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN auth.uid();
END;
$function$;