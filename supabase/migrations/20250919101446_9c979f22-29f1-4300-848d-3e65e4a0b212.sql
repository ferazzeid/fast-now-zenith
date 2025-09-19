-- Add per-100g nutritional data and manual override tracking to food_entries table
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS calories_per_100g numeric;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS carbs_per_100g numeric;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS protein_per_100g numeric;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS fat_per_100g numeric;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS calories_manually_set boolean DEFAULT false;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS carbs_manually_set boolean DEFAULT false;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS protein_manually_set boolean DEFAULT false;
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS fat_manually_set boolean DEFAULT false;

-- Add comment to document the enhancement
COMMENT ON COLUMN public.food_entries.calories_per_100g IS 'Nutritional data per 100g for smart recalculation';
COMMENT ON COLUMN public.food_entries.calories_manually_set IS 'Flag to track if calories were manually overridden';