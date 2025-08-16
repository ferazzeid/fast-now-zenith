-- Clean up all conflicting storage policies and create a simple, clear structure

-- Drop ALL existing storage policies to start fresh
DROP POLICY IF EXISTS "Admins manage blog images" ON storage.objects;
DROP POLICY IF EXISTS "non_admin_users_view_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "non_admin_users_update_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "non_admin_users_delete_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "non_admin_users_upload_motivator_images" ON storage.objects;
DROP POLICY IF EXISTS "public_view_website_images" ON storage.objects;
DROP POLICY IF EXISTS "public_view_background_images" ON storage.objects;
DROP POLICY IF EXISTS "public_view_food_images" ON storage.objects;
DROP POLICY IF EXISTS "public_view_blog_images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can view motivator images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can upload motivator images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can update their motivator images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can delete their motivator images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can view food images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can update their food images" ON storage.objects;
DROP POLICY IF EXISTS "Premium users can delete their food images" ON storage.objects;
DROP POLICY IF EXISTS "Public view website images" ON storage.objects;
DROP POLICY IF EXISTS "Public view background images" ON storage.objects;
DROP POLICY IF EXISTS "Public view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage website images" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage background images" ON storage.objects;
DROP POLICY IF EXISTS "admin_full_storage_access" ON storage.objects;

-- Create simple, clear policies without conflicts

-- 1. Admin policy with highest priority (ALL operations)
CREATE POLICY "admin_full_access" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- 2. Premium users can manage motivator images (excluding admins to avoid conflicts)
CREATE POLICY "premium_motivator_select" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND public.user_has_premium_access()
  AND NOT public.is_user_admin()
);

CREATE POLICY "premium_motivator_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
  AND NOT public.is_user_admin()
);

CREATE POLICY "premium_motivator_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
  AND NOT public.is_user_admin()
)
WITH CHECK (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
  AND NOT public.is_user_admin()
);

CREATE POLICY "premium_motivator_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'motivator-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.user_has_premium_access()
  AND NOT public.is_user_admin()
);

-- 3. Public access for viewing image buckets
CREATE POLICY "public_view_website" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'website-images');

CREATE POLICY "public_view_background" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'background-images');

CREATE POLICY "public_view_food" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

CREATE POLICY "public_view_blog" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "public_view_motivator" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motivator-images');