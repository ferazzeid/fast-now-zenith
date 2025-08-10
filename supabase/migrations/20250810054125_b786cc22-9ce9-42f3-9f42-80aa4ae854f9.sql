-- Update PWA app names to use lowercase "fast now"
UPDATE shared_settings 
SET setting_value = 'fast now - The No-BS Fat Loss Protocol', updated_at = now()
WHERE setting_key = 'pwa_app_name';

UPDATE shared_settings 
SET setting_value = 'fast now', updated_at = now()
WHERE setting_key = 'pwa_short_name';

-- Ensure the records exist if they don't
INSERT INTO shared_settings (setting_key, setting_value)
VALUES ('pwa_app_name', 'fast now - The No-BS Fat Loss Protocol')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

INSERT INTO shared_settings (setting_key, setting_value)
VALUES ('pwa_short_name', 'fast now')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();