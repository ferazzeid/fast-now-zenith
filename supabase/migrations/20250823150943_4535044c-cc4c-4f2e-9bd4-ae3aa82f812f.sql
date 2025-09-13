-- Add manual TDEE override field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN manual_tdee_override integer DEFAULT NULL;