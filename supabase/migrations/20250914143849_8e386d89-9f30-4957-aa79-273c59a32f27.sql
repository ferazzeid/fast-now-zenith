-- Phase 2C: Complete cleanup without concurrent indexes
-- Update data and add regular indexes

-- Update 'free' access level to 'user' 
UPDATE public.profiles 
SET access_level = 'user'::access_level 
WHERE access_level::text = 'free';

-- Clean up any other non-standard access level values to 'user'
UPDATE public.profiles 
SET access_level = 'user'::access_level 
WHERE access_level::text NOT IN ('admin', 'user');

-- Ensure all users have proper default values
UPDATE public.profiles 
SET 
  access_level = COALESCE(access_level, 'user'::access_level),
  user_tier = COALESCE(user_tier, 'free_user'::user_tier),
  subscription_tier = COALESCE(subscription_tier, 'free'::text),
  trial_started_at = COALESCE(trial_started_at, now()),
  trial_ends_at = COALESCE(trial_ends_at, now() + interval '7 days'),
  updated_at = now()
WHERE access_level IS NULL 
   OR user_tier IS NULL 
   OR subscription_tier IS NULL 
   OR trial_started_at IS NULL 
   OR trial_ends_at IS NULL;

-- Add regular indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_profiles_access_level 
ON public.profiles(access_level);

CREATE INDEX IF NOT EXISTS idx_profiles_user_tier 
ON public.profiles(user_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at 
ON public.profiles(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;