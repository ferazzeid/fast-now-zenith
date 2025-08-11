-- Add offline mode setting for the admin toggle
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('offline_mode_enabled', 'false')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value;