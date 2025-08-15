-- Fix storage policies for food-images bucket to allow admins to upload and manage images

-- Add policy for admins to upload food images
CREATE POLICY "Admins can upload food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND has_role(auth.uid(), 'admin'));

-- Add policy for admins to update food images  
CREATE POLICY "Admins can update food images"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'food-images' AND has_role(auth.uid(), 'admin'));

-- Add policy for admins to delete food images
CREATE POLICY "Admins can delete food images"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'food-images' AND has_role(auth.uid(), 'admin'));