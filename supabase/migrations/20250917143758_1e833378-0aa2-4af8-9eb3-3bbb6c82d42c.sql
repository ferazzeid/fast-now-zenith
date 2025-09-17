-- Update base_prompt to be foundational only
UPDATE ai_function_prompts 
SET prompt_content = 'You are a food nutrition analyzer. Your job is to analyze user food input and create appropriate food entries with accurate nutritional information.'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'base_prompt';

-- Update composite_rules to include individual vs composite logic  
INSERT INTO ai_function_prompts (function_name, prompt_section, prompt_content)
VALUES (
  'analyze-food-voice',
  'composite_rules', 
  'INDIVIDUAL vs COMPOSITE RULES:
- Individual items: If user mentions multiple separate items (e.g., "6 eggs"), list each item separately
- Composite dishes: If user mentions a prepared dish/recipe (e.g., "omelet from 4 eggs"), create one entry with the dish name and combined nutritional values
- Use descriptive names for composite dishes (e.g., "Omelet from 4 eggs")

COMPOSITE FOOD INTELLIGENCE:
- "Omelette from X, Y, Z" = ONE omelette entry (combine all ingredients nutritionally)
- "Sandwich with X" = ONE sandwich entry (bread + filling combined)  
- "Salad with X, Y" = ONE salad entry (all components combined)
- "Pancakes with syrup" = ONE pancake entry (including syrup)'
)
ON CONFLICT (function_name, prompt_section)
DO UPDATE SET 
  prompt_content = EXCLUDED.prompt_content,
  updated_at = now();