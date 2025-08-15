-- Phase 1 (fixed): Create admin-specific storage policy for default food images
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Authenticated users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view food images" ON storage.objects;

-- Create separate policies for different use cases
CREATE POLICY "Admins can upload food images anywhere" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can upload to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow viewing food images
CREATE POLICY "Public can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');