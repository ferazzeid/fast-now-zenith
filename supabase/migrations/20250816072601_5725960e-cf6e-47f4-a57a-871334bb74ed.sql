-- Drop ALL existing motivator-images policies and recreate them properly
DROP POLICY IF EXISTS motivator_images_insert ON storage.objects;
DROP POLICY IF EXISTS motivator_images_select ON storage.objects;
DROP POLICY IF EXISTS motivator_images_update ON storage.objects;
DROP POLICY IF EXISTS motivator_images_delete ON storage.objects;

-- Create new unified policies that allow both premium users AND admins
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