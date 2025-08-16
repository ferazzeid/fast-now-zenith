-- Add unified access level system to profiles table
DO $$ 
BEGIN
  -- Create access_level enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level') THEN
    CREATE TYPE access_level AS ENUM ('free', 'trial', 'premium', 'admin');
  END IF;
END $$;

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS access_level access_level DEFAULT 'free',
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing data to new unified system
UPDATE public.profiles 
SET 
  access_level = CASE 
    -- Admins first (highest priority)
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = profiles.user_id AND role = 'admin') THEN 'admin'::access_level
    -- Active subscriptions
    WHEN subscription_status = 'active' THEN 'premium'::access_level
    -- Trials (check if trial is still active)
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN 'trial'::access_level
    -- Default to free
    ELSE 'free'::access_level
  END,
  premium_expires_at = CASE
    -- For active subscriptions, use subscription end date
    WHEN subscription_status = 'active' AND subscription_end_date IS NOT NULL THEN subscription_end_date
    -- For trials, use trial end date
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN trial_ends_at
    -- No expiration for admin/free
    ELSE NULL
  END;

-- Create index for efficient access_level queries
CREATE INDEX IF NOT EXISTS idx_profiles_access_level ON public.profiles(access_level);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires ON public.profiles(premium_expires_at) WHERE premium_expires_at IS NOT NULL;