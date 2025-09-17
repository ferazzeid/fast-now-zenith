-- Update voice prompts with improved AI instruction patterns
UPDATE public.ai_function_prompts SET prompt_content = 
'COMPOSITE FOOD DETECTION PATTERNS:

LINGUISTIC INDICATORS:
- "made from/with/of [ingredients]" → Single dish combining all components
- "topped with/covered in" → Include toppings in main dish
- "filled with" → Single item with filling incorporated
- "mixed with" → Combined preparation

DECISION FRAMEWORK:
- If ingredients are combined during preparation → ONE entry
- If items are served separately → SEPARATE entries  
- If cooking transforms ingredients → COMBINED nutrition

EXAMPLES OF APPLICATION:
- Pizza → Single entry (dough + cheese + toppings combined)
- Stir-fry → Single entry (all vegetables + protein + oil combined)
- Salad → Single entry when ingredients are mixed together
- Soup → Single entry (all ingredients in liquid base)'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'composite_rules';

UPDATE public.ai_function_prompts SET prompt_content = 
'PORTION SIZE ESTIMATION FRAMEWORK:

HAND-BASED REFERENCES:
- Palm size (without fingers) = ~100g protein
- Thumb tip to first joint = ~15g 
- Cupped hand = ~100-150ml liquid/grain
- Closed fist = ~200-250ml volume

STANDARD FOOD PORTIONS:
- Bread slice = 25-30g
- Cheese slice = 20-25g  
- Medium egg = 50g
- Chicken breast piece = 100-150g
- Standard serving spoon = ~15g

CONVERSION PRINCIPLES:
- Convert descriptive amounts to grams when possible
- Use context clues (plate size, comparison objects)
- Default to realistic single-serving portions
- Account for preparation method (raw vs cooked weights)'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'portion_estimation';

UPDATE public.ai_function_prompts SET prompt_content = 
'NUTRITION CALCULATION METHODOLOGY:

COMPOSITE DISH NUTRITION:
1. Calculate each ingredient''s contribution based on estimated amount
2. Sum all nutritional values proportionally
3. Account for cooking effects (oil absorption, water loss/gain)
4. Consider preparation method impacts on calories

COOKING ADJUSTMENTS:
- Frying: Add 10-20% calories for oil absorption
- Boiling/steaming: Minimal calorie change, possible nutrient loss
- Roasting: Concentrate flavors, minimal calorie addition
- Sauces/dressings: Include full nutritional content

ACCURACY PRINCIPLES:
- Err on the side of realistic portions over exact precision
- Use standard nutritional databases as reference
- Consider food quality and preparation style'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'nutrition_calculation';

UPDATE public.ai_function_prompts SET prompt_content = 
'INTELLIGENT ENTRY CREATION:

SINGLE ENTRY TRIGGERS:
- Ingredients mentioned as part of preparation process
- Components that lose individual identity when combined
- Items that are typically consumed together as one dish

SEPARATE ENTRY TRIGGERS:  
- Items served on different plates/bowls
- Foods with distinct eating occasions mentioned
- Items that maintain their individual identity

DECISION LOGIC:
- Ask: "Would someone typically track these items separately?"
- Consider: "Do these components form a cohesive dish?"
- Evaluate: "Are portions given for the whole or individual parts?"

EDGE CASES:
- Side dishes → Usually separate unless specifically combined
- Condiments → Include with main dish unless portion is substantial
- Beverages → Always separate entries unless cooking ingredient'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'deduplication_logic';

UPDATE public.ai_function_prompts SET prompt_content = 
'NATURAL LANGUAGE INTERPRETATION:

KEY PHRASES AND MEANINGS:
- "made with/from" → Indicates ingredient relationship
- "along with/plus" → Suggests separate items
- "in/inside" → Component of larger dish
- "on top of/over" → Usually part of main dish
- "side of" → Typically separate entry

CONTEXT ANALYSIS:
- Consider meal structure and typical serving patterns
- Understand regional/cultural food combinations
- Recognize cooking terminology vs serving descriptions
- Distinguish between preparation and presentation

AMBIGUITY RESOLUTION:
- When unclear, favor the most common interpretation
- Consider portion context (small amounts likely ingredients)
- Ask yourself: "How would a typical person track this meal?"
- Default to practical food tracking behavior'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'contextual_understanding';

