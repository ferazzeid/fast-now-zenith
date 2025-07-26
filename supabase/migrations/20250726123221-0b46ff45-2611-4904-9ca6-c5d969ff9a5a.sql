-- Add activity level to profiles table
ALTER TABLE public.profiles 
ADD COLUMN activity_level text DEFAULT 'sedentary';

-- Add comment for reference
COMMENT ON COLUMN public.profiles.activity_level IS 'Activity level for TDEE calculation: sedentary, lightly_active, moderately_active, very_active, extremely_active';