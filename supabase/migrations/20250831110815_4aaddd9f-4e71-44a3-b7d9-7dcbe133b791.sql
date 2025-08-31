-- Add toggle settings for timer quotes
INSERT INTO shared_settings (setting_key, setting_value, description)
VALUES 
  ('walking_timer_quotes_enabled', 'true', 'Enable/disable system quotes in walking timer'),
  ('fasting_timer_quotes_enabled', 'true', 'Enable/disable system quotes in fasting timer')
ON CONFLICT (setting_key) DO NOTHING;