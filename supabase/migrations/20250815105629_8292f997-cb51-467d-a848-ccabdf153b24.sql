-- Create storage policies for food-images bucket uploads
CREATE POLICY "Users can upload their own food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

CREATE POLICY "Users can update their own food images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own food images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'food-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);