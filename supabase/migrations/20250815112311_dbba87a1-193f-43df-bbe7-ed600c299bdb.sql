-- Phase 1: Clean up duplicate storage policies and fix admin upload issues
-- Remove duplicate policies that might be conflicting
DROP POLICY IF EXISTS "Admins can upload food images" ON storage.objects;

-- Keep the comprehensive policy but fix the path issue
DROP POLICY IF EXISTS "Admins can upload food images anywhere" ON storage.objects;

-- Create a single, comprehensive admin upload policy with better debugging
CREATE POLICY "Admin upload access for food images"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' AND 
  (
    -- Allow admins to upload anywhere in food-images bucket
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow users to upload to their own folder
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Also allow admin SELECT access
CREATE POLICY "Admin select access for food images"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'food-images' AND 
  (
    -- Allow admins to view all food images
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow users to view their own images
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Create admin UPDATE policy
CREATE POLICY "Admin update access for food images"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'food-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create admin DELETE policy  
CREATE POLICY "Admin delete access for food images"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'food-images' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);