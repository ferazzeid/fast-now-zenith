-- Fix security issue: Recreate function with proper search_path
DROP TRIGGER IF EXISTS update_user_context_timestamp ON public.user_conversation_context;
DROP FUNCTION IF EXISTS public.update_context_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recreate the trigger
CREATE TRIGGER update_user_context_timestamp
  BEFORE UPDATE ON public.user_conversation_context
  FOR EACH ROW EXECUTE FUNCTION public.update_context_timestamp();