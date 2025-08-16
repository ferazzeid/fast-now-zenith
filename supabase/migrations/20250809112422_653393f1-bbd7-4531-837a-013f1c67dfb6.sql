-- Fix RLS policies to allow admins to INSERT/UPDATE/DELETE with proper WITH CHECK
DROP POLICY IF EXISTS "Allow admin users to manage shared settings" ON public.shared_settings;

-- Ensure separate policies per operation with proper checks
DROP POLICY IF EXISTS "Admins can insert shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can update shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can delete shared settings" ON public.shared_settings;

CREATE POLICY "Admins can insert shared settings"
ON public.shared_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update shared settings"
ON public.shared_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete shared settings"
ON public.shared_settings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);