-- Update image prompts with improved patterns
UPDATE public.ai_function_prompts SET prompt_content = 
'SYSTEMATIC FOOD IDENTIFICATION APPROACH:

VISUAL ANALYSIS PRIORITY:
1. Text/labels - Read all visible text for brand, product name, variety
2. Physical characteristics - Color, texture, shape, size indicators  
3. Packaging cues - Container type, serving suggestions, preparation state
4. Contextual clues - Setting, utensils, portion presentation

IDENTIFICATION METHODOLOGY:
- Start with most specific identifiable features
- Work from concrete (labels) to interpretive (visual estimation)
- Consider food category, then narrow to specific type
- Note preparation state (raw, cooked, processed)

ACCURACY FRAMEWORK:
- Prioritize readable information over visual guesses
- Cross-reference visual cues with text when available
- Consider multiple possible identifications if uncertain
- Factor in common food variations and regional differences'
WHERE function_name = 'analyze-food-image' AND prompt_section = 'food_identification';

UPDATE public.ai_function_prompts SET prompt_content = 
'NUTRITION LABEL READING PROTOCOL:

SYSTEMATIC LABEL ANALYSIS:
1. Locate "Nutrition Facts" or equivalent labeling
2. Identify serving size and units (per 100g, per serving, per container)
3. Extract calories, carbohydrates, fats, proteins if visible
4. Note any percentage indicators (fat content, daily values)

DAIRY/YOGURT SPECIFIC ATTENTION:
- Fat percentage indicators (0%, 2%, 10%, whole milk, etc.)
- Type descriptors (Greek, regular, skyr, kefir)
- Flavor additions (plain, vanilla, fruit, sweetened)
- Protein content variations between types

CALCULATION ADJUSTMENTS:
- Convert per-serving values to per-100g when needed
- Factor in fat percentage for calorie estimation
- Account for added sugars in flavored varieties
- Recognize processing effects on nutrition density'
WHERE function_name = 'analyze-food-image' AND prompt_section = 'nutrition_reading';

UPDATE public.ai_function_prompts SET prompt_content = 
'FALLBACK ESTIMATION STRATEGIES:

WHEN NO NUTRITION LABEL VISIBLE:
1. Use visual portion cues and standard food databases
2. Estimate based on food category and apparent preparation
3. Consider ingredient visibility for composite foods
4. Apply typical nutritional ranges for food type

BARCODE/TEXT UTILIZATION:
- Extract any visible product codes or brand information
- Use partial text for product identification
- Cross-reference visible information with known products
- Note manufacturing codes or batch information if helpful

CONFIDENCE ASSESSMENT:
- High confidence: Clear labels with readable nutrition facts
- Medium confidence: Identifiable product with partial information
- Low confidence: Visual estimation only with typical food values

ESTIMATION PRINCIPLES:
- Be conservative with calorie estimates when uncertain
- Use middle-range values for food categories
- Consider preparation method effects on nutrition
- Provide transparent reasoning for estimates'
WHERE function_name = 'analyze-food-image' AND prompt_section = 'fallback_estimation';

UPDATE public.ai_function_prompts SET prompt_content = 
'STRUCTURED OUTPUT REQUIREMENTS:

MANDATORY JSON FORMAT:
{
  "name": "Specific product name with brand/type details",
  "calories_per_100g": number,
  "carbs_per_100g": number,  
  "estimated_serving_size": number,
  "confidence": number,
  "description": "Clear explanation of analysis method"
}

OUTPUT QUALITY STANDARDS:
- Name: Include brand, flavor, type when identifiable
- Numbers: Realistic values within expected ranges for food type
- Serving size: Practical portion based on visual cues  
- Confidence: 0.8+ for label reads, 0.5-0.7 for visual estimation, <0.5 for guesses
- Description: Explain what information was used (label read, visual cues, estimation)

RESPONSE DISCIPLINE:
- Return ONLY valid JSON, no additional text
- Ensure all required fields are present
- Use realistic numerical ranges
- Make description concise but informative about methodology'
WHERE function_name = 'analyze-food-image' AND prompt_section = 'output_format';