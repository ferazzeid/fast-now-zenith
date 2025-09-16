-- Add Google login toggle setting to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value)
VALUES ('google_login_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;