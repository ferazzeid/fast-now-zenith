
-- Add AI model preferences to shared settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES 
  ('default_speech_model', 'gpt-4o-mini-realtime'),
  ('default_transcription_model', 'whisper-1'),
  ('default_tts_model', 'tts-1'),
  ('default_tts_voice', 'alloy')
ON CONFLICT (setting_key) DO NOTHING;

-- Add user-specific model preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN speech_model TEXT DEFAULT 'gpt-4o-mini-realtime',
ADD COLUMN transcription_model TEXT DEFAULT 'whisper-1',
ADD COLUMN tts_model TEXT DEFAULT 'tts-1',
ADD COLUMN tts_voice TEXT DEFAULT 'alloy',
ADD COLUMN use_own_api_key BOOLEAN DEFAULT FALSE;

-- Add model costs tracking table for usage monitoring
CREATE TABLE public.ai_model_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  input_cost_per_token DECIMAL(10,8) DEFAULT 0,
  output_cost_per_token DECIMAL(10,8) DEFAULT 0,
  audio_cost_per_minute DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on model costs
ALTER TABLE public.ai_model_costs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage model costs
CREATE POLICY "Admins can manage model costs" 
ON public.ai_model_costs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert current OpenAI model costs (as of latest pricing)
INSERT INTO public.ai_model_costs (model_name, input_cost_per_token, output_cost_per_token, audio_cost_per_minute) VALUES
  ('gpt-4o-mini-realtime', 0.000000150, 0.000000600, 0.06),
  ('gpt-4o-realtime', 0.000005000, 0.000020000, 0.24),
  ('whisper-1', 0.000000000, 0.000000000, 0.006),
  ('tts-1', 0.000000000, 0.000015000, 0.000),
  ('tts-1-hd', 0.000000000, 0.000030000, 0.000);

-- Add trigger for updated_at on model costs
CREATE TRIGGER update_ai_model_costs_updated_at
BEFORE UPDATE ON public.ai_model_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update AI usage logs to include model and cost tracking
ALTER TABLE public.ai_usage_logs 
ADD COLUMN model_used TEXT,
ADD COLUMN estimated_cost DECIMAL(10,8) DEFAULT 0,
ADD COLUMN audio_duration_seconds INTEGER DEFAULT 0;
