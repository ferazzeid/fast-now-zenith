-- Add sex and onboarding completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;