-- Fix the AI access control system to use only trial and premium tiers
-- Remove the unnecessary free_user_request_limit setting

-- Delete the redundant free_user_request_limit setting
DELETE FROM public.shared_settings WHERE setting_key = 'free_user_request_limit';

-- Update trial_request_limit to be the main limit for trial users
INSERT INTO public.shared_settings (setting_key, setting_value)
VALUES ('trial_request_limit', '50')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Ensure monthly_request_limit exists for premium users  
INSERT INTO public.shared_settings (setting_key, setting_value)
VALUES ('monthly_request_limit', '1000')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();