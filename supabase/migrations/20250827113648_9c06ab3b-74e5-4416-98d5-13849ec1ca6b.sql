-- Fix security issue: Set search_path for the function
DROP FUNCTION IF EXISTS public.update_context_timestamp();

CREATE OR REPLACE FUNCTION public.update_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';