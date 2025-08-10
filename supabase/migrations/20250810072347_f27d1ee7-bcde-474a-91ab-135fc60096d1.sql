-- Upload favicon-512.png to website-images bucket and update settings
DO $$
DECLARE
    favicon_url text;
    apple_icon_url text;
    pwa_icon_url text;
BEGIN
    -- Since we need to upload files first, let's prepare the URLs
    -- These will be the public URLs after upload
    favicon_url := 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/favicon-512.png';
    apple_icon_url := 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/apple-touch-icon-512.png';
    pwa_icon_url := 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/pwa-icon-512x512.png';
    
    -- Update shared settings with public Supabase URLs
    INSERT INTO shared_settings (setting_key, setting_value) 
    VALUES 
      ('app_favicon', favicon_url),
      ('app_logo', apple_icon_url),
      ('app_icon_url', pwa_icon_url)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
      setting_value = EXCLUDED.setting_value,
      updated_at = now();
END $$;