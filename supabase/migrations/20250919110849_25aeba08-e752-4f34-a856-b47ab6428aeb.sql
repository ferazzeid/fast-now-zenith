-- Add toast duration setting to shared_settings
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('toast_duration_seconds', '5')
ON CONFLICT (setting_key) DO NOTHING;