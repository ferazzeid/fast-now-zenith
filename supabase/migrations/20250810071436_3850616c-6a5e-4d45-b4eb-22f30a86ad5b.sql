-- Update shared settings with new icon URLs
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES 
  ('app_favicon', '/src/assets/favicon-512.png'),
  ('app_logo', '/src/assets/apple-touch-icon-512.png'),
  ('app_icon_url', '/src/assets/pwa-icon-512x512.png')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();