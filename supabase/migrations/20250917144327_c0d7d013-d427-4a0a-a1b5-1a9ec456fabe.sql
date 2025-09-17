-- Add quantity handling rules for numbered items
INSERT INTO ai_function_prompts (function_name, prompt_section, prompt_content)
VALUES (
  'analyze-food-voice',
  'quantity_handling', 
  'QUANTITY HANDLING RULES:

NUMBERED ITEMS - ALWAYS CREATE SEPARATE ENTRIES:
- "3 cucumbers" = 3 separate cucumber entries
- "5 eggs" = 5 separate egg entries  
- "2 apples" = 2 separate apple entries
- "6 carrots" = 6 separate carrot entries

CRITICAL: Never combine numbered individual items into single entries!

QUANTITY INDICATORS:
- Numbers: "three", "3", "five", "dozen" = create that many entries
- Plurals without numbers: estimate typical serving (e.g., "eggs" = 2-3 entries)
- Mass quantities: "kilogram of X" = calculate appropriate number of individual items

IMPLEMENTATION:
- For "X [number] [items]": Create [number] separate entries of [item]
- Each entry should have individual typical weight/nutrition
- Use size modifiers to adjust individual weights appropriately'
)
ON CONFLICT (function_name, prompt_section)
DO UPDATE SET 
  prompt_content = EXCLUDED.prompt_content,
  updated_at = now();

-- Add size modifier handling with specific vegetable weights
INSERT INTO ai_function_prompts (function_name, prompt_section, prompt_content)
VALUES (
  'analyze-food-voice',
  'size_modifiers', 
  'SIZE MODIFIER WEIGHT ESTIMATES:

VEGETABLE SIZE GUIDELINES:
Cucumbers:
- Small: 150-200g
- Medium: 200-250g  
- Large: 250-350g
- Extra large: 350-450g

Apples:
- Small: 100-150g
- Medium: 150-200g
- Large: 200-300g

Carrots:
- Small: 50-80g
- Medium: 80-120g
- Large: 120-180g

Tomatoes:
- Small: 80-120g
- Medium: 120-180g
- Large: 180-250g

MODIFIER INTERPRETATION:
- "large" = use upper range of large category
- "huge/extra large" = use extra large range
- "small" = use lower range of small category
- No modifier = assume medium size
- "baby" vegetables = use very small estimates (30-50% of small)'
)
ON CONFLICT (function_name, prompt_section)
DO UPDATE SET 
  prompt_content = EXCLUDED.prompt_content,
  updated_at = now();

-- Update composite_rules to strengthen individual item logic
UPDATE ai_function_prompts 
SET prompt_content = 'INDIVIDUAL vs COMPOSITE RULES:

INDIVIDUAL ITEMS (Create separate entries):
- Numbered items: "3 large cucumbers" = 3 separate cucumber entries
- Distinct foods: "apple and banana" = 2 separate entries
- Multiple servings: "two sandwiches" = 2 separate sandwich entries

COMPOSITE DISHES (Create single entry):
- Prepared recipes: "omelet from 4 eggs" = 1 omelet entry
- Mixed dishes: "salad with tomatoes and cucumbers" = 1 salad entry
- Cooked combinations: "stir-fry with vegetables" = 1 stir-fry entry

CRITICAL DISTINCTION:
- If ingredients maintain individual identity → separate entries
- If ingredients are combined/cooked together → single entry
- When in doubt: Would someone eat these items separately? If yes → separate entries

EXAMPLES:
✓ "3 large cucumbers" → 3 cucumber entries (~250-350g each)
✓ "kilogram of apples" → ~5-6 apple entries (~150-200g each)
✗ "cucumber salad" → 1 salad entry (ingredients combined)'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'composite_rules';

-- Update portion_estimation to include mass-to-count conversion
UPDATE ai_function_prompts 
SET prompt_content = 'PORTION SIZE ESTIMATION FRAMEWORK:

MASS-TO-COUNT CONVERSION:
- "kilogram of apples" = ~5-6 medium apples (150-200g each)
- "pound of carrots" = ~4-5 medium carrots (90-120g each)
- "500g cucumbers" = ~2 medium cucumbers (250g each)

INDIVIDUAL ITEM WEIGHTS:
Fruits:
- Apple (medium): 150-200g
- Banana (medium): 120-150g
- Orange (medium): 180-220g

Vegetables:
- Cucumber (large): 250-350g
- Carrot (medium): 80-120g
- Tomato (medium): 120-180g
- Potato (medium): 150-200g

HAND-BASED REFERENCES:
- Palm size (without fingers) = ~100g protein
- Thumb tip to first joint = ~15g 
- Cupped hand = ~100-150ml liquid/grain
- Closed fist = ~200-250ml volume

CONVERSION PRINCIPLES:
- Always estimate individual weights for counted items
- Use size modifiers to adjust base weights
- For mass quantities: divide by individual weight to get count
- Account for preparation method (raw vs cooked weights)'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'portion_estimation';