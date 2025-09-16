-- Complete removal of old user_tier system

-- Remove the user_tier column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_tier;

-- Drop the update_user_tier function
DROP FUNCTION IF EXISTS public.update_user_tier(uuid);

-- Drop the user_tier enum type
DROP TYPE IF EXISTS public.user_tier;