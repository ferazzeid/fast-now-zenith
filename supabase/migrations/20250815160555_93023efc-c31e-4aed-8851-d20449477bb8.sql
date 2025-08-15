-- Drop all existing storage policies completely
DROP POLICY IF EXISTS "admin_bypass_all_storage" ON storage.objects;
DROP POLICY IF EXISTS "admin_storage_full_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_storage_select_access" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "food_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "website_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "background_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "users_can_upload_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "users_can_view_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "users_can_update_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_website_images" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_background_images" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_food_images" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_blog_images" ON storage.objects;

-- Create security definer function for admin check to avoid RLS recursion
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

-- Create comprehensive admin policy that takes absolute precedence
CREATE POLICY "admin_full_storage_access" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Create non-conflicting user policies that explicitly exclude admins
-- Allow non-admin users to upload their own motivator images
CREATE POLICY "non_admin_users_upload_motivator_images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT public.is_user_admin()
);

-- Allow non-admin users to view motivator images
CREATE POLICY "non_admin_users_view_motivator_images" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'motivator-images'
  AND NOT public.is_user_admin()
);

-- Allow non-admin users to update their own motivator images
CREATE POLICY "non_admin_users_update_motivator_images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT public.is_user_admin()
)
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT public.is_user_admin()
);

-- Allow non-admin users to delete their own motivator images
CREATE POLICY "non_admin_users_delete_motivator_images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT public.is_user_admin()
);

-- Public access to other image buckets for viewing (unaffected by admin status)
CREATE POLICY "public_view_website_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'website-images');

CREATE POLICY "public_view_background_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'background-images');

CREATE POLICY "public_view_food_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

CREATE POLICY "public_view_blog_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

-- Ensure proper access to user_roles table
GRANT SELECT ON public.user_roles TO authenticated;