-- Make slug field nullable in motivators table
ALTER TABLE public.motivators ALTER COLUMN slug DROP NOT NULL;

-- Clear all existing slugs from personal motivators (user-generated content)
UPDATE public.motivators SET slug = NULL;