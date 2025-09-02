-- Add admin setting for enabling/disabling full AI functionality
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES ('ai_full_functionality_enabled', 'false')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'false';