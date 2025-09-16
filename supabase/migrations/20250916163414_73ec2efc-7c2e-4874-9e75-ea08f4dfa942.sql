-- Clean up unused access levels in profiles table
-- Convert any 'user' access levels to 'free'
UPDATE profiles 
SET access_level = 'free', updated_at = now()
WHERE access_level = 'user';

-- Update global access mode to remove unused modes
-- Keep only 'trial_premium' as the default
UPDATE app_mode_settings 
SET setting_value = 'trial_premium', updated_at = now()
WHERE setting_key = 'global_access_mode' 
AND setting_value IN ('free_full', 'free_food_only');