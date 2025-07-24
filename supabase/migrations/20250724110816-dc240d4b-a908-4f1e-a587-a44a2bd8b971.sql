-- Add crisis intervention style setting to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES ('ai_crisis_style', 'psychological')
ON CONFLICT (setting_key) DO NOTHING;