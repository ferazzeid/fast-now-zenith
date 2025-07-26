-- Add units column to profiles table for imperial/metric system
ALTER TABLE public.profiles 
ADD COLUMN units text CHECK (units IN ('metric', 'imperial')) DEFAULT 'imperial';