-- Clean up legacy database objects that are no longer used

-- Drop the user_roles table (replaced by access_level in profiles)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop the app_role enum (no longer used)
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop conversation_summaries table (empty and unused)
DROP TABLE IF EXISTS public.conversation_summaries CASCADE;

-- Drop home_steps table (empty and unused) 
DROP TABLE IF EXISTS public.home_steps CASCADE;

-- Remove any orphaned triggers or functions related to user_roles
DROP TRIGGER IF EXISTS ensure_admin_subscription_status ON public.user_roles;
DROP FUNCTION IF EXISTS public.ensure_admin_subscription_status() CASCADE;