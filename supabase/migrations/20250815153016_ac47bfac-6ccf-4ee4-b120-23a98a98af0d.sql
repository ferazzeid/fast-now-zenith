-- Fix security definer functions by adding search_path
CREATE OR REPLACE FUNCTION public.user_has_premium_access()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (user_tier = 'paid_user' OR subscription_tier = 'admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_tier = 'admin'
  );
END;
$$;