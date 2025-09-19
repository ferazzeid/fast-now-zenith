-- Add progressive daily burn setting to shared_settings
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('progressive_daily_burn_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;