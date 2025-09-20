-- Retrofit existing food entries with missing per-100g nutritional data
-- This migration calculates per-100g values for entries that don't have them

-- Update food_entries table with missing per-100g data
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
  protein_per_100g = CASE 
    WHEN protein_per_100g IS NULL AND serving_size > 0 AND protein IS NOT NULL AND protein > 0 
    THEN (protein / serving_size) * 100 
    ELSE protein_per_100g 
  END,
  fat_per_100g = CASE 
    WHEN fat_per_100g IS NULL AND serving_size > 0 AND fat IS NOT NULL AND fat > 0 
    THEN (fat / serving_size) * 100 
    ELSE fat_per_100g 
  END,
  updated_at = now()
WHERE 
  (calories_per_100g IS NULL AND serving_size > 0 AND calories > 0) OR
  (carbs_per_100g IS NULL AND serving_size > 0 AND carbs > 0) OR
  (protein_per_100g IS NULL AND serving_size > 0 AND protein IS NOT NULL AND protein > 0) OR
  (fat_per_100g IS NULL AND serving_size > 0 AND fat IS NOT NULL AND fat > 0);

-- Update user_foods table with missing per-100g data where possible
-- Note: user_foods already has calories_per_100g and carbs_per_100g as required fields
-- but we may need to add protein_per_100g and fat_per_100g columns if they don't exist

-- Update default_foods table with missing per-100g data where possible
-- Note: default_foods already has calories_per_100g and carbs_per_100g as required fields