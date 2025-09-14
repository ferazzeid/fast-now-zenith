-- Phase 2: Database Cleanup Migration (Final)
-- Clean up access system and add indexes

-- Add 'user' to existing access_level enum
DO $$
BEGIN
  -- Check if 'user' value already exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'user' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'access_level'
    )
  ) THEN
    -- Add 'user' to the enum
    EXECUTE 'ALTER TYPE access_level ADD VALUE ''user''';
  END IF;
END $$;

-- Update the data
DO $$
BEGIN
  -- Update 'free' access level to 'user' 
  UPDATE public.profiles 
  SET access_level = 'user' 
  WHERE access_level::text = 'free';

  -- Clean up any other non-standard access level values to 'user'
  UPDATE public.profiles 
  SET access_level = 'user' 
  WHERE access_level::text NOT IN ('admin', 'user');

  -- Ensure all users have proper default values
  UPDATE public.profiles 
  SET 
    access_level = COALESCE(access_level, 'user'),
    user_tier = COALESCE(user_tier, 'free_user'),
    subscription_tier = COALESCE(subscription_tier, 'free'),
    trial_started_at = COALESCE(trial_started_at, now()),
    trial_ends_at = COALESCE(trial_ends_at, now() + interval '7 days'),
    updated_at = now()
  WHERE access_level IS NULL 
     OR user_tier IS NULL 
     OR subscription_tier IS NULL 
     OR trial_started_at IS NULL 
     OR trial_ends_at IS NULL;
  
  RAISE NOTICE 'Database cleanup completed - access levels normalized to admin/user';
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
  
  -- Check if user has admin access_level
  SELECT (access_level::text = 'admin') INTO admin_status
  FROM public.profiles 
  WHERE user_id = user_id_val;
  
  -- Return the result (defaults to false if no record found)
  RETURN COALESCE(admin_status, false);
END;
$$;

-- Add indexes for better performance (without CONCURRENTLY since we're in a transaction)
CREATE INDEX IF NOT EXISTS idx_profiles_access_level 
ON public.profiles(access_level);

CREATE INDEX IF NOT EXISTS idx_profiles_user_tier 
ON public.profiles(user_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at 
ON public.profiles(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;