-- Clean up legacy generate-image functionality
-- Remove unused table for image generation tracking

DROP TABLE IF EXISTS public.motivator_image_generations CASCADE;