-- Add policy to allow public read access for app_logo setting specifically
CREATE POLICY "Public can view app logo setting" 
ON public.shared_settings 
FOR SELECT 
USING (setting_key = 'app_logo');