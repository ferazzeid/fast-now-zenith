-- Add PWA settings to shared_settings if they don't exist
INSERT INTO shared_settings (setting_key, setting_value, created_at, updated_at)
VALUES 
  ('pwa_app_name', 'FastNow - Mindful App', NOW(), NOW()),
  ('pwa_short_name', 'FastNow', NOW(), NOW()),
  ('pwa_description', 'Your mindful app with AI-powered motivation', NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;