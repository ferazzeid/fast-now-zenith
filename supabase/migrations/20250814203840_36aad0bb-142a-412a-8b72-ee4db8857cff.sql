-- Remove units field from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS units;