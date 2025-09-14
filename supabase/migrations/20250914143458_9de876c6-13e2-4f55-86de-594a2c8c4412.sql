-- Phase 2: Database Cleanup Migration (Fixed)
-- Remove legacy columns and simplify access system

-- First, add 'user' to existing access_level enum
ALTER TYPE access_level ADD VALUE IF NOT EXISTS 'user';

-- Update 'free' access level to 'user' 
UPDATE public.profiles 
SET access_level = 'user'::access_level 
WHERE access_level = 'free'::access_level;

-- Clean up any other non-standard access level values to 'user'
UPDATE public.profiles 
SET access_level = 'user'::access_level 
WHERE access_level NOT IN ('admin', 'user');

-- Now create the simplified enum with just admin/user
CREATE TYPE access_level_simplified AS ENUM ('admin', 'user');

-- Update the column to use the new enum
ALTER TABLE public.profiles 
ALTER COLUMN access_level TYPE access_level_simplified 
USING access_level::text::access_level_simplified;

-- Drop the old enum and rename the new one
DROP TYPE access_level;
ALTER TYPE access_level_simplified RENAME TO access_level;

-- Update the is_current_user_admin function to be more efficient
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_id_val uuid;
  admin_status boolean DEFAULT false;
BEGIN
  -- Get the current user ID
  user_id_val := auth.uid();
  
  -- If no user ID, return false
  IF user_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin access_level (simplified)
  SELECT (access_level = 'admin') INTO admin_status
  FROM public.profiles 
  WHERE user_id = user_id_val;
  
  -- Return the result (defaults to false if no record found)
  RETURN COALESCE(admin_status, false);
END;
$$;

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

-- Add indexes for better performance on common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_access_level 
ON public.profiles(access_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_tier 
ON public.profiles(user_tier);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_trial_ends_at 
ON public.profiles(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;