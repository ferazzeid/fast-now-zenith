-- Add new fields to fasting_hours table for enhanced content rotation
ALTER TABLE public.fasting_hours 
ADD COLUMN IF NOT EXISTS benefits_challenges TEXT,
ADD COLUMN IF NOT EXISTS content_snippet TEXT,
ADD COLUMN IF NOT EXISTS content_rotation_data JSONB DEFAULT '{"current_index": 0, "variants": []}'::jsonb,
ADD COLUMN IF NOT EXISTS metabolic_changes TEXT,
ADD COLUMN IF NOT EXISTS physiological_effects TEXT,
ADD COLUMN IF NOT EXISTS mental_emotional_state TEXT[],
ADD COLUMN IF NOT EXISTS stage TEXT;

-- Update existing data to use new field names (copy data over)
UPDATE public.fasting_hours 
SET 
  stage = phase,
  physiological_effects = body_state,
  metabolic_changes = scientific_info,
  mental_emotional_state = common_feelings
WHERE stage IS NULL OR physiological_effects IS NULL OR metabolic_changes IS NULL;

-- Add index for better performance on content rotation queries
CREATE INDEX IF NOT EXISTS idx_fasting_hours_hour_content ON public.fasting_hours(hour, stage);

-- Add check constraint for content rotation data structure
ALTER TABLE public.fasting_hours 
ADD CONSTRAINT check_content_rotation_data 
CHECK (content_rotation_data ? 'current_index' AND content_rotation_data ? 'variants');