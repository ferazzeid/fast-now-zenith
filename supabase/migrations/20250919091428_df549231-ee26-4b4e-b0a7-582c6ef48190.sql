-- Update existing ai_usage_logs table to support enhanced tracking
-- Add missing columns
ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS feature_type TEXT DEFAULT 'general';

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS output_tokens INTEGER;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS input_characters INTEGER;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS request_metadata JSONB;

ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update feature_type constraint
ALTER TABLE public.ai_usage_logs 
DROP CONSTRAINT IF EXISTS ai_usage_logs_feature_type_check;

ALTER TABLE public.ai_usage_logs 
ADD CONSTRAINT ai_usage_logs_feature_type_check 
CHECK (feature_type IN ('voice_analysis', 'image_analysis', 'text_to_speech', 'transcription', 'general'));

-- Migrate existing data to new schema
UPDATE public.ai_usage_logs 
SET 
  feature_type = CASE 
    WHEN request_type = 'voice' THEN 'voice_analysis'
    WHEN request_type = 'transcription' THEN 'transcription' 
    WHEN request_type = 'image' THEN 'image_analysis'
    ELSE 'general'
  END,
  input_tokens = COALESCE(tokens_used, 0),
  success = true
WHERE feature_type = 'general';

-- Update RLS policies to use new column names
DROP POLICY IF EXISTS "System can insert AI usage logs" ON public.ai_usage_logs;

CREATE POLICY "System can insert AI usage logs" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_type 
ON public.ai_usage_logs(feature_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_success 
ON public.ai_usage_logs(success, created_at DESC);

-- Add trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_ai_usage_logs_updated_at ON public.ai_usage_logs;

CREATE TRIGGER update_ai_usage_logs_updated_at
  BEFORE UPDATE ON public.ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();