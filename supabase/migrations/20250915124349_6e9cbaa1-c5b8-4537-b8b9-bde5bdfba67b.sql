-- Add primary_color field to profiles table for user customization
ALTER TABLE public.profiles 
ADD COLUMN primary_color TEXT DEFAULT '#3b82f6';