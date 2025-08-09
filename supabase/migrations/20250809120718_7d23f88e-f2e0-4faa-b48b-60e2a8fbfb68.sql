-- Remove API key fields from profiles table since we no longer support BYO API keys
ALTER TABLE public.profiles DROP COLUMN IF EXISTS use_own_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS openai_api_key;