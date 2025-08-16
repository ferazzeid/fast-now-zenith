-- Add enable_food_image_generation column to profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'enable_food_image_generation') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN enable_food_image_generation boolean DEFAULT false;
    END IF;
END $$;