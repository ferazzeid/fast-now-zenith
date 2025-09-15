-- Add navigation preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN navigation_preferences jsonb DEFAULT '{"fast": true, "walk": true, "food": true, "goals": true}'::jsonb;