-- Create storage bucket for brand assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the website-images bucket
CREATE POLICY IF NOT EXISTS "Anyone can view website images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'website-images');

CREATE POLICY IF NOT EXISTS "Admins can upload website images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'website-images' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Admins can update website images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'website-images' AND auth.uid() IS NOT NULL);

-- Add PWA settings to shared_settings if they don't exist
INSERT INTO shared_settings (setting_key, setting_value, created_at, updated_at)
VALUES 
  ('pwa_app_name', 'FastNow - Mindful App', NOW(), NOW()),
  ('pwa_short_name', 'FastNow', NOW(), NOW()),
  ('pwa_description', 'Your mindful app with AI-powered motivation', NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;