-- Add fasting_mode preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN fasting_mode text DEFAULT 'extended' CHECK (fasting_mode IN ('extended', 'intermittent'));