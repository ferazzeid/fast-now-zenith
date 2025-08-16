-- Update the shared_settings table with better default AI prompt
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('ai_image_motivator_prompt', 'Create a simple, clean illustration that represents: {title}. {content}. Style: minimalist, modern, inspiring. Colors: {primary_color} and {accent_color}')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();