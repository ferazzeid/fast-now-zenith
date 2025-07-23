-- Add openai_api_key column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN openai_api_key TEXT;