-- Create table for storing AI function prompts
CREATE TABLE public.ai_function_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  prompt_section TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(function_name, prompt_section)
);

-- Enable RLS
ALTER TABLE public.ai_function_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage AI function prompts" 
ON public.ai_function_prompts 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create trigger for timestamps
CREATE TRIGGER update_ai_function_prompts_updated_at
BEFORE UPDATE ON public.ai_function_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompts for voice function
INSERT INTO public.ai_function_prompts (function_name, prompt_section, prompt_content) VALUES 
('analyze-food-voice', 'composite_rules', 'COMPOSITE FOOD INTELLIGENCE:
- "Omelette from X, Y, Z" = ONE omelette entry (combine all ingredients nutritionally)
- "Sandwich with X" = ONE sandwich entry (bread + filling combined)
- "Salad with X, Y" = ONE salad entry (all components combined)
- "Pancakes with syrup" = ONE pancake entry (including syrup)'),

('analyze-food-voice', 'portion_estimation', 'PORTION ESTIMATION (convert to grams):
- "handful of cheese/nuts" = 30g
- "handful of mushrooms/vegetables" = 40g
- "handful of berries" = 80g
- "slice of bread" = 25g
- "slice of cheese" = 20g
- "piece of chicken breast" = 120g
- "egg" = 50g each
- When amount unclear, use realistic portion sizes'),

('analyze-food-voice', 'nutrition_calculation', 'NUTRITION CALCULATION:
- For composite dishes, calculate combined nutrition of all ingredients
- Account for cooking methods (oil absorption, water loss, etc.)
- Use realistic calorie densities per 100g'),

('analyze-food-voice', 'deduplication_logic', 'SMART DEDUPLICATION:
- NEVER create separate entries for ingredients of a composite dish
- If user mentions multiple similar items, create appropriate separate entries
- Combine obviously related ingredients into finished dishes'),

('analyze-food-voice', 'contextual_understanding', 'CONTEXTUAL UNDERSTANDING:
- "from" indicates ingredients of a dish → combine into one entry
- "and" between separate foods → create separate entries
- "with" usually indicates accompaniments → combine or separate based on context');

-- Insert default prompts for image function
INSERT INTO public.ai_function_prompts (function_name, prompt_section, prompt_content) VALUES 
('analyze-food-image', 'food_identification', 'Your goals: (1) identify the food precisely (read any on-pack text/brand/flavor), (2) read nutrition labels when visible, (3) if no label, estimate from typical values and visible cues.'),

('analyze-food-image', 'nutrition_reading', 'Pay extra attention to dairy/yogurt variants (Greek, Skyr, plain vs flavored). If a fat percentage is shown (e.g., 0%, 2%, 10%), use it to adjust calories and macros.'),

('analyze-food-image', 'fallback_estimation', 'If a barcode or label text is visible, incorporate it. Always return valid JSON only, no other text.'),

('analyze-food-image', 'output_format', 'Return ONLY JSON with this shape:
{
  "name": "Food name (include brand/type if visible)",
  "calories_per_100g": number,
  "carbs_per_100g": number,
  "estimated_serving_size": number, // grams
  "confidence": number, // 0-1
  "description": "Brief rationale (e.g., label read, visible yogurt 2% fat, vanilla)"
}');