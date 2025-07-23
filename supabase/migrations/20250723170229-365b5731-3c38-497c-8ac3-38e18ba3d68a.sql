-- Add image_url column to motivators table for storing motivational images
ALTER TABLE public.motivators 
ADD COLUMN image_url TEXT;