-- Clean up legacy database objects - step by step approach

-- First, check and drop any triggers on user_roles
DROP TRIGGER IF EXISTS ensure_admin_subscription_status ON public.user_roles;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS public.ensure_admin_subscription_status() CASCADE;

-- Now drop the legacy tables
DROP TABLE IF EXISTS public.conversation_summaries CASCADE;
DROP TABLE IF EXISTS public.home_steps CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Finally drop the app_role enum
DROP TYPE IF EXISTS public.app_role CASCADE;