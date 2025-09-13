-- Fix admin storage access issue
-- The problem: Premium policies explicitly exclude admins with NOT is_user_admin()
-- This conflicts with the admin_full_access policy
-- Solution: Remove the admin exclusion from premium policies

-- Drop the conflicting premium policies that exclude admins
DROP POLICY IF EXISTS "premium_motivator_select" ON storage.objects;
DROP POLICY IF EXISTS "premium_motivator_insert" ON storage.objects;
DROP POLICY IF EXISTS "premium_motivator_update" ON storage.objects;
DROP POLICY IF EXISTS "premium_motivator_delete" ON storage.objects;

-- Recreate premium policies WITHOUT excluding admins
-- Admins should be able to use these policies too (they have premium access anyway)

CREATE POLICY "premium_motivator_select" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND public.user_has_premium_access()
);

CREATE POLICY "premium_motivator_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
);

CREATE POLICY "premium_motivator_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
)
WITH CHECK (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
);

CREATE POLICY "premium_motivator_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
);

-- Ensure the admin function includes admin tier in premium access
-- (This should already be the case, but let's make sure)
CREATE OR REPLACE FUNCTION public.user_has_premium_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (user_tier = 'paid_user' OR subscription_tier = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verify admin function still works correctly
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$;
