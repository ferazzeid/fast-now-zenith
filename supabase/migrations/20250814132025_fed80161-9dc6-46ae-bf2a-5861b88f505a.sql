-- Fix potential RLS issue by updating the policies to be more explicit
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

-- Recreate the update policy with better error handling
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Also ensure the admin policy works correctly
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));