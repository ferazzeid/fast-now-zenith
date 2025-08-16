-- Add Google Analytics configuration to shared_settings
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('google_analytics_property_id', '') 
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('google_analytics_service_account', '{}') 
ON CONFLICT (setting_key) DO NOTHING;