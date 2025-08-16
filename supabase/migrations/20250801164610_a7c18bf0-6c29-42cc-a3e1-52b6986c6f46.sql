-- Add SEO indexing settings to shared_settings table
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES 
  ('seo_index_homepage', 'false'),
  ('seo_index_other_pages', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- Update GA tracking ID if not set (example)
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES ('ga_tracking_id', 'G-CKEH0JPWHR')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;