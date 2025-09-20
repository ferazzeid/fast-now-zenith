-- Enable multi-image capture functionality
INSERT INTO shared_settings (setting_key, setting_value, description)
VALUES ('enable_multi_image_capture', 'true', 'Enable capturing multiple images for food analysis')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = 'true';