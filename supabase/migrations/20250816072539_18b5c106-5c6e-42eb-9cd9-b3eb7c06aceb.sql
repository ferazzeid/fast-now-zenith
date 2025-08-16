-- Fix storage RLS policies for motivator-images bucket
-- The issue is that premium_motivator_* policies explicitly exclude admins with (NOT is_user_admin())
-- But admins need access too. We'll update these policies to allow both premium users AND admins.

-- Drop existing premium motivator policies that exclude admins
DROP POLICY IF EXISTS premium_motivator_insert ON storage.objects;
DROP POLICY IF EXISTS premium_motivator_select ON storage.objects;
DROP POLICY IF EXISTS premium_motivator_update ON storage.objects;
DROP POLICY IF EXISTS premium_motivator_delete ON storage.objects;

-- Create new policies that allow both premium users AND admins
CREATE POLICY "motivator_images_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
  AND (user_has_premium_access() OR is_user_admin())
);

CREATE POLICY "motivator_images_select" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND (user_has_premium_access() OR is_user_admin())
);

CREATE POLICY "motivator_images_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
  AND (user_has_premium_access() OR is_user_admin())
)
WITH CHECK (
  bucket_id = 'motivator-images' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
  AND (user_has_premium_access() OR is_user_admin())
);

CREATE POLICY "motivator_images_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'motivator-images' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
  AND (user_has_premium_access() OR is_user_admin())
);