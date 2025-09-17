-- Add enable_goals_in_animations column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN enable_goals_in_animations boolean DEFAULT true;