-- Add enable_ceramic_animations to profiles table
ALTER TABLE public.profiles 
ADD COLUMN enable_ceramic_animations boolean DEFAULT true;