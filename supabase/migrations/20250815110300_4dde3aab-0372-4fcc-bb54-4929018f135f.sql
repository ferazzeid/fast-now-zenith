-- Phase 1: Create admin-specific storage policy for default food images
-- This allows admins to upload default food images to any path in the bucket

-- Drop the current policy first
DROP POLICY IF EXISTS "Authenticated users can upload food images" ON storage.objects;

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

-- Also need SELECT policies for viewing images
CREATE POLICY "Anyone can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');