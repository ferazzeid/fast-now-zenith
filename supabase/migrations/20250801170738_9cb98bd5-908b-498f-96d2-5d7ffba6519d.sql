-- Create a dedicated storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);

-- Create policies for food images bucket  
CREATE POLICY "Anyone can view food images" ON storage.objects FOR SELECT USING (bucket_id = 'food-images');
CREATE POLICY "Authenticated users can upload food images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'food-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update food images" ON storage.objects FOR UPDATE USING (bucket_id = 'food-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete food images" ON storage.objects FOR DELETE USING (bucket_id = 'food-images' AND auth.role() = 'authenticated');