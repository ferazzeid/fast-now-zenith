-- Drop all existing storage policies that might conflict with admin access
DROP POLICY IF EXISTS "admin_storage_full_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_storage_select_access" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "food_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "website_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "background_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_insert_policy" ON storage.objects;

-- Create comprehensive admin policy that bypasses all storage restrictions
CREATE POLICY "admin_bypass_all_storage" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Recreate necessary storage policies for regular users (non-admins)
-- Allow users to upload their own motivator images
CREATE POLICY "users_can_upload_motivator_images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view motivator images
CREATE POLICY "users_can_view_motivator_images" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'motivator-images');

-- Allow users to update their own motivator images
CREATE POLICY "users_can_update_motivator_images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own motivator images
CREATE POLICY "users_can_delete_motivator_images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public access to other image buckets for viewing
CREATE POLICY "public_can_view_website_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'website-images');

CREATE POLICY "public_can_view_background_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'background-images');

CREATE POLICY "public_can_view_food_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

CREATE POLICY "public_can_view_blog_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

-- Ensure the user_roles table is accessible to authenticated users
GRANT SELECT ON public.user_roles TO authenticated;