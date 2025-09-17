-- Add missing prompt for text input specific handling
INSERT INTO ai_function_prompts (function_name, prompt_section, prompt_content)
VALUES (
  'analyze-food-voice',
  'text_input_specific', 
  'TEXT INPUT SPECIFIC HANDLING:

TYPED INPUT ADVANTAGES:
- Users can be more specific about quantities and descriptions
- Less ambiguity compared to voice transcription
- Can handle complex food descriptions better

PARSING APPROACH:
- Look for precise quantities: "250g chicken breast" = exact weight
- Handle mixed units: "2 cups rice + 1 tbsp oil" = convert to grams appropriately
- Parse brand names and specific varieties: "Dannon Greek yogurt 0% fat"
- Recognize cooking methods in text: "grilled", "fried", "baked"

CAPITALIZATION:
- Always return food names with proper capitalization
- "chicken breast" → "Chicken Breast"
- "greek yogurt with honey" → "Greek Yogurt with Honey"

QUALITY EXPECTATIONS:
- Higher precision expected from typed input
- More detailed nutritional analysis possible
- Users typing tend to provide more context'
)
ON CONFLICT (function_name, prompt_section)
DO UPDATE SET 
  prompt_content = EXCLUDED.prompt_content,
  updated_at = now();