-- Remove global animation settings from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS enable_quotes_in_animations;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS enable_notes_in_animations;

-- Add show_in_animations column to motivators table
ALTER TABLE public.motivators ADD COLUMN IF NOT EXISTS show_in_animations boolean NOT NULL DEFAULT true;