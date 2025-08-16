-- Fix the storage policies that are blocking function cleanup
-- First, update all storage.objects policies to use the unified function

-- Drop existing storage policies that depend on old functions
DROP POLICY IF EXISTS "admin_full_access" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_select" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_update" ON storage.objects;
DROP POLICY IF EXISTS "motivator_images_delete" ON storage.objects;

-- Create new unified storage policies using is_current_user_admin()
CREATE POLICY "Admins can manage all storage objects" 
ON storage.objects 
FOR ALL 
USING (is_current_user_admin());

-- Allow users to upload to motivator-images bucket
CREATE POLICY "Users can upload motivator images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view motivator images
CREATE POLICY "Anyone can view motivator images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motivator-images');

-- Allow users to update their own motivator images
CREATE POLICY "Users can update their own motivator images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own motivator images
CREATE POLICY "Users can delete their own motivator images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'motivator-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to upload to food-images bucket
CREATE POLICY "Users can upload food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view food images
CREATE POLICY "Anyone can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

-- Allow users to update/delete their own food images
CREATE POLICY "Users can manage their own food images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own food images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Website images, background images, blog images - admin only
CREATE POLICY "Admins can manage website images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id IN ('website-images', 'background-images', 'blog-images')
  AND is_current_user_admin()
);

-- Allow public viewing of website assets
CREATE POLICY "Anyone can view website assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('website-images', 'background-images', 'blog-images'));