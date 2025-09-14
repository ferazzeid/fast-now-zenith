-- Phase 2: Database Cleanup Migration
-- Remove legacy columns and simplify access system

-- First, let's check what we're working with
DO $$
BEGIN
  -- Check if legacy columns exist before dropping them
  -- This makes the migration safe to run multiple times
  
  -- Remove legacy subscription-related columns that are now handled by user_tier
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status_legacy') THEN
    ALTER TABLE public.profiles DROP COLUMN subscription_status_legacy;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_end_date_legacy') THEN
    ALTER TABLE public.profiles DROP COLUMN subscription_end_date_legacy;
  END IF;
  
  -- Remove any other legacy columns that might exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'legacy_tier') THEN
    ALTER TABLE public.profiles DROP COLUMN legacy_tier;
  END IF;
  
  -- Clean up any duplicate or unused access level values
  -- First update any problematic access_level values to 'user'
  UPDATE public.profiles 
  SET access_level = 'user' 
  WHERE access_level NOT IN ('admin', 'user');
  
  RAISE NOTICE 'Database cleanup migration completed successfully';
  
END $$;

-- Ensure access_level enum only has essential values
-- Drop and recreate the enum with just admin/user
DO $$
BEGIN
  -- Create new enum type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_clean') THEN
    CREATE TYPE access_level_clean AS ENUM ('admin', 'user');
  END IF;
  
  -- Update the column to use the new enum
  ALTER TABLE public.profiles 
  ALTER COLUMN access_level TYPE access_level_clean 
  USING access_level::text::access_level_clean;
  
  -- Drop the old enum and rename the new one
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level' AND typname != 'access_level_clean') THEN
    DROP TYPE IF EXISTS access_level CASCADE;
  END IF;
  
  ALTER TYPE access_level_clean RENAME TO access_level;
  
  RAISE NOTICE 'Access level enum simplified to admin/user only';
  
END $$;

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