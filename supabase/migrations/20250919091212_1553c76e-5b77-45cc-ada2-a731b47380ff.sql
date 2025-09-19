-- Create enhanced AI usage logging table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('voice_analysis', 'image_analysis', 'text_to_speech', 'transcription', 'general')),
  model_used TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  input_characters INTEGER, -- For TTS
  audio_duration_seconds REAL, -- For Whisper
  estimated_cost DECIMAL(10, 8) NOT NULL DEFAULT 0, -- Cost in USD
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  request_metadata JSONB, -- Additional request details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_usage_logs
CREATE POLICY "Users can view their own AI usage logs" 
ON public.ai_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage logs" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (true); -- Allow system/edge functions to insert

CREATE POLICY "Admins can view all AI usage logs" 
ON public.ai_usage_logs 
FOR ALL 
USING (public.is_current_user_admin());

-- Create index for performance
CREATE INDEX idx_ai_usage_logs_user_created 
ON public.ai_usage_logs(user_id, created_at DESC);

CREATE INDEX idx_ai_usage_logs_model_created 
ON public.ai_usage_logs(model_used, created_at DESC);

CREATE INDEX idx_ai_usage_logs_feature_created 
ON public.ai_usage_logs(feature_type, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_usage_logs_updated_at
  BEFORE UPDATE ON public.ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();