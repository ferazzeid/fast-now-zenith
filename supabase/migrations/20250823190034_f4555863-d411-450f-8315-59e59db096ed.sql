-- Add units column to profiles table for unified measurement system
ALTER TABLE public.profiles 
ADD COLUMN units text DEFAULT 'imperial' CHECK (units IN ('metric', 'imperial'));