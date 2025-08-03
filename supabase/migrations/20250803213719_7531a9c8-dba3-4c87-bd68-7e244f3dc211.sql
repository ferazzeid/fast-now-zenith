-- Add slideshow preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN enable_fasting_slideshow BOOLEAN DEFAULT true,
ADD COLUMN enable_walking_slideshow BOOLEAN DEFAULT true;