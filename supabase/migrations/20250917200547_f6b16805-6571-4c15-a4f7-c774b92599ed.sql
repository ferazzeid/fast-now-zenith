-- Add missing animation setting columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS enable_food_slideshow boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_quotes_in_animations boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_notes_in_animations boolean DEFAULT true;