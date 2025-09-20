-- Enable multi-image capture functionality
INSERT INTO shared_settings (setting_key, setting_value)
VALUES ('enable_multi_image_capture', 'true')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = 'true';