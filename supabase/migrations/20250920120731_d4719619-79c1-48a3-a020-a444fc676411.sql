-- Retrofit existing food entries with missing per-100g nutritional data
-- This migration calculates per-100g values for entries that don't have them
-- Note: food_entries table only has calories and carbs as base columns

-- Update food_entries table with missing per-100g data (only for calories and carbs)
UPDATE public.food_entries 
SET 
  calories_per_100g = CASE 
    WHEN calories_per_100g IS NULL AND serving_size > 0 AND calories > 0 
    THEN (calories / serving_size) * 100 
    ELSE calories_per_100g 
  END,
  carbs_per_100g = CASE 
    WHEN carbs_per_100g IS NULL AND serving_size > 0 AND carbs > 0 
    THEN (carbs / serving_size) * 100 
    ELSE carbs_per_100g 
  END,
  updated_at = now()
WHERE 
  (calories_per_100g IS NULL AND serving_size > 0 AND calories > 0) OR
  (carbs_per_100g IS NULL AND serving_size > 0 AND carbs > 0);

-- Log the number of rows updated
-- Note: This is informational, no actual logging in migrations