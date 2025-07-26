-- Add consumed column to food_entries table
ALTER TABLE public.food_entries 
ADD COLUMN consumed boolean NOT NULL DEFAULT false;

-- Update existing entries to be marked as consumed (since they were logged as eaten)
UPDATE public.food_entries 
SET consumed = true 
WHERE consumed = false;