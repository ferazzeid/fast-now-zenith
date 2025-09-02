-- Add target_deficit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN target_deficit integer DEFAULT 1000;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.target_deficit IS 'Daily calorie deficit target in kcal, used to calculate dynamic calorie goals';