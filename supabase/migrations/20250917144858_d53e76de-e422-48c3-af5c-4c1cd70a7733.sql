-- Update AI function prompts to include per-100g nutrition calculation guidance
UPDATE ai_function_prompts 
SET prompt_content = 'NUTRITION CALCULATION AND PER-100G DATA:

ALWAYS PROVIDE BOTH TOTAL AND PER-100G VALUES:
- Calculate accurate total nutrition for the estimated serving size
- ALWAYS calculate and provide per-100g nutritional density data
- This enables automatic recalculation when users adjust portion sizes

CALCULATION APPROACH:
1. Estimate realistic serving size in grams
2. Calculate total calories and macros for that serving
3. Calculate per-100g values: (total_nutrition / serving_grams) * 100

EXAMPLE CALCULATIONS:
"Large apple (200g)":
- Total: 104 calories, 25g carbs
- Per-100g: 52 calories_per_100g, 12.5 carbs_per_100g

"Handful of almonds (30g)":
- Total: 174 calories, 6g carbs
- Per-100g: 580 calories_per_100g, 20 carbs_per_100g

"Chicken breast piece (120g)":
- Total: 198 calories, 0g carbs, 37g protein, 4g fat
- Per-100g: 165 calories_per_100g, 0 carbs_per_100g, 31 protein_per_100g, 3.6 fat_per_100g

ACCURACY REQUIREMENTS:
- Use established nutritional databases for per-100g values
- Account for cooking methods and preparation
- Ensure totals match: (per_100g_value * serving_size / 100)
- Include protein_per_100g and fat_per_100g when available

This per-100g data enables smart portion adjustments and automatic recalculation.'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'nutrition_calculation';