-- Add paid user status and usage tracking
ALTER TABLE public.profiles 
ADD COLUMN is_paid_user BOOLEAN DEFAULT FALSE,
ADD COLUMN monthly_ai_requests INTEGER DEFAULT 0,
ADD COLUMN ai_requests_reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()) + interval '1 month';

-- Create shared settings table for admin-managed OpenAI key
CREATE TABLE public.shared_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared_settings
ALTER TABLE public.shared_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage shared settings
CREATE POLICY "Admins can manage shared settings" 
ON public.shared_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default shared OpenAI key setting
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES ('shared_openai_key', NULL);

-- Create AI usage tracking table
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'chat', 'motivator', 'voice', etc.
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_usage_logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage, admins can view all
CREATE POLICY "Users can view their own AI usage" 
ON public.ai_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI usage" 
ON public.ai_usage_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only authenticated users can insert usage logs
CREATE POLICY "Users can insert their own AI usage" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on shared_settings
CREATE TRIGGER update_shared_settings_updated_at
BEFORE UPDATE ON public.shared_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();