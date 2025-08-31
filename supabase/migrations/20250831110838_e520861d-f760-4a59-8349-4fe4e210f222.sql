-- Add toggle settings for timer quotes
INSERT INTO shared_settings (setting_key, setting_value)
VALUES 
  ('walking_timer_quotes_enabled', 'true'),
  ('fasting_timer_quotes_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;