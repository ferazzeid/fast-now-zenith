-- Fix shared_settings table issue that's causing 406 errors
-- Ensure the free_tier_request_limit setting exists
INSERT INTO public.shared_settings (setting_key, setting_value, updated_at) 
VALUES ('free_tier_request_limit', '5', now()) 
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();