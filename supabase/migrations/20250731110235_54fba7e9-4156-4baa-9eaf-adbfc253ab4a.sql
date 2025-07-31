-- Add goal_weight column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN goal_weight numeric NULL;