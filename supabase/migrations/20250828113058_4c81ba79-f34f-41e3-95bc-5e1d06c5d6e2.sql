-- Add read_more_url column to fasting_hours table
ALTER TABLE public.fasting_hours 
ADD COLUMN read_more_url text;