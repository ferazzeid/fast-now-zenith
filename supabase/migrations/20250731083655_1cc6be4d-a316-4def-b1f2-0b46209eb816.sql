-- Add default walking speed to profiles table
ALTER TABLE public.profiles 
ADD COLUMN default_walking_speed NUMERIC DEFAULT 3;