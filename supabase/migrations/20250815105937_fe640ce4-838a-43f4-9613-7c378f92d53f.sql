-- Drop conflicting policies to avoid confusion
DROP POLICY IF EXISTS "Users can upload their own food images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload food images" ON storage.objects;

-- Create a single, clear policy for food image uploads
CREATE POLICY "Authenticated users can upload food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow if admin
    has_role(auth.uid(), 'admin'::app_role)
    OR 
    -- Allow if user is uploading to their own folder
    auth.uid()::text = (storage.foldername(name))[1]
  )
);