-- Add Google login toggle setting to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value, description)
VALUES ('google_login_enabled', 'true', 'Controls whether Google login is available on the authentication page')
ON CONFLICT (setting_key) DO NOTHING;