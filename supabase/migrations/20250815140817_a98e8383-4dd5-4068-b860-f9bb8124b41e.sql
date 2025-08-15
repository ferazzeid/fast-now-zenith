-- Create storage policies for food-images bucket

-- Allow users to upload their own food images
CREATE POLICY "Users can upload their own food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own food images
CREATE POLICY "Users can view their own food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own food images
CREATE POLICY "Users can update their own food images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own food images
CREATE POLICY "Users can delete their own food images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to food images (for sharing/viewing)
CREATE POLICY "Public can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');