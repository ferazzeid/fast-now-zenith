-- Fix security warning: Set search_path for functions
ALTER FUNCTION public.set_profile_defaults() SET search_path = 'public';
ALTER FUNCTION public.update_shared_settings_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_feature_screenshots_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';