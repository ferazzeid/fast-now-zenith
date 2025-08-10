-- Insert or update the app_icon_url setting to use the same logo
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('app_icon_url', 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1754550280169.png')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();