-- Fix RLS policies to use the new unified access_level system
-- The issue: RLS policies still check user_roles table, but the new system uses access_level in profiles

-- 1. First, ensure your user has admin access in the new system
-- Update your profile to have admin access_level
UPDATE public.profiles 
SET access_level = 'admin'::access_level 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'sociallyfamous@gmail.com'
  UNION
  SELECT '84f952e6-690b-473f-b0cc-c579ac077b45'::uuid
);

-- 2. Create/update function to check admin status using new system
CREATE OR REPLACE FUNCTION public.is_admin_new_system()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'::access_level
  );
$$;

-- 3. Update shared_settings RLS policies to use new system
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can update shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can delete shared settings" ON public.shared_settings;

-- Create new policies using the new access_level system
CREATE POLICY "Admins can insert shared settings"
ON public.shared_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_new_system());

CREATE POLICY "Admins can update shared settings"
ON public.shared_settings FOR UPDATE
TO authenticated
USING (public.is_admin_new_system())
WITH CHECK (public.is_admin_new_system());

CREATE POLICY "Admins can delete shared settings"
ON public.shared_settings FOR DELETE
TO authenticated
USING (public.is_admin_new_system());

-- 4. Also update any storage policies that might be affected
-- Update the user_has_premium_access function to include admin access_level
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
    AND access_level IN ('premium', 'trial', 'admin')
  );
END;
$$;

-- 5. Create a unified admin check function that works with both systems (for transition period)
CREATE OR REPLACE FUNCTION public.is_user_admin_unified()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check new system first
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'::access_level
  ) THEN
    RETURN true;
  END IF;
  
  -- Fallback to old system for backward compatibility
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
END;
$$;

-- 6. Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_new_system() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin_unified() TO authenticated;

-- 7. Ensure your user is properly set up in both systems for now
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'sociallyfamous@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) 
VALUES ('84f952e6-690b-473f-b0cc-c579ac077b45'::uuid, 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Verify the setup with a test query
-- This should return your admin status in both systems
DO $$
DECLARE
  user_email text := 'sociallyfamous@gmail.com';
  user_uuid uuid;
  old_system_admin boolean;
  new_system_admin boolean;
BEGIN
  -- Get user ID
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found with email: %', user_email;
    RETURN;
  END IF;
  
  -- Check old system
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'::app_role
  ) INTO old_system_admin;
  
  -- Check new system
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND access_level = 'admin'::access_level
  ) INTO new_system_admin;
  
  RAISE NOTICE 'Admin status for %: Old system = %, New system = %', 
    user_email, old_system_admin, new_system_admin;
END $$;

