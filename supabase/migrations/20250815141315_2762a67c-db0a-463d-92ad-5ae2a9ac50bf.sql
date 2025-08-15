-- Clean up and ensure proper INSERT policy for food images
DROP POLICY IF EXISTS "Users can upload their own food images" ON storage.objects;

-- Create the INSERT policy for food uploads  
CREATE POLICY "Users can upload their own food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);