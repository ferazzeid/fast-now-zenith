-- Add enable_daily_reset column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'enable_daily_reset') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN enable_daily_reset boolean DEFAULT false;
    END IF;
END $$;