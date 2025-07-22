-- Create storage bucket for motivator images
INSERT INTO storage.buckets (id, name, public) VALUES ('motivator-images', 'motivator-images', true);

-- Create policies for motivator images storage
CREATE POLICY "Anyone can view motivator images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motivator-images');

CREATE POLICY "Users can upload their own motivator images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'motivator-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own motivator images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'motivator-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own motivator images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'motivator-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add PWA settings to shared_settings table
INSERT INTO shared_settings (setting_key, setting_value) VALUES 
('pwa_app_name', 'Fast Now - Mindful Fasting'),
('pwa_short_name', 'Fast Now'),
('pwa_description', 'Your mindful fasting companion with AI-powered motivation'),
('pwa_theme_color', '#8B7355'),
('pwa_background_color', '#F5F2EA');