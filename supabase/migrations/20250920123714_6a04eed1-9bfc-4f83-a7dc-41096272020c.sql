UPDATE ai_function_prompts 
SET prompt_content = 'PORTION SIZE ESTIMATION FRAMEWORK:

USER QUANTITY PRESERVATION - CRITICAL:
- ALWAYS preserve exact quantities specified by user
- "380 grams of pickles" = 380g serving size (NOT 100g default)
- "6 eggs" = 300g total serving (6 × 50g per egg)
- User-specified amounts take absolute priority over defaults

UNIT CONVERSIONS FOR COUNTS:
Common Items:
- 1 egg = ~50g (so "6 eggs" = 300g total)
- 1 slice bread = ~25-30g
- 1 apple (medium) = ~150g
- 1 banana (medium) = ~120g
- 1 cup rice (cooked) = ~200g

MASS-TO-COUNT CONVERSION:
- "kilogram of apples" = ~5-6 medium apples (150-200g each)
- "pound of carrots" = ~4-5 medium carrots (90-120g each)
- "500g cucumbers" = ~2 medium cucumbers (250g each)

CONTAINER/PACKAGE WEIGHTS:
- "jar of pickles" = use specified weight if given, else estimate ~300-400g
- "can of tuna" = ~165g drained weight
- "bottle of juice" = check volume, convert to grams

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
- NEVER default to 100g when user specifies quantity
- Always estimate individual weights for counted items
- Use size modifiers to adjust base weights
- For mass quantities: divide by individual weight to get count
- Account for preparation method (raw vs cooked weights)
- Return ONE complete function call with all correct portions'
WHERE function_name = 'analyze-food-voice' AND prompt_section = 'portion_estimation